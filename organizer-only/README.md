# organizer-only  (do NOT commit, do NOT share with players)

| File | Purpose |
| :--- | :--- |
| `ANSWER_KEY.md` | Flags, decoys, solve paths, dry-run checklist. |
| `answers.json` | Same flags in machine-readable form (used by the test). |
| `build_act3.py` | Rebuilds every artifact in `public/act3`, the neutral cover SVGs and `lib/server/flagHashes.generated.ts`. Flags are *derived* from the artifacts, then re-verified. Fixed seed => identical CSVs/hashes on every run. |
| `instagram/` | Generated: 9 survivor-card PNGs, the pinned rule PNG, profile picture and `POSTING_GUIDE.txt` for the REAL Instagram account (building 2). Post these by hand. |
| `test_act3.py` | End-to-end test: boots `next start`, attacks `/api/verify-flag`, checks downloads, scans the browser bundle for leaked flags/hashes. |

## Rebuild artifacts
```bash
pip install pillow reportlab
sudo apt install libimage-exiftool-perl qpdf      # or: brew install exiftool qpdf
python3 build_act3.py /path/to/portal
```
After rebuilding, commit the regenerated `public/act3/**` and `lib/server/flagHashes.generated.ts`.

## Run the test
```bash
cd /path/to/portal && npm ci && npm run build
python3 /path/to/organizer-only/test_act3.py /path/to/portal
```

## To change a flag or hint
Edit the constants at the top of the relevant section in `build_act3.py` (`KEY`/`FEATURES`, the tamper rows, `EDIT_AUTHOR`/`EDITED`), re-run, re-commit. The portal text in `lib/challenges.ts` that mentions them (ROT13 footer, format examples) is checked by the test.

## Manual checks still required (could not be run in the build sandbox)
* CyberChef + dcode.fr decryption of the plate (key `PRALAYA`).
* PowerShell `Get-FileHash` on Windows against the unzipped CSVs.
* The PDFs in Chrome (Document properties), Acrobat (File > Properties) and Windows Explorer (Properties > Details).
* The 3D scene and terminal in a real browser (WebGL was not available here).

## Optional UI tests (headless, no browser needed)
```bash
cp ui-tests/*.tsx /path/to/portal/ && cd /path/to/portal
npm i --no-save tsx jsdom
# edit the two absolute paths in ui-tests/tsconfig.render.json to your portal path, then:
npx tsx --tsconfig ../organizer-only/ui-tests/tsconfig.render.json render_check.tsx    # 48 UI assertions
npx tsx --tsconfig ../organizer-only/ui-tests/tsconfig.render.json persist_check.tsx   # persistence/tamper checks
```
(React `act()` warnings in the output are harmless harness noise.) Delete the copied `.tsx` files afterwards.


## Building 2 (Instagram) - what you must do by hand
1. Pick the real handle, set `HANDLE` in `build_act3.py` and `INSTAGRAM_HANDLE` in `lib/challenges.ts` (identical; the test checks).
2. `python3 build_act3.py /path/to/portal`, then follow `instagram/POSTING_GUIDE.txt` (public account, 9 cards, pin the rule post).
3. Open the account logged-out in a private window and re-read every card against the pinned rule.
4. Re-run `test_act3.py`, commit `lib/server/flagHashes.generated.ts` and `lib/challenges.ts`.
