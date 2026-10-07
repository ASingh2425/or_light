#!/usr/bin/env python3
"""
End-to-end checks for the Act III portal.   ORGANIZER ONLY (reads answers.json).

Usage: python3 test_act3.py /path/to/built/portal      (run `npm run build` there first)
Boots `next start`, attacks /api/verify-flag, checks static downloads and
scans the browser bundle for leaked flags/hashes.
"""
import codecs, hashlib, json, re, subprocess, sys, time, urllib.request, urllib.error, zipfile, os, signal
from pathlib import Path

PORTAL = Path(sys.argv[1]).resolve()
HERE = Path(__file__).resolve().parent
ANS = json.loads((HERE / "answers.json").read_text())
PORT = 3917
BASE = f"http://127.0.0.1:{PORT}"
fails, passes = [], 0


def check(name, cond, detail=""):
    global passes
    if cond:
        passes += 1; print(f"  PASS  {name}")
    else:
        fails.append(name); print(f"  FAIL  {name}  {detail}")


def post(payload, raw=None):
    data = raw if raw is not None else json.dumps(payload).encode()
    req = urllib.request.Request(f"{BASE}/api/verify-flag", data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return r.status, r.read(), r.headers.get("content-type", "")


proc = subprocess.Popen(["npx", "next", "start", "-p", str(PORT)], cwd=PORTAL, stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL, preexec_fn=os.setsid)
try:
    for _ in range(60):
        try:
            get("/"); break
        except Exception:
            time.sleep(1)
    else:
        sys.exit("server did not start")

    print("\n[1] Correct flags, decoys, junk")
    for bid, a in ANS.items():
        st, js = post({"buildingId": bid, "flag": a["flag"]})
        check(f"{bid} correct flag accepted", st == 200 and js.get("success") and js["fragment"]["fragmentId"] == int(bid[-1]), (st, js))
        for variant in (a["flag"].lower(), f"  {a['flag']}  "):
            st, js = post({"buildingId": bid, "flag": variant})
            check(f"{bid} case/whitespace variant accepted ({variant.strip()[:14]}...)", st == 200 and js.get("success"), (st, js))
        for d in a["decoys"]:
            st, js = post({"buildingId": bid, "flag": d})
            check(f"{bid} decoy rejected with nudge ({d[:26]}...)", st == 401 and not js["success"] and "incorrect" not in js["message"], (st, js))
        st, js = post({"buildingId": bid, "flag": "LASTDATA{NOPE}"})
        check(f"{bid} wrong flag rejected", st == 401 and not js["success"])
        other = [b for b in ANS if b != bid][0]
        st, js = post({"buildingId": other, "flag": a["flag"]})
        check(f"{bid} flag does NOT work on {other}", st == 401)

    print("\n[2] Offline sectors, malformed input")
    for bid in ("building-1",):
        st, js = post({"buildingId": bid, "flag": "LASTDATA{ANYTHING}"})
        check(f"{bid} offline -> 403", st == 403 and not js["success"], (st, js))
    check("unknown sector -> 404", post({"buildingId": "building-9", "flag": "x"})[0] == 404)
    check("bad JSON -> 400", post(None, raw=b"{not json")[0] == 400)
    check("non-string flag -> 400", post({"buildingId": "building-3", "flag": 123})[0] == 400)
    check("missing fields -> 400", post({})[0] == 400)
    check("oversized flag -> 400", post({"buildingId": "building-3", "flag": "A" * 5000})[0] == 400)
    check("old MANU{} flag from previous build rejected", post({"buildingId": "building-3", "flag": "MANU{pr073c71v3_f4ls1f1c4710n_v4l1d}"})[0] == 401)

    print("\n[3] Downloads served byte-exact")
    z = PORTAL / "public/act3/hash-mismatch/wing_d_audit_export.zip"
    for rel in ("act3/sealed-features/sealed_plate.png", "act3/hash-mismatch/wing_d_audit_export.zip",
                "act3/who-edited/sealing_certificate_original.pdf", "act3/who-edited/sealing_certificate_edited.pdf",
                "images/forensic-evidence-1.svg", "images/forensic-evidence-5.svg"):
        st, body, ctype = get("/" + rel)
        check(f"/{rel} served 200, identical to disk", st == 200 and body == (PORTAL / "public" / rel).read_bytes())
    zf = zipfile.ZipFile(z)
    man = dict(l.split("  ")[::-1] for l in zf.read("manifest.txt").decode().splitlines())
    bad = [n for n, h in man.items() if hashlib.sha256(zf.read(n)).hexdigest() != h]
    check("zip: exactly one file fails the manifest", len(bad) == 1, bad)
    a4 = ANS["building-4"]["flag"]
    check("zip: flag = failing filename + first 8 of ITS actual sha256",
          a4 == f"LASTDATA{{{bad[0]}_{hashlib.sha256(zf.read(bad[0])).hexdigest()[:8]}}}")

    print("\n[4] Portal text vs generator (catches hand-typed drift)")
    ch = (PORTAL / "lib/challenges.ts").read_text()
    footer = re.search(r"'(YNFGQNGN\{[^']*\})'", ch).group(1)
    check("ROT13 footer in portal decodes to the decoy flag", codecs.decode(footer, "rot13") == ANS["building-3"]["decoys"][0])

    handle = re.search(r"INSTAGRAM_HANDLE = '([^']+)'", ch).group(1)
    check("portal INSTAGRAM_HANDLE matches the generator's HANDLE", re.search(r'^HANDLE = "%s"' % re.escape(handle), (HERE / "build_act3.py").read_text(), re.M) is not None, handle)
    ig = sorted((HERE / "instagram").glob("post_*_card.png"))
    check("9 card images generated for the real account", len(ig) == 9, len(ig))
    check("pinned rule image generated", (HERE / "instagram/post_10_rule_PIN_THIS.png").exists())
    cards = ANS["building-2"]["flag"]
    check("building-2 flag shape LASTDATA{SC-0000}", re.fullmatch(r"LASTDATA\{SC-\d{4}\}", cards) is not None, cards)

    print("\n[5] Leak scan of everything shipped to the browser")
    secrets = []
    for a in ANS.values():
        secrets += [a["flag"], *a["decoys"]]
    secrets += [hashlib.sha256(s.strip().upper().encode()).hexdigest() for s in secrets]
    blobs = [p for p in (PORTAL / ".next/static").rglob("*") if p.is_file()]
    blobs += [p for p in (PORTAL / "public").rglob("*") if p.is_file() and p.suffix in (".svg", ".ts", ".js", ".json", ".txt", ".csv")]
    hits = []
    for p in blobs:
        t = p.read_bytes()
        for sct in secrets:
            if sct.encode() in t or sct.lower().encode() in t:
                hits.append((str(p.relative_to(PORTAL)), sct[:20]))
    check(f"no flag, decoy or hash in {len(blobs)} browser-visible files", not hits, hits)
    ashtml = get("/")[1].decode(errors="ignore") + get("/ctf")[1].decode(errors="ignore")
    check("no flag/hash in served HTML", not any(s.encode() in ashtml.encode() for s in secrets))
    check("no 'Auto-Fill' control in client bundle", not any(b"Auto-Fill Test Flag" in p.read_bytes() for p in (PORTAL / ".next/static").rglob("*.js")))
finally:
    os.killpg(os.getpgid(proc.pid), signal.SIGTERM)

print(f"\n{passes} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
