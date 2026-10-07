#!/usr/bin/env python3
"""
LAST DATASET - Act III artifact builder.      *** ORGANIZER ONLY - CONTAINS ANSWERS ***

Usage:   python3 build_act3.py /path/to/portal
Needs:   Pillow, reportlab, exiftool, qpdf   (pip install pillow reportlab)

What it writes inside <portal>:
  public/act3/sealed-features/sealed_plate.png         (building-3 evidence image)
  public/act3/hash-mismatch/wing_d_audit_export.zip    (building-4 download)
  public/act3/who-edited/sealing_certificate_*.pdf     (building-5 downloads)
  public/images/forensic-evidence-{1..5}.svg           (neutral covers, no answers)
  lib/server/flagHashes.generated.ts                   (SHA-256 hashes ONLY)
and, next to this script:
  ANSWER_KEY.md                                         (never commit / never ship to players)

Every flag is DERIVED from the artifacts it protects (decrypted plaintext, real
file hash, real PDF metadata), then re-verified by independent code paths.
Re-running reproduces identical CSVs/hashes (fixed seed).
"""
import codecs
import hashlib
import json
import random
import shutil
import subprocess
import sys
import tempfile
import zipfile
from datetime import date, timedelta
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.colors import Color
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent
PORTAL = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else (HERE.parent / "portal")
PREFIX = "LASTDATA"


def normalize(s: str) -> str:
    """Must match normalizeFlag() in lib/server/flags.ts."""
    return s.strip().upper()


def flag_hash(flag: str) -> str:
    return hashlib.sha256(normalize(flag).encode()).hexdigest()


def sha256_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


answers: dict = {}   # building-id -> {"flag":..., "decoys":[(flag,message)]}


# ───────────────────────── Building 3: Sealed Features (crypto) ─────────────────────────
KEY = "PRALAYA"
FEATURES = ["AGE", "SLEEP", "SKILL", "STRESS", "FOCUS"]


def vig_modular(text: str, key: str, decrypt: bool) -> str:
    out = []
    for i, ch in enumerate(text):
        k = ord(key[i % len(key)]) - 65
        out.append(chr((ord(ch) - 65 + (-k if decrypt else k)) % 26 + 65))
    return "".join(out)


def vig_tabula(text: str, key: str, decrypt: bool) -> str:
    """Independent implementation: explicit 26x26 tabula recta lookup."""
    A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    table = [A[r:] + A[:r] for r in range(26)]
    out = []
    for i, ch in enumerate(text):
        row = table[A.index(key[i % len(key)])]
        out.append(A[row.index(ch)] if decrypt else row[A.index(ch)])
    return "".join(out)


def build_crypto():
    plain = "".join(FEATURES)
    plain += "X" * ((-len(plain)) % 5)                       # pad to 5-letter blocks
    assert plain.isalpha() and plain.isupper() and len(plain) <= 35
    c1, c2 = vig_modular(plain, KEY, False), vig_tabula(plain, KEY, False)
    assert c1 == c2, "two Vigenere implementations disagree"
    assert vig_modular(c1, KEY, True) == plain == vig_tabula(c1, KEY, True)
    blocks = [c1[i:i + 5] for i in range(0, len(c1), 5)]

    # wrong keys must NOT yield the answer (sanity)
    for wrong in ("MANU", "ECHOES", "ARCHIVE", "PRALAYAA"):
        assert vig_modular(c1, wrong, True) != plain

    flag = f"{PREFIX}{{{'_'.join(FEATURES)}}}"
    decoy_plain = f"{PREFIX}{{AGE_NAME_ID_BLOODGROUP}}"
    decoy_cipher = codecs.encode(decoy_plain, "rot13")        # trivially reversible on purpose
    assert codecs.decode(decoy_cipher, "rot13") == decoy_plain and decoy_plain != flag

    # ---- render the plate image (letters only; key is deliberately absent) ----
    W, H = 1280, 720
    img = Image.new("RGB", (W, H), (9, 12, 20))
    d = ImageDraw.Draw(img)
    for y in range(0, H, 4):                                  # faint scanlines
        d.line([(0, y), (W, y)], fill=(12, 16, 26))
    mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
    monob = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
    f_big, f_mid, f_sm, f_xs = (ImageFont.truetype(monob, 54), ImageFont.truetype(monob, 30),
                                ImageFont.truetype(mono, 20), ImageFont.truetype(mono, 16))
    amber, dim, line = (255, 176, 46), (150, 124, 70), (90, 70, 28)
    d.rectangle([24, 24, W - 24, H - 24], outline=line, width=3)
    d.text((64, 56), "MANU ARCHIVE COUNCIL", font=f_sm, fill=dim)
    d.text((64, 88), "SEALED FEATURE MANIFEST", font=f_mid, fill=amber)
    d.text((64, 136), "SEAL PLATE 0xA3  |  FRAGMENT 003 / 108  |  CLASS: RESTRICTED", font=f_sm, fill=dim)
    d.line([(64, 180), (W - 64, 180)], fill=line, width=2)
    box_w, gap = 203, 24
    x0 = (W - (5 * box_w + 4 * gap)) // 2
    for i, blk in enumerate(blocks):
        x = x0 + i * (box_w + gap)
        d.rectangle([x, 300, x + box_w, 400], outline=amber, width=3)
        tw = d.textlength(blk, font=f_big)
        d.text((x + (box_w - tw) / 2, 316), blk, font=f_big, fill=amber)
        d.text((x + 8, 270), f"{i + 1:02d}", font=f_sm, fill=dim)
    d.text((x0, 440), "BLOCKS READ LEFT TO RIGHT. LETTERS ONLY.", font=f_sm, fill=dim)
    d.line([(64, 560), (W - 64, 560)], fill=line, width=2)
    d.text((64, 584), "SEAL STATE : LOCKED", font=f_sm, fill=dim)
    d.text((64, 612), "KEY        : NOT STORED ON PLATE", font=f_sm, fill=dim)
    d.text((64, 656), "RECOVERED FROM MIRROR NODE // DO NOT RELY ON OCR - VERIFY EACH BLOCK", font=f_xs, fill=line)
    out = PORTAL / "public/act3/sealed-features"
    out.mkdir(parents=True, exist_ok=True)
    img.save(out / "sealed_plate.png", optimize=True)         # PIL writes no text chunks

    answers["building-3"] = {
        "title": "Sealed Features (Crypto, 100 pts)",
        "flag": flag,
        "decoys": [
            (decoy_plain, "That string is the plate-edge seal-check footer (a ROT13 decoy). "
                          "The sealed feature manifest is the five-block plate itself."),
        ],
        "extra": {"ciphertext_blocks": blocks, "plaintext_padded": plain, "key": KEY,
                  "decoy_ciphertext_in_portal": decoy_cipher},
    }
    return decoy_cipher


# ───────────────────────── Building 4: Hash Mismatch (forensics 1) ─────────────────────────
def build_hash_mismatch():
    rng = random.Random(20260917)
    d0 = date(2026, 1, 1)

    def day():
        return (d0 + timedelta(days=rng.randrange(0, 181))).isoformat()

    files: dict[str, list[str]] = {}

    r = ["entry_id,intake_day,wing,headcount,ration_units,shift,status"]
    for i in range(1, 5201):
        r.append(f"IL-{i:06d},{day()},{rng.choice('ABCD')},{rng.randrange(1, 400):03d},"
                 f"{rng.randrange(40, 999):03d},{rng.choice(['DAY', 'NIGHT'])},"
                 f"{rng.choices(['OK', 'HOLD'], [93, 7])[0]}")
    files["intake_ledger.csv"] = r

    r = ["audit_id,depot,issued_units,returned_units,variance_pct,auditor_code"]
    for i in range(1, 4801):
        issued = rng.randrange(1000, 9000)
        returned = issued - int(issued * rng.random() * 0.05)
        var = (returned - issued) / issued * 100
        r.append(f"RA-{i:05d},D{rng.randrange(1, 13):02d},{issued:04d},{returned:04d},{var:+06.2f},A{rng.randrange(10, 99)}")
    files["ration_audit.csv"] = r

    r = ["bed_id,block,occupant_ref,intake_day,medical_flag"]
    for i in range(1, 6101):
        r.append(f"SH-{i:05d},B{rng.randrange(1, 9)},{rng.getrandbits(32):08x},{day()},{rng.choices(['N', 'Y'], [88, 12])[0]}")
    files["shelter_roster.csv"] = r

    r = ["batch_id,item,qty,origin,dest,signed"]
    for i in range(1, 5601):
        r.append(f"SF-{i:06d},{rng.choice(['WATER', 'FILTER', 'MEDKIT', 'FUEL', 'SEED'])},{rng.randrange(10, 9999):04d},"
                 f"DEPOT-{rng.randrange(1, 9)},WING-{rng.choice('ABCD')},{rng.choices(['Y', 'N'], [95, 5])[0]}")
    files["supply_flow.csv"] = r

    r = ["event_id,timestamp,gate,direction,badge_ref,result"]
    for i in range(1, 7001):
        ts = f"{day()}T{rng.randrange(0, 24):02d}:{rng.randrange(0, 60):02d}:{rng.randrange(0, 60):02d}Z"
        r.append(f"GL-{i:06d},{ts},G{rng.randrange(1, 7)},{rng.choice(['IN', 'OUT'])},{rng.getrandbits(32):08x},"
                 f"{rng.choices(['PASS', 'DENY'], [96, 4])[0]}")
    files["gate_log.csv"] = r

    original = {n: ("\n".join(rows) + "\n").encode() for n, rows in files.items()}
    manifest_hash = {n: sha256_bytes(b) for n, b in original.items()}   # recorded BEFORE tampering

    TAMPER, HERRING = "ration_audit.csv", "gate_log.csv"
    lines = files[TAMPER][:]
    changed = []
    for idx in (311, 2467, 4120):                               # plausible, self-consistent edits
        parts = lines[idx].split(",")
        issued, old_ret, old_var = int(parts[2]), parts[3], parts[4]
        new_ret_i = issued - int(issued * rng.uniform(0.002, 0.045))
        while f"{new_ret_i:04d}" == old_ret:
            new_ret_i -= 1
        parts[3] = f"{new_ret_i:04d}"
        parts[4] = f"{(new_ret_i - issued) / issued * 100:+06.2f}"   # keep variance consistent -> no logic break
        assert len(parts[3]) == len(old_ret) and len(parts[4]) == len(old_var)
        assert 0 < issued - new_ret_i <= issued * 0.05
        lines[idx] = ",".join(parts)
        changed.append((idx + 1, parts[0], f"returned {old_ret}->{parts[3]}", f"variance {old_var}->{parts[4]}"))
    tampered = ("\n".join(lines) + "\n").encode()
    assert len(tampered) == len(original[TAMPER])               # same size
    assert tampered.count(b"\n") == original[TAMPER].count(b"\n")  # same row count
    final = dict(original)
    final[TAMPER] = tampered
    actual_hash = {n: sha256_bytes(b) for n, b in final.items()}
    mismatches = [n for n in final if actual_hash[n] != manifest_hash[n]]
    assert mismatches == [TAMPER], mismatches
    assert actual_hash[TAMPER][:8] != manifest_hash[TAMPER][:8]

    manifest = "".join(f"{manifest_hash[n]}  {n}\n" for n in sorted(final)).encode()

    out = PORTAL / "public/act3/hash-mismatch"
    out.mkdir(parents=True, exist_ok=True)
    zpath = out / "wing_d_audit_export.zip"
    NORMAL_DT, HERRING_DT = (2026, 3, 2, 11, 0, 0), (2026, 9, 17, 3, 31, 0)  # the `touch` red herring
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as zf:
        for n in sorted(final):
            zi = zipfile.ZipInfo(n, date_time=HERRING_DT if n == HERRING else NORMAL_DT)
            zi.compress_type, zi.external_attr = zipfile.ZIP_DEFLATED, 0o644 << 16
            zf.writestr(zi, final[n])
        zi = zipfile.ZipInfo("manifest.txt", date_time=(2026, 3, 2, 11, 0, 2))
        zi.compress_type, zi.external_attr = zipfile.ZIP_DEFLATED, 0o644 << 16
        zf.writestr(zi, manifest)

    flag = f"{PREFIX}{{{TAMPER}_{actual_hash[TAMPER][:8]}}}"
    answers["building-4"] = {
        "title": "Hash Mismatch (Forensics 1, 150 pts)",
        "flag": flag,
        "decoys": [
            (f"{PREFIX}{{{TAMPER}_{manifest_hash[TAMPER][:8]}}}",
             "Right file, but that hash is the ORIGINAL recorded in manifest.txt. "
             "The flag needs the hash of the file as it exists now."),
            (f"{PREFIX}{{{HERRING}_{actual_hash[HERRING][:8]}}}",
             "That file's hash matches the manifest - it is intact. Its odd timestamp is a red herring."),
        ],
        "extra": {"tampered": TAMPER, "red_herring_touched": HERRING, "changed_cells": changed,
                  "rows": {n: final[n].count(b"\n") - 1 for n in final},
                  "bytes": {n: len(b) for n, b in final.items()},
                  "manifest_hash_of_tampered": manifest_hash[TAMPER],
                  "actual_hash_of_tampered": actual_hash[TAMPER]},
    }


# ───────────────────────── Building 5: Who Edited This? (forensics 2) ─────────────────────────
ORIG_AUTHOR, EDIT_AUTHOR = "MANU Archive Council", "Rohan Desai"
CREATED = "2026:08:01 10:00:00Z"
EDITED = "2026:09:17 03:35:12Z"            # stored in UTC (Z); viewers will show local time
DECOY_PRODUCER = "ScribeForge PDF Studio 9"
APPROVED_BY = "Dr. Ilan Verma"             # printed text only - decoy name


def render_certificate(path: Path, records: str):
    c = canvas.Canvas(str(path), pagesize=A4)
    w, h = A4
    ink, rule = Color(0.12, 0.14, 0.2), Color(0.55, 0.42, 0.12)
    c.setStrokeColor(rule); c.setLineWidth(2.5); c.rect(36, 36, w - 72, h - 72)
    c.setLineWidth(0.8); c.rect(46, 46, w - 92, h - 92)
    c.setFillColor(ink); c.setFont("Helvetica-Bold", 13); c.drawCentredString(w / 2, h - 96, "MANU ARCHIVE COUNCIL")
    c.setFont("Helvetica-Bold", 26); c.drawCentredString(w / 2, h - 140, "SEALING CERTIFICATE")
    c.setStrokeColor(rule); c.line(110, h - 156, w - 110, h - 156)
    rows = [("Certificate No.", "MSC-0047-108"), ("Fragment Seal", "047 of 108"),
            ("Archive", "MANU - Survivor Trait Archive (Protocol PRALAYA)"),
            ("Records sealed", records), ("Sealed on", "2026-08-01"),
            ("Seal integrity", "SHA-256 chain verified"),
            ("Approved by", f"{APPROVED_BY}, Chair of the Archive Council")]
    y = h - 210
    for k, v in rows:
        c.setFont("Helvetica-Bold", 11); c.drawString(92, y, k.upper())
        c.setFont("Helvetica", 12); c.drawString(250, y, v)
        y -= 34
    c.setFillColor(Color(0.1, 0.14, 0.22)); c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, 120, "This certificate attests that the records above were sealed unaltered under Protocol PRALAYA.")
    c.saveState(); c.translate(w - 170, 200); c.rotate(18)
    c.setStrokeColor(Color(0.7, 0.1, 0.1)); c.setFillColor(Color(0.7, 0.1, 0.1)); c.setLineWidth(3)
    c.roundRect(-70, -22, 140, 44, 6); c.setFont("Helvetica-Bold", 24); c.drawCentredString(0, -8, "SEALED")
    c.restoreState()
    c.showPage(); c.save()


def exif_set(pdf: Path, **tags):
    args = ["exiftool", "-overwrite_original", "-q"] + [f"-{k}={v}" for k, v in tags.items()] + [str(pdf)]
    subprocess.run(args, check=True)


def flatten(pdf: Path):
    """exiftool appends an incremental update (stale metadata stays in the file). Rewrite cleanly."""
    tmp = pdf.with_suffix(".tmp.pdf")
    subprocess.run(["qpdf", "--object-streams=disable", str(pdf), str(tmp)], check=True)
    shutil.move(tmp, pdf)


def build_pdfs():
    out = PORTAL / "public/act3/who-edited"
    out.mkdir(parents=True, exist_ok=True)
    orig, edit = out / "sealing_certificate_original.pdf", out / "sealing_certificate_edited.pdf"
    render_certificate(orig, "450")
    render_certificate(edit, "405")                       # the subtle visible change (digits swapped)
    common = {"Title": "MANU Sealing Certificate - Fragment Seal 047", "Subject": "Sealing certificate",
              "Keywords": "MANU, PRALAYA, seal", "Creator": "MANU Seal Generator 2.1", "CreateDate": CREATED}
    exif_set(orig, Author=ORIG_AUTHOR, Producer="MANU Seal Generator PDF Core", ModifyDate=CREATED, **common)
    exif_set(edit, Author=EDIT_AUTHOR, Producer=DECOY_PRODUCER, ModifyDate=EDITED, **common)
    flatten(orig); flatten(edit)

    first, hhmm, ist = EDIT_AUTHOR.split()[0].upper(), EDITED[11:16].replace(":", ""), "0905"
    assert hhmm == "0335"
    flag = f"{PREFIX}{{{first}_{hhmm}}}"
    answers["building-5"] = {
        "title": "Who Edited This? (Forensics 2, 150 pts)",
        "flag": flag,
        "decoys": [
            (f"{PREFIX}{{ILAN_{hhmm}}}", "Dr. Verma is just the name PRINTED on the page. "
                                          "The question asks who edited the file - check the file's properties."),
            (f"{PREFIX}{{{first}_{ist}}}", "Check the time zone: HHMM must be UTC, but most viewers show your local time."),
        ],
        "extra": {"edit_author": EDIT_AUTHOR, "original_author": ORIG_AUTHOR, "stored_modify_utc": EDITED,
                  "local_IST_display": "2026-09-17 09:05:12", "decoy_producer": DECOY_PRODUCER,
                  "visible_name_decoy": APPROVED_BY, "visible_change": "Records sealed: 450 -> 405"},
    }


# ───────────────────────── Building 2: The Archivist's Account (Instagram, real account) ─────────────────────────
# The organiser posts the generated cards to a REAL public Instagram account. Nothing from this
# section ships in the portal except the handle (public) and the briefing text.
HANDLE = "manu_archivist_0"          # <- change to the real handle; keep lib/challenges.ts INSTAGRAM_HANDLE identical
IG_DIR = HERE / "instagram"
# (role, age, score, label, caption, note)   label rule pinned on the account: LIVES iff score >= 0.50
IG_CARDS = [
    ("Runner",   27, 0.82, "LIVES", "Batch intake, morning shift. Fast on her feet.", "consistent"),
    ("Medic",    41, 0.67, "LIVES", "Wing B triage lead. Steady hands.", "consistent (will be reposted later)"),
    ("Builder",  33, 0.50, "LIVES", "Shelter crew. Right on the line, and the ledger rule says LIVES at 0.50.", "NEAR-MISS: boundary 0.50 = LIVES (correct)"),
    ("Analyst",  29, 0.31, "LOST",  "Ration analyst. Logged as lost after the east gate closed.", "consistent"),
    ("Scout",    36, 0.28, "LIVES", "Outer-wall scout. Last logged at the north gate.", "CONTRADICTION: 0.28 < 0.50 but labelled LIVES"),
    ("Cook",     52, 0.49, "LOST",  "Kitchen lead. One hundredth short of the line.", "NEAR-MISS: boundary 0.49 = LOST (correct)"),
    ("Engineer", 45, 0.91, "LIVES", "Water systems. Built half the filters in Wing D.", "consistent"),
    ("Medic",    41, 0.67, "LIVES", "Reposted: card reformatted, nothing changed. Same person, same score.", "NEAR-MISS: repost of card 2, identical data"),
    ("Porter",   38, 0.14, "LOST",  "Supply porter. Did not return from the last run.", "consistent"),
]


def build_instagram():
    rng = random.Random(20261006)
    ids = [f"SC-{n}" for n in rng.sample(range(1000, 9999), len(IG_CARDS) - 1)]
    ids.insert(7, ids[1])                                    # post 8 reposts post 2 (same ID)
    cards = []
    for (role, age, score, label, cap, note), cid in zip(IG_CARDS, ids):
        cards.append(dict(id=cid, role=role, age=age, score=score, label=label, caption=cap, note=note))
    # logic self-check: exactly one card breaks the pinned rule
    broken = [c for c in cards if (c["score"] >= 0.50) != (c["label"] == "LIVES")]
    assert len(broken) == 1, broken
    target = broken[0]
    assert sum(1 for c in cards if c["id"] == target["id"]) == 1          # target ID is unique
    assert cards[1]["id"] == cards[7]["id"] and cards[1]["score"] == cards[7]["score"]

    mono = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
    monob = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
    F = lambda f, n: ImageFont.truetype(f, n)
    amber, dim, line = (255, 176, 46), (150, 124, 70), (90, 70, 28)
    green, red = (96, 214, 130), (240, 96, 80)
    S = 1080

    def frame(title):
        img = Image.new("RGB", (S, S), (9, 12, 20))
        d = ImageDraw.Draw(img)
        for y in range(0, S, 4):
            d.line([(0, y), (S, y)], fill=(12, 16, 26))
        d.rectangle([28, 28, S - 28, S - 28], outline=line, width=4)
        d.text((72, 70), "MANU ARCHIVE // SANCTUARY LEDGER", font=F(mono, 26), fill=dim)
        d.text((72, 112), title, font=F(monob, 44), fill=amber)
        d.line([(72, 180), (S - 72, 180)], fill=line, width=3)
        return img, d

    IG_DIR.mkdir(exist_ok=True)
    for old in IG_DIR.glob("*"):
        old.unlink()
    for i, c in enumerate(cards, 1):
        img, d = frame("SURVIVOR CARD")
        d.text((72, 230), c["id"], font=F(monob, 120), fill=(255, 255, 255))
        rows = [("ROLE", c["role"].upper()), ("AGE", str(c["age"])), ("SURVIVAL SCORE", f"{c['score']:.2f}")]
        for r, (k, v) in enumerate(rows):
            y = 430 + r * 110
            d.text((72, y), k, font=F(mono, 30), fill=dim)
            d.text((72, y + 38), v, font=F(monob, 56), fill=amber)
        d.text((72, 790), "LABEL", font=F(mono, 30), fill=dim)
        d.text((72, 828), c["label"], font=F(monob, 96), fill=green if c["label"] == "LIVES" else red)
        d.text((72, 985), "SANCTUARY ARCHIVE // BATCH 2 // CARD FORMAT v3", font=F(mono, 22), fill=line)
        img.save(IG_DIR / f"post_{i:02d}_card.png", optimize=True)
    img, d = frame("LEDGER RULE (PINNED)")
    lines = ["Every card carries a SURVIVAL SCORE", "and a LABEL. The label follows one rule:", "",
             "   score >= 0.50   ->   LIVES", "   score <  0.50   ->   LOST", "",
             "Scores are rounded to two decimals.", "The ledger does not make exceptions.",
             "", "If a card ever breaks the rule,", "the ledger has been tampered with."]
    for k, t in enumerate(lines):
        d.text((72, 230 + k * 64), t, font=F(monob if "->" in t else mono, 40), fill=amber if "->" in t else (225, 205, 160))
    d.text((72, 985), "SANCTUARY ARCHIVE // LEDGER KEEPER", font=F(mono, 22), fill=line)
    img.save(IG_DIR / "post_10_rule_PIN_THIS.png", optimize=True)
    av = Image.new("RGB", (512, 512), (9, 12, 20)); da = ImageDraw.Draw(av)
    da.ellipse([40, 40, 472, 472], outline=amber, width=10)
    da.text((256, 256), "SL", font=F(monob, 200), fill=amber, anchor="mm")
    av.save(IG_DIR / "profile_picture.png", optimize=True)

    caps = ["ACCOUNT SETUP", "=============", f"Handle  : {HANDLE}", "Type    : public (NOT private), personal/creator is fine",
            "Name    : The Archivist", "Bio     : Keeper of the Sanctuary ledger. Survivor cards, batch 2. Rule pinned.",
            "Profile picture: profile_picture.png", "Follow nobody. No highlights, no stories, no links.", "",
            "POSTS (publish in this order, newest ends up on top; pin post 10 last)", ""]
    for i, c in enumerate(cards, 1):
        caps += [f"--- post_{i:02d}_card.png", f"Caption: {c['caption']}", f"Hashtags: #sanctuary #ledger", f"[organiser note, do NOT post: {c['note']}]", ""]
    caps += ["--- post_10_rule_PIN_THIS.png", "Caption: The ledger rule. Pinned for everyone who keeps the books.",
             "Then: open the post -> ... -> Pin to your profile.", ""]
    (IG_DIR / "POSTING_GUIDE.txt").write_text("\n".join(caps))

    flag = f"{PREFIX}{{{target['id']}}}"
    decoys = []
    for idx, why in ((2, "That card sits exactly on the pinned rule's boundary (0.50 -> LIVES) and obeys it."),
                     (5, "That card is one hundredth under the line and its label (LOST) follows the pinned rule."),
                     (1, "That ID appears twice, but the repost carries identical data. A repost is not a contradiction.")):
        decoys.append((f"{PREFIX}{{{cards[idx]['id']}}}", why + " Look for a label that breaks the rule."))
    answers["building-2"] = {
        "title": "The Archivist's Account (Instagram, 100 pts)",
        "flag": flag, "decoys": decoys,
        "extra": {"handle": HANDLE, "target": target, "cards": cards},
    }


# ───────────────────────── neutral evidence covers (NO answers) ─────────────────────────
COVERS = {
    1: ("#1e293b", "#38bdf8", "SECTOR 01 // VERSION-LOG", "CHANNEL OFFLINE", "Repository mirror - not yet declassified"),
    2: ("#1e293b", "#f472b6", "SECTOR 02 // SOCIAL-TRACE", "CHANNEL OFFLINE", "Archivist feed - not yet declassified"),
    3: ("#3b2a05", "#fbbf24", "SECTOR 03 // SEALED-FEATURES", "SEAL PLATE RECOVERED", "Open the Evidence tab - read the plate"),
    4: ("#052e2b", "#2dd4bf", "SECTOR 04 // HASH-MISMATCH", "AUDIT EXPORT RECOVERED", "Download the export - verify every file"),
    5: ("#2e1065", "#c084fc", "SECTOR 05 // PROVENANCE-TRACE", "CERTIFICATE PAIR RECOVERED", "Two copies - one was edited"),
}


def build_covers():
    for n, (bg, fg, tag, head, sub) in COVERS.items():
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">\n'
               f'  <rect width="800" height="600" fill="{bg}"/>\n'
               f'  <rect x="30" y="30" width="740" height="540" rx="12" fill="none" stroke="{fg}" stroke-width="2" stroke-dasharray="10 6"/>\n'
               f'  <text x="60" y="80" font-family="monospace" font-size="14" fill="{fg}">{tag}</text>\n'
               f'  <text x="60" y="290" font-family="monospace" font-size="34" font-weight="bold" fill="#f8fafc">{head}</text>\n'
               f'  <text x="60" y="330" font-family="monospace" font-size="16" fill="{fg}">{sub}</text>\n'
               f'  <text x="60" y="540" font-family="monospace" font-size="12" fill="#94a3b8">MANU ARCHIVE COUNCIL // ORANGE ZONE FORENSICS</text>\n'
               f'</svg>\n')
        (PORTAL / f"public/images/forensic-evidence-{n}.svg").write_text(svg)


# ───────────────────────── emit hash-only server data + answer key ─────────────────────────
def emit_hashes():
    lines = ["// GENERATED by organizer-only/build_act3.py - DO NOT EDIT BY HAND.",
             "// Contains SHA-256 hashes of normalised flags ONLY. No plaintext flag lives in this repo.", "",
             "export interface DecoyRecord { hash: string; message: string }",
             "export interface FlagRecord { hash: string; decoys: DecoyRecord[] }", "",
             "export const FLAG_RECORDS: Record<string, FlagRecord> = {"]
    for bid in ("building-2", "building-3", "building-4", "building-5"):
        a = answers[bid]
        lines.append(f"  '{bid}': {{")
        lines.append(f"    hash: '{flag_hash(a['flag'])}',")
        lines.append("    decoys: [")
        for f, msg in a["decoys"]:
            lines.append(f"      {{ hash: '{flag_hash(f)}', message: {json.dumps(msg)} }},")
        lines += ["    ],", "  },"]
    lines += ["};", ""]
    p = PORTAL / "lib/server/flagHashes.generated.ts"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("\n".join(lines))


def emit_answer_key(decoy_cipher):
    k2, k3, k4, k5 = (answers[b] for b in ("building-2", "building-3", "building-4", "building-5"))
    e2, e3, e4, e5 = k2["extra"], k3["extra"], k4["extra"], k5["extra"]
    tg = e2["target"]
    cardrows = "\n".join(f"  {i}. {c['id']}  {c['role']:<8} age {c['age']}  score {c['score']:.2f}  {c['label']:<5}  <- {c['note']}" for i, c in enumerate(e2["cards"], 1))
    md = f"""# ANSWER KEY - Act III (ORGANIZERS ONLY)

**Never commit this file, never put it in the player-facing repo.** Flag format: `{PREFIX}{{...}}`.
Matching is case-insensitive and trims whitespace (server-side `normalizeFlag`).

Building 1 (GitHub) is an offline placeholder until that CTF is built.

---
## Building 2 - {k2['title']}
**Flag:** `{k2['flag']}`

* REAL public Instagram account: `@{e2['handle']}`. Post the images from `organizer-only/instagram/` using `POSTING_GUIDE.txt`; pin post 10 (the ledger rule).
* The pinned rule: label is LIVES iff score >= 0.50. Exactly ONE card breaks it: `{tg['id']}` ({tg['role']}, score {tg['score']:.2f}, labelled {tg['label']}).
* Cards in posting order:
{cardrows}
* **Decoys (nudge messages):** the 0.50 boundary card, the 0.49 boundary card, and the reposted card's ID.
* Players read IDs off images (OCR / by eye). Fonts are large monospace to keep OCR errors low.
* Keep the account PUBLIC for the whole event. If it is reported or removed the sector dies, so keep the card PNGs and re-post under a new handle (change `HANDLE` here and `INSTAGRAM_HANDLE` in lib/challenges.ts, re-run, redeploy).
* NOT tested here: the account itself (no Instagram access from the build sandbox). Check it logged-out in a private window.

## Building 3 - {k3['title']}
**Flag:** `{k3['flag']}`

* Plate ciphertext (image only): `{' '.join(e3['ciphertext_blocks'])}`
* Cipher/key: Vigenere, key `{e3['key']}`; plaintext `{e3['plaintext_padded']}` (trailing `X` is padding).
* Key is NOT in the portal. Player must infer it from the lore memo ("the name of the protocol that ordered the shattering").
* **Decoy 1 (ROT13):** footer `{e3['decoy_ciphertext_in_portal']}` -> `{k3['decoys'][0][0]}`. Submitting it returns a nudge message.
* Cross-check: CyberChef recipe `Vigenere Decode` key `PRALAYA` on the 25 letters (spaces don't advance the key); dcode.fr Vigenere decoder, key `PRALAYA`, "ignore non-letters" ON.
  Verified here with two independent implementations (modular + tabula recta) - CyberChef/dcode were NOT run from this sandbox, please run them once yourself.

## Building 4 - {k4['title']}
**Flag:** `{k4['flag']}`

* Tampered file: `{e4['tampered']}` - 3 rows edited (`returned_units` + matching `variance_pct`, same widths, logically consistent so only a hash exposes them): {e4['changed_cells']}
* Same row count and byte size as original: rows {e4['rows']}, bytes {e4['bytes']}
* Manifest hash (original) `{e4['manifest_hash_of_tampered']}`; actual `{e4['actual_hash_of_tampered']}`
* **Red herring:** `{e4['red_herring_touched']}` has a 03:31 timestamp on 2026-09-17 inside the zip; the tampered file carries the normal date (timestomped).
* **Decoy 1:** tampered filename + manifest hash prefix. **Decoy 2:** `{e4['red_herring_touched']}` + its own hash prefix. Both return a nudge.
* Players must hash locally: `Get-FileHash .\\file.csv -Algorithm SHA256` (Windows) / `sha256sum -c manifest.txt` (Linux). Tell them NOT to open+save in Excel.
* Verified: `sha256sum -c manifest.txt` after unzip reports exactly one FAILED. PowerShell `Get-FileHash` was NOT run from this sandbox (SHA-256 is identical, but dry-run it on Windows).

## Building 5 - {k5['title']}
**Flag:** `{k5['flag']}`

* Real editor: `{e5['edit_author']}` (Author of the edited PDF; original Author `{e5['original_author']}`).
* ModifyDate stored in UTC: `{e5['stored_modify_utc']}` -> `0335`. GUI viewers in IST show `{e5['local_IST_display']}` (-> `0905`, the timezone trap).
* Visible change between the files: {e5['visible_change']}.
* **Decoys:** printed "Approved by {e5['visible_name_decoy']}" (`{k5['decoys'][0][0]}`), Producer `{e5['decoy_producer']}`, and the local-time answer `{k5['decoys'][1][0]}`.
* Metadata is in the Info dictionary AND a matching XMP packet (exiftool writes both; verified they agree). exiftool's incremental update was flattened with qpdf so no stale Author/Producer remains in the file.
* Tested here: exiftool, pdfinfo, pypdf. NOT tested here: Chrome, Acrobat, Windows Properties - run your dry-run on those.

---
## Dry run checklist
1. 2-3 first-years, each with an LLM, one timed pass per challenge. Expect ~#3 15-25 min, #4 20-30 min, #5 25-40 min.
2. Watch for: players using Excel on the CSVs, re-saving PDFs, timezone confusion (#5), OCR errors on the plate (#3).
3. Decoy messages leak a little by design (they confirm a partial is wrong); trim them in `build_act3.py` if you want stricter.
"""
    (HERE / "ANSWER_KEY.md").write_text(md)
    (HERE / "answers.json").write_text(json.dumps(
        {b: {"flag": answers[b]["flag"], "decoys": [d[0] for d in answers[b]["decoys"]]}
         for b in ("building-2", "building-3", "building-4", "building-5")}, indent=2))


if __name__ == "__main__":
    build_instagram()
    decoy_cipher = build_crypto()
    build_hash_mismatch()
    build_pdfs()
    build_covers()
    emit_hashes()
    emit_answer_key(decoy_cipher)
    print("built OK ->", PORTAL)
    for b in ("building-2", "building-3", "building-4", "building-5"):
        print(b, answers[b]["flag"])
