#!/usr/bin/env python3
"""Generates vault_terminal.img — file-carving forensics challenge.

Usage:
    python scripts/gen_vault_img.py 'MANU{...}' public/data/evidence/vault_terminal.img

The flag is passed as an argument and NEVER hardcoded here.
Carriers (all 512-byte aligned, strings-safe):
  1. PNG  -> zTXt chunk (zlib compressed)         = part 1/3
  2. JPEG -> COM marker (base64 + reversed)       = part 2/3
  3. PDF  -> FlateDecode content stream (white)   = part 3/3
Solve: binwalk/foremost carve -> extract -> concatenate in order.
"""
import base64
import io
import random
import struct
import sys
import zlib
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("PIL required: pip install pillow")


def split_flag(flag: str):
    n = len(flag)
    a = (n + 2) // 3
    b = (2 * n + 2) // 3
    return flag[:a], flag[a:b], flag[b:]


def make_noise_image(seed: int, size=96):
    rnd = random.Random(seed)
    img = Image.new("RGB", (size, size))
    px = img.load()
    base = (255, 120, 40)
    for y in range(size):
        for x in range(size):
            f = 0.55 + 0.45 * ((x + y) / (2 * size))
            jitter = rnd.randint(-18, 18)
            px[x, y] = tuple(
                max(0, min(255, int(c * f) + jitter)) for c in base
            )
    return img


def make_png(text: str) -> bytes:
    buf = io.BytesIO()
    make_noise_image(7).save(buf, "PNG")
    data = buf.getvalue()
    iend = data.rfind(b"IEND") - 4
    chunk_body = b"Inspector\x00\x00" + zlib.compress(text.encode())
    chunk = (
        struct.pack(">I", len(chunk_body))
        + b"zTXt"
        + chunk_body
        + struct.pack(">I", zlib.crc32(b"zTXt" + chunk_body) & 0xFFFFFFFF)
    )
    return data[:iend] + chunk + data[iend:]


def make_jpeg(encoded_comment: str) -> bytes:
    buf = io.BytesIO()
    make_noise_image(13).save(buf, "JPEG", quality=85)
    data = buf.getvalue()
    payload = encoded_comment.encode()
    com = b"\xFF\xFE" + struct.pack(">H", len(payload) + 2) + payload
    return data[:2] + com + data[2:]


def make_pdf(text: str) -> bytes:
    content = f"BT /F1 18 Tf 1 1 1 rg 72 720 Td ({text}) Tj ET".encode()
    comp = zlib.compress(content)
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d /Filter /FlateDecode >>\nstream\n" % len(comp)
        + comp
        + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for i, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n" % (len(objects) + 1)
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += (
        b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n"
        % (len(objects) + 1, xref)
    )
    return bytes(out)


def align(offset: int, block: int = 512) -> int:
    return offset + (-offset % block)


def build(flag: str, size: int = 2 * 1024 * 1024) -> bytes:
    part1, part2, part3 = split_flag(flag)
    png = make_png(part1)
    jpeg = make_jpeg(base64.b64encode(part2[::-1].encode()).decode())
    pdf = make_pdf(part3)

    rnd = random.Random(20260917)
    buf = bytearray(rnd.randbytes(size))

    # Block 0: fake superblock + the breach log excerpt (lore flavor, no flag)
    log = (
        b"MANUFS2\x00sector=sublevel3 eMMC=slotB\n"
        b"[2026-09-17 03:14:02 UTC] SYSTEM_ALERT: Sector 4 Gate Interlock Released\n"
        b"[2026-09-17 03:14:15 UTC] OVERRIDE: PRALAYA-DIRECTIVE-7 EXECUTED\n"
        b"[2026-09-17 03:14:40 UTC] SECTOR_LOCKDOWN: purge issued, plaintext unrecoverable\n"
    )
    buf[:512] = (log + b"\x00" * 512)[:512]

    # Plant carriers at 512-byte boundaries in carve order
    pos = 512
    for carrier in (png, jpeg, pdf):
        pos = align(pos)
        buf[pos : pos + len(carrier)] = carrier
        pos += len(carrier)

    # Mid-file flavor block (aligned): fake journal line
    journal = b"[03:14:41] journal: allocations 3 survive wipe (inspect ->)\n"
    jpos = align(size // 2)
    buf[jpos : jpos + len(journal)] = journal

    return bytes(buf)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    flag, out = sys.argv[1], sys.argv[2]
    if not (flag.startswith("MANU{") and flag.endswith("}")):
        sys.exit("flag must be MANU{...}")
    data = build(flag)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    Path(out).write_bytes(data)
    print(f"wrote {out} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
