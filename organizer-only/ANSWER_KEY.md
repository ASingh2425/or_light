# ANSWER KEY - Act III (ORGANIZERS ONLY)

**Never commit this file, never put it in the player-facing repo.** Flag format: `LASTDATA{...}`.
Matching is case-insensitive and trims whitespace (server-side `normalizeFlag`).

Building 1 (GitHub) is an offline placeholder until that CTF is built.

---
## Building 2 - The Archivist's Account (Instagram, 100 pts)
**Flag:** `LASTDATA{SC-9352}`

* REAL public Instagram account: `@manu_archivist_0`. Post the images from `organizer-only/instagram/` using `POSTING_GUIDE.txt`; pin post 10 (the ledger rule).
* The pinned rule: label is LIVES iff score >= 0.50. Exactly ONE card breaks it: `SC-9352` (Scout, score 0.28, labelled LIVES).
* Cards in posting order:
  1. SC-9106  Runner   age 27  score 0.82  LIVES  <- consistent
  2. SC-2332  Medic    age 41  score 0.67  LIVES  <- consistent (will be reposted later)
  3. SC-5695  Builder  age 33  score 0.50  LIVES  <- NEAR-MISS: boundary 0.50 = LIVES (correct)
  4. SC-5729  Analyst  age 29  score 0.31  LOST   <- consistent
  5. SC-9352  Scout    age 36  score 0.28  LIVES  <- CONTRADICTION: 0.28 < 0.50 but labelled LIVES
  6. SC-4229  Cook     age 52  score 0.49  LOST   <- NEAR-MISS: boundary 0.49 = LOST (correct)
  7. SC-4820  Engineer age 45  score 0.91  LIVES  <- consistent
  8. SC-2332  Medic    age 41  score 0.67  LIVES  <- NEAR-MISS: repost of card 2, identical data
  9. SC-9577  Porter   age 38  score 0.14  LOST   <- consistent
* **Decoys (nudge messages):** the 0.50 boundary card, the 0.49 boundary card, and the reposted card's ID.
* Players read IDs off images (OCR / by eye). Fonts are large monospace to keep OCR errors low.
* Keep the account PUBLIC for the whole event. If it is reported or removed the sector dies, so keep the card PNGs and re-post under a new handle (change `HANDLE` here and `INSTAGRAM_HANDLE` in lib/challenges.ts, re-run, redeploy).
* NOT tested here: the account itself (no Instagram access from the build sandbox). Check it logged-out in a private window.

## Building 3 - Sealed Features (Crypto, 100 pts)
**Flag:** `LASTDATA{AGE_SLEEP_SKILL_STRESS_FOCUS}`

* Plate ciphertext (image only): `PXEDL CEEJK TLJSI IEDSD ORLSI`
* Cipher/key: Vigenere, key `PRALAYA`; plaintext `AGESLEEPSKILLSTRESSFOCUSX` (trailing `X` is padding).
* Key is NOT in the portal. Player must infer it from the lore memo ("the name of the protocol that ordered the shattering").
* **Decoy 1 (ROT13):** footer `YNFGQNGN{NTR_ANZR_VQ_OYBBQTEBHC}` -> `LASTDATA{AGE_NAME_ID_BLOODGROUP}`. Submitting it returns a nudge message.
* Cross-check: CyberChef recipe `Vigenere Decode` key `PRALAYA` on the 25 letters (spaces don't advance the key); dcode.fr Vigenere decoder, key `PRALAYA`, "ignore non-letters" ON.
  Verified here with two independent implementations (modular + tabula recta) - CyberChef/dcode were NOT run from this sandbox, please run them once yourself.

## Building 4 - Hash Mismatch (Forensics 1, 150 pts)
**Flag:** `LASTDATA{ration_audit.csv_7dfdbe62}`

* Tampered file: `ration_audit.csv` - 3 rows edited (`returned_units` + matching `variance_pct`, same widths, logically consistent so only a hash exposes them): [(312, 'RA-00311', 'returned 4769->4795', 'variance -04.24->-03.71'), (2468, 'RA-02467', 'returned 4478->4444', 'variance -02.46->-03.20'), (4121, 'RA-04120', 'returned 2302->2223', 'variance -00.60->-04.02')]
* Same row count and byte size as original: rows {'intake_ledger.csv': 5200, 'ration_audit.csv': 4800, 'shelter_roster.csv': 6100, 'supply_flow.csv': 5600, 'gate_log.csv': 7000}, bytes {'intake_ledger.csv': 203455, 'ration_audit.csv': 163269, 'shelter_roster.csv': 207450, 'supply_flow.csv': 212901, 'gate_log.csv': 360563}
* Manifest hash (original) `29ede9a058f9dfd67f829d71ddbcb860c58e0e2c755d98b7366ad2433cd8b913`; actual `7dfdbe62a83bc960a479317d8eb84efd6c5df451a2bddd225da2cfb01aec8da4`
* **Red herring:** `gate_log.csv` has a 03:31 timestamp on 2026-09-17 inside the zip; the tampered file carries the normal date (timestomped).
* **Decoy 1:** tampered filename + manifest hash prefix. **Decoy 2:** `gate_log.csv` + its own hash prefix. Both return a nudge.
* Players must hash locally: `Get-FileHash .\file.csv -Algorithm SHA256` (Windows) / `sha256sum -c manifest.txt` (Linux). Tell them NOT to open+save in Excel.
* Verified: `sha256sum -c manifest.txt` after unzip reports exactly one FAILED. PowerShell `Get-FileHash` was NOT run from this sandbox (SHA-256 is identical, but dry-run it on Windows).

## Building 5 - Who Edited This? (Forensics 2, 150 pts)
**Flag:** `LASTDATA{ROHAN_0335}`

* Real editor: `Rohan Desai` (Author of the edited PDF; original Author `MANU Archive Council`).
* ModifyDate stored in UTC: `2026:09:17 03:35:12Z` -> `0335`. GUI viewers in IST show `2026-09-17 09:05:12` (-> `0905`, the timezone trap).
* Visible change between the files: Records sealed: 450 -> 405.
* **Decoys:** printed "Approved by Dr. Ilan Verma" (`LASTDATA{ILAN_0335}`), Producer `ScribeForge PDF Studio 9`, and the local-time answer `LASTDATA{ROHAN_0905}`.
* Metadata is in the Info dictionary AND a matching XMP packet (exiftool writes both; verified they agree). exiftool's incremental update was flattened with qpdf so no stale Author/Producer remains in the file.
* Tested here: exiftool, pdfinfo, pypdf. NOT tested here: Chrome, Acrobat, Windows Properties - run your dry-run on those.

---
## Dry run checklist
1. 2-3 first-years, each with an LLM, one timed pass per challenge. Expect ~#3 15-25 min, #4 20-30 min, #5 25-40 min.
2. Watch for: players using Excel on the CSVs, re-saving PDFs, timezone confusion (#5), OCR errors on the plate (#3).
3. Decoy messages leak a little by design (they confirm a partial is wrong); trim them in `build_act3.py` if you want stricter.
