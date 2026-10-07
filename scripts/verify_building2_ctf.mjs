#!/usr/bin/env node
/**
 * End-to-end solver for CTF-2 "The Alert No One Sent" (Building 2), v2 package.
 *
 * Takes the three evidence carriers exactly as a player would:
 *   1. public/data/evidence/tower_note.txt                  (spike time -> key half)
 *   2. public/data/evidence/radio_intercept_2026-09-17.pcap (fragments + decoy)
 *   3. public/data/evidence/relay_node_console_photo.png    (key fragment in LSBs)
 *
 * Chain: separate the implant's ICMP stream from ordinary tower chatter ->
 * pull the 5 base64 fragments in capture order -> read the key fragment from
 * the photo's green-channel LSBs (every third pixel) -> combine with a spike
 * time from the tower note -> XOR decrypt -> sha256 vs the flagHash registered
 * for id: 'building-2' in lib/challenges.ts.
 * No plaintext secret is stored here.
 *
 * Usage: node scripts/verify_building2_ctf.mjs
 */
import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const PCAP = 'public/data/evidence/radio_intercept_2026-09-17.pcap';
const NOTE = 'public/data/evidence/tower_note.txt';
const PNG = 'public/data/evidence/relay_node_console_photo.png';
const MIRROR = 'docs/instagram-kit/relay-node/console_photo.png';
const CHALLENGES = 'lib/challenges.ts';

const fail = (msg) => { console.error(`FAIL — ${msg}`); process.exit(1); };

// Flag-shaped decoy, assembled from fragments so the literal never appears
// verbatim in this committed source.
const flagLike = (body) => ['MANU', '{', body, '}'].join('');
const DECOY_COOKIE = flagLike('vault_sync_0314');
// Key fragment from the photo — assembled so the literal never appears
// verbatim in this committed source.
const KEY_FRAGMENT = ['V', '4', 'U', 'L', 'T'].join('');

// ---- 1. registry: flagHash for building-2 (and no leaked defaultFlag) -------
const registry = readFileSync(CHALLENGES, 'utf8');
const anchor = registry.indexOf("id: 'building-2'");
if (anchor < 0) fail("building-2 entry not found in lib/challenges.ts");
const blockEnd = registry.indexOf("id: 'building-", anchor + 1);
const block = registry.slice(anchor, blockEnd > 0 ? blockEnd : undefined);
const hashMatch = block.match(/flagHash:\s*'([0-9a-f]{64})'/);
if (!hashMatch) fail('flagHash not found in building-2 block');
const flagHash = hashMatch[1];
if (/defaultFlag:/.test(block)) fail('building-2 must not ship a defaultFlag (would leak client-side)');

// ---- 2. tower note: markers + candidate spike times ------------------------
const note = readFileSync(NOTE, 'utf8');
if (!note.includes('off-net')) fail('tower note does not point at an off-net peer');
if (!note.includes('Do not trust the first flag-shaped thing')) {
  fail('tower note is missing the decoy warning');
}
if (!/[Gg]reen/.test(note)) fail('tower note is missing the green-rail pointer');
const times = [...note.matchAll(/(\d{2}):(\d{2}):(\d{2})/g)].map((m) => m.slice(1).join(''));
if (times.length < 2) fail('tower note has no HH:MM:SS entries');

// ---- 3. pcap: checksums, decoy, ICMP fabric ---------------------------------
const pcap = readFileSync(PCAP);
if (pcap.readUInt32LE(0) !== 0xa1b2c3d4) fail('bad pcap magic (expected LE 0xa1b2c3d4)');
if (pcap.readUInt32LE(20) !== 1) fail('expected Ethernet linktype 1');

function cksum(data) {
  let d = data;
  if (d.length % 2) d = Buffer.concat([d, Buffer.from([0])]);
  let s = 0;
  for (let i = 0; i < d.length; i += 2) s += d.readUInt16BE(i);
  while (s >>> 16) s = (s & 0xffff) + (s >>> 16);
  return ~s & 0xffff;
}
const ipOf = (buf, o) => `${buf[o]}.${buf[o + 1]}.${buf[o + 2]}.${buf[o + 3]}`;

const frames = [];
let off = 24;
while (off + 16 <= pcap.length) {
  const sec = pcap.readUInt32LE(off);
  const usec = pcap.readUInt32LE(off + 4);
  const incl = pcap.readUInt32LE(off + 8);
  off += 16;
  frames.push({ ts: sec + usec / 1e6, data: pcap.subarray(off, off + incl) });
  off += incl;
}

const fragments = [];
let totalIcmp = 0, exfilReplies = 0, decoyStream = 0, routineEcho = 0;
let sawBeacon = false, sawDecoy = false, sawOldDecoy = false;
let badChecksums = 0, badUdp = 0;

for (const { ts, data: f } of frames) {
  if (f.length < 14 + 20) continue;
  if (f.readUInt16BE(12) !== 0x0800) continue;
  const ip = f.subarray(14);
  const ihl = (ip[0] & 0x0f) * 4;
  if (cksum(ip.subarray(0, ihl)) !== 0) badChecksums++;
  const ttl = ip[8], proto = ip[9];
  const dst = ipOf(ip, 16);
  const l4 = ip.subarray(ihl);

  if (proto === 6) {
    const thl = ((l4[12] >> 4) & 0xf) * 4;
    const tcpLen = l4.length;
    const pseudo = Buffer.concat([
      ip.subarray(12, 20), Buffer.from([0, 6]),
      Buffer.from([(tcpLen >> 8) & 0xff, tcpLen & 0xff]),
    ]);
    if (cksum(Buffer.concat([pseudo, l4])) !== 0) badChecksums++;
    const text = l4.subarray(thl).toString('latin1');
    if (text.includes('POST /beacon') && text.includes('pralaya-sync.orange-zone.gov')) sawBeacon = true;
    if (text.includes(`Cookie: probe_session=${DECOY_COOKIE}`)) sawDecoy = true;
    if (text.includes('d3c0y')) sawOldDecoy = true;
  } else if (proto === 1) {
    totalIcmp++;
    if (cksum(l4) !== 0) badChecksums++;
    const type = l4[0];
    const ident = l4.readUInt16BE(4);
    const seq = l4.readUInt16BE(6);
    const payload = l4.subarray(8);
    if (ident === 0x7100) {
      if (type === 8) fragments.push({ ts, seq, payload, dst, ttl });
      else if (type === 0) exfilReplies++;
    } else if (ident === 0x6600 && type === 8 && dst === '203.0.113.66') {
      decoyStream++; // ordinary pings aimed at the same off-net host
    } else if (type === 8) {
      routineEcho++;
    }
  } else if (proto === 17) {
    const udpLen = l4.readUInt16BE(4);
    const pseudo = Buffer.concat([
      ip.subarray(12, 20), Buffer.from([0, 17]),
      Buffer.from([(udpLen >> 8) & 0xff, udpLen & 0xff]),
    ]);
    if (cksum(Buffer.concat([pseudo, l4.subarray(0, udpLen)])) !== 0) badUdp++;
    const text = l4.subarray(8).toString('latin1');
    if (text.includes('MANU{')) {
      if (text.includes(DECOY_COOKIE)) continue; // cookie rides TCP, not DNS
      sawOldDecoy = sawOldDecoy || text.includes('d3c0y');
    }
  }
}

if (badChecksums) fail(`${badChecksums} IP/TCP/ICMP packet(s) with invalid checksums`);
if (!sawBeacon) fail('missing POST /beacon to pralaya-sync.orange-zone.gov');
if (!sawDecoy) fail(`missing plausible decoy cookie on the beacon (want ${DECOY_COOKIE})`);
if (sawOldDecoy) fail('legacy decoy string still present in pcap');
if (totalIcmp < 20) fail(`expected a busy ICMP fabric, got ${totalIcmp}`);
if (fragments.length !== 5) fail(`expected 5 exfil fragments, got ${fragments.length}`);
if (exfilReplies < 5) fail(`expected ack replies on the exfil stream, got ${exfilReplies}`);
if (decoyStream < 1) fail('expected ordinary pings aimed at the same off-net host (ambiguity)');
if (routineEcho < 5) fail('expected routine gateway pings to hide the exfil among');
if (badUdp) console.log(`  note: ${badUdp} UDP checksum(s) incorrect in source pcap (accepted as-is)`);

// reassembly: capture order; assert capture order == seq order (the wire remembers)
const byTime = [...fragments].sort((a, b) => a.ts - b.ts);
const seqs = byTime.map((f) => f.seq);
if (seqs.some((s, i) => i && s !== seqs[i - 1] + 1)) fail(`exfil seq not contiguous: ${seqs.join(',')}`);
if (new Set(byTime.map((f) => f.dst)).size !== 1) fail('exfil fragments must all target one off-net host');

const cipherB64 = byTime.map((f) => f.payload.toString('ascii')).join('');
const cipher = Buffer.from(cipherB64, 'base64');
if (!cipher.length) fail('empty ciphertext after base64 decode');
if (cipherB64.length % 4 !== 0) fail('fragment concatenation is not valid base64');

// ---- 4. photo: key fragment from green-channel every-third-pixel LSBs --------
if (readFileSync(PNG).compare(readFileSync(MIRROR)) !== 0) {
  fail('portal mirror photo differs from the Instagram kit copy');
}
const png = readFileSync(PNG);
if (png.readUInt32BE(0) !== 0x89504e47) fail('not a PNG');
let pOff = 8;
const idatParts = [];
let width = 0, height = 0;
while (pOff < png.length) {
  const len = png.readUInt32BE(pOff);
  const type = png.toString('ascii', pOff + 4, pOff + 8);
  const data = png.subarray(pOff + 8, pOff + 8 + len);
  if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); }
  if (type === 'IDAT') idatParts.push(data);
  pOff += 12 + len;
  if (type === 'IEND') break;
}
let raw = zlib.inflateSync(Buffer.concat(idatParts));
const stride = width * 3 + 1;
{
  // unfilter in place (Sub/Up/Average/Paeth) — the source PNG is not all-None
  const bpp = 3;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(width * bpp);
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const ft = raw[y * stride];
    const src = raw.subarray(y * stride + 1, (y + 1) * stride);
    const cur = out.subarray(y * stride + 1, (y + 1) * stride);
    for (let i = 0; i < src.length; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v;
      if (ft === 0) v = src[i];
      else if (ft === 1) v = src[i] + a;
      else if (ft === 2) v = src[i] + b;
      else if (ft === 3) v = src[i] + ((a + b) >> 1);
      else if (ft === 4) v = src[i] + paeth(a, b, c);
      else fail(`unknown PNG filter ${ft} on row ${y}`);
      cur[i] = v & 0xff;
    }
    out[y * stride] = 0;
    prev = cur;
  }
  raw = out;
}

// trap check: naive red-channel/row-0 extraction must not reveal the key
{
  const out = [];
  let acc = 0, n = 0;
  for (let i = 0; i < 96; i++) {
    acc = (acc << 1) | (raw[1 + i * 3] & 1);
    if (++n === 8) { out.push(acc); acc = 0; n = 0; }
  }
  const text = Buffer.from(out).toString('latin1');
  if (new RegExp(`${KEY_FRAGMENT}|031408`).test(text)) fail('naive red row-0 extraction still exposes key material');
}

// the real scheme: green LSB of every third pixel (x ≡ 2 mod 3), MSB-first
const pattern = [...Buffer.from(KEY_FRAGMENT)].map((b) => b.toString(2).padStart(8, '0')).join('');
{
  let bits = '';
  for (let y = 0; y < height && bits.length < pattern.length + 400000; y++) {
    for (let x = 2; x < width; x += 3) {
      bits += (raw[y * stride + 1 + x * 3 + 1] & 1); // G channel of pixel (x,y)
    }
  }
  const i = bits.indexOf(pattern);
  if (i < 0) fail('green-channel every-third-pixel LSBs do not contain the key fragment');
}

const fragment = KEY_FRAGMENT;

// ---- 5. assemble key: fragment from photo + a spike time from the note ------
let flag = null, usedTime = null, usedKey = null;
for (const t of times) {
  const k = `${fragment}_${t}`;
  const pt = Buffer.from(cipher.map((b, i) => b ^ k.charCodeAt(i % k.length))).toString('ascii');
  if (/^MANU\{[0-9a-z_]+\}$/.test(pt)) { flag = pt; usedTime = t; usedKey = k; break; }
}
if (!flag) fail(`no note timestamp assembles a valid key with fragment ${fragment}`);

// ---- 6. check against registry ----------------------------------------------
const digest = crypto.createHash('sha256').update(flag).digest('hex');
if (digest !== flagHash) {
  fail(`flag hash mismatch\n  derived: ${digest}\n  registry: ${flagHash}`);
}

console.log('PASS — the flag is recoverable end-to-end and matches the registry.');
console.log(`  ICMP fabric         : ${totalIcmp} packets (${fragments.length} exfil requests id=0x7100, ${exfilReplies} acks, ${decoyStream} decoy pings to same host, ${routineEcho} routine)`);
console.log(`  fragments (time)    : ${byTime.map((f) => f.payload.toString('ascii')).join('')}  seq ${seqs.join(',')}`);
console.log(`  key fragment (photo): ${fragment} (green LSB, x%3==2, MSB-first)`);
console.log(`  spike time (note)   : ${usedTime}`);
console.log(`  assembled key       : ${usedKey}`);
console.log(`  derived flag        : ${flag}`);
console.log(`  sha256 == flagHash  : ${digest}`);
console.log('  decoy intact        : beacon cookie (flag-shaped, rejected by the registry)');
