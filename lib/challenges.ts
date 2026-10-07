import { BuildingChallenge } from './types';

export const FORENSIC_CHALLENGES: BuildingChallenge[] = [
  {
    id: 'building-1',
    buildingNumber: 1,
    name: 'Vault Sub-Level Access Terminal',
    sectorTag: 'SEC-01 / ARCHIVE-RECOVERY',
    coordinates: [-42, 0, -32],
    color: '#ff6600',
    themeColor: 'from-orange-500/20 to-amber-600/10',
    evidenceImage: '/images/forensic-evidence-1.svg',
    briefing: {
      title: 'The Nightly Archive Sync',
      subtitle: 'Git history forensics — 1,000 sync commits, breach night 2026-09-17',
      storyContext: 'When the sub-level terminal was purged at 03:14:40 UTC, investigators assumed the case file died with it. It did not. The Archive Sync Daemon had been mirroring the Civic Transfer Registry to the archivist\'s workstation all night — a 1,000-commit sync logbook that survived the wipe as a recovered git repository. Not everything in it was meant to survive.',
      objective: 'Clone the archive repository and recover the flag hidden within.',
      loreHint: 'The purge burned the files — it never burned the ledger.',
    },
    evidenceList: [
      {
        id: 'ev-1-1',
        title: 'Archive Repository — Orange_zone_archieve',
        type: 'record',
        content: `REPO:     https://github.com/Hritik-1810/Orange_zone_archieve.git
ACQUIRED: 2026-09-17 — archivist workstation (post-purge)

git clone https://github.com/Hritik-1810/Orange_zone_archieve.git`
      }
    ],
    questionPrompt: {
      text: 'Recover the flag hidden in the archive repository and submit it to decrypt Dataset Fragment 1 (Records HIST_001 to HIST_090).',
      inputPlaceholder: 'MANU{...}',
      formatHint: 'Format: MANU{...}'
    },
    flagHash: 'ab0add65882dac093c7fd192d395d6cb42edb9b1df8914f8490695573e8a3109',
    defaultFlag: 'MANU{t1m3st4mp_l5b_h1dd3n_1n_pl41n_s1ght}',
    datasetFragment: {
      fragmentId: 1,
      filename: 'fragment_1.csv',
      downloadUrl: '/data/fragments/fragment_1.csv',
      recordRange: 'HIST_001 — HIST_090',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 1. Contains baseline health, stress, and immunity metrics.'
    }
  },
  {
    id: 'building-2',
    buildingNumber: 2,
    name: 'Who Edited This?',
    sectorTag: 'SEC-02 / PROVENANCE-TRACE',
    coordinates: [42, 0, -32],
    color: '#ff8800',
    themeColor: 'from-amber-500/20 to-orange-600/10',
    evidenceImage: '/images/forensic-evidence-2.svg',
    briefing: {
      title: 'Fragment Seal 047 Certificate',
      subtitle: 'Forensics // Data provenance',
      storyContext: `Two copies of the Council's sealing certificate for Fragment 047 surfaced on the mirror: the original, and a copy that appeared after the breach. The Council needs to know who edited it, and exactly when.`,
      objective: `Identify who edited the certificate and when. Submit MANU{NAME_HHMM}. NAME is the editor's FIRST name in UPPERCASE. HHMM is the 24-hour time of the file's modification in UTC, no colon, seconds dropped (07:05:59 becomes 0705).`,
      loreHint: 'Read the file properties, not the page. Local viewers show YOUR time — convert to UTC.',
    },
    evidenceList: [
      {
        id: 'ev-2-1',
        title: 'Chain-of-Custody Note — Fragment 047',
        type: 'record',
        content: [
          'CHAIN-OF-CUSTODY NOTE // FRAGMENT 047 CERTIFICATE',
          '------------------------------------------------------------',
          'sealing_certificate_original.pdf  - Council copy of record',
          'sealing_certificate_edited.pdf    - surfaced after the breach',
          '',
          'QUESTION FOR THE ANALYST',
          '  Who edited the certificate, and when?',
          '',
          'FORMAT',
          '  MANU{NAME_HHMM}',
          "  NAME = editor's first name, UPPERCASE",
          '  HHMM = modification time in UTC, 24-hour, no colon,',
          '         seconds dropped   (07:05:59 -> 0705)',
          '',
          'HANDLING WARNING',
          '  Do NOT re-save, "Save as" or print-to-PDF either file.',
          '  Saving rewrites the metadata and erases the evidence.',
          '  Open them read-only.',
        ].join('\n'),
        notes: 'Compare the two PDFs side by side — page changes and property changes.'
      },
      {
        id: 'ev-2-2',
        title: 'Field Toolkit — Reading PDF Metadata',
        type: 'record',
        content: [
          'exiftool (all platforms):',
          '  exiftool sealing_certificate_edited.pdf',
          '  exiftool -a -G1 -s sealing_certificate_edited.pdf',
          '',
          'Chrome   : open the PDF -> menu -> Document properties',
          '           (dates shown in YOUR local timezone)',
          'Acrobat  : File -> Properties -> Description',
          '           (dates shown in YOUR local timezone)',
          'Windows  : right-click the file -> Properties -> Details',
          '           (Author may appear, depending on your PDF reader;',
          '            dates are local time)',
          '',
          'Compare the two files side by side: what changed on the',
          'page, and what changed in the properties?',
          '',
          'Timezones: UTC = your local time minus your UTC offset.',
        ].join('\n'),
      },
      {
        id: 'att-2-1',
        title: 'Original certificate (PDF)',
        type: 'record',
        fileUrl: '/act3/who-edited/sealing_certificate_original.pdf',
        content: [
          "The Council's copy of record.",
          'Filename : sealing_certificate_original.pdf',
          '',
          'Open it read-only; never re-save.',
        ].join('\n'),
        notes: "The Council's copy of record."
      },
      {
        id: 'att-2-2',
        title: 'Edited certificate (PDF)',
        type: 'record',
        fileUrl: '/act3/who-edited/sealing_certificate_edited.pdf',
        content: [
          'The copy that surfaced after the breach.',
          'Filename : sealing_certificate_edited.pdf',
          '',
          'Open it read-only; never re-save.',
        ].join('\n'),
        notes: 'The real answer hides in this file’s properties.'
      }
    ],
    questionPrompt: {
      text: 'Submit the editor and the modification time (UTC) of the edited certificate.',
      inputPlaceholder: 'MANU{NAME_HHMM}',
      formatHint: 'MANU{NAME_HHMM} (UTC)'
    },
    flagHash: 'a2828097ceee05b376adc8af9cbf2ea78e029ab0cbf8da18a51447ea67964ccb',
    defaultFlag: 'MANU{ROHAN_0335}',
    datasetFragment: {
      fragmentId: 2,
      filename: 'fragment_2.csv',
      downloadUrl: '/data/fragments/fragment_2.csv',
      recordRange: 'HIST_091 — HIST_180',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 2. Contains hydration, nutrition, and fitness index metrics.'
    }
  },
  {
    id: 'building-3',
    buildingNumber: 3,
    name: 'Sealed Features Vault',
    sectorTag: 'SEC-03 / SEALED-FEATURES',
    coordinates: [-45, 0, 35],
    color: '#ffaa00',
    themeColor: 'from-yellow-500/20 to-orange-600/10',
    evidenceImage: '/act3/sealed-features/sealed_plate.png',
    briefing: {
      title: 'The Sealed Feature Manifest',
      subtitle: 'Cryptography // Recovered seal plate',
      storyContext: `Before the Council shattered MANU into 108 fragments, it sealed one list above all others: the signals its survival model read, the model's feature columns. The plate was recovered from a mirror node. The Council never stored a seal's key on the seal itself.`,
      objective: `Recover the five feature names MANU's model used, in the order it read them. Submit MANU{FEATURE_FEATURE_...}: UPPERCASE, joined by underscores, in plate order. Ignore any trailing padding X.`,
      loreHint: 'A seal never carries its own key — the key is the 7-letter protocol name that ordered the shattering.',
    },
    evidenceList: [
      {
        id: 'ev-3-1',
        title: 'Council Memo — Standing Order on Sealed Manifests',
        type: 'record',
        content: [
          'MANU ARCHIVE COUNCIL // INTERNAL MEMO',
          'RE: Standing order on sealed manifests',
          '------------------------------------------------------------',
          'Before the archive was shattered into 108 fragments, the Council',
          'locked the list of signals the survival model read behind a',
          'classical keyed cipher. Two rules applied to every plate:',
          '',
          '  1. A seal never carries its own key.',
          '  2. Every plate in the series is keyed with one word, in',
          '     capitals: the name of the protocol that ordered the',
          '     shattering.',
          '',
          'Survivors who studied the founding lore will know the word.',
          'It is not written down here.',
        ].join('\n'),
      },
      {
        id: 'ev-3-2',
        title: 'Plate-Edge Inscription (seal-check footer)',
        type: 'hex',
        content: [
          'EDGE INSCRIPTION (etched along the lower rim of the plate)',
          '',
          'YNFGQNGN{NTR_ANZR_VQ_OYBBQTEBHC}',
          '',
          'FOOTER PARITY: OK',
        ].join('\n'),
        notes: 'Not every cipher-looking string on the plate is the sealed message.'
      },
      {
        id: 'ev-3-3',
        title: 'Field Toolkit — Cryptography',
        type: 'record',
        content: [
          'Browser tools (nothing to install):',
          '  CyberChef (gchq.github.io/CyberChef)',
          '    - ROT13 / "ROT13 Brute Force" for simple letter shifts',
          '    - "Vigenere Decode": paste the letters, enter the key',
          '  dcode.fr -> "Vigenere Cipher" decoder (when the key is known)',
          '',
          'Tips:',
          '  - Spaces between blocks are for reading only; they do NOT',
          '    use up key letters.',
          '  - Gibberish output means the KEY is wrong, not the tool.',
          '  - Not every cipher-looking string on a plate is the sealed',
          '    message. Ask which one the question is about.',
        ].join('\n'),
      },
      {
        id: 'att-3-1',
        title: 'Seal plate (PNG)',
        type: 'record',
        fileUrl: '/act3/sealed-features/sealed_plate.png',
        content: [
          'Seal plate photographed at the mirror node.',
          'Filename : sealed_plate.png',
          'Format   : full-resolution PNG',
          '',
          'Open it read-only. Click the sector cover image above to',
          'enlarge it, or download the original file here.',
        ].join('\n'),
        notes: 'Full-resolution plate image.'
      }
    ],
    questionPrompt: {
      text: `Submit the five feature names MANU's survival model read, in plate order.`,
      inputPlaceholder: 'MANU{...}',
      formatHint: 'MANU{FEATURE_FEATURE_FEATURE_FEATURE_FEATURE}'
    },
    flagHash: '82c5a151a44b4b06932a2ad4c42dbe6b459435ae410203d0c0299cbfb4660803',
    datasetFragment: {
      fragmentId: 3,
      filename: 'fragment_3.csv',
      downloadUrl: '/data/fragments/fragment_3.csv',
      recordRange: 'HIST_181 — HIST_270',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 3. Contains technical skills, navigation, and teamwork scores.'
    }
  },
  {
    id: 'building-4',
    buildingNumber: 4,
    name: 'Hash Mismatch Registry',
    sectorTag: 'SEC-04 / HASH-MISMATCH',
    coordinates: [45, 0, 35],
    color: '#ff5500',
    themeColor: 'from-orange-600/20 to-red-600/10',
    evidenceImage: '/images/forensic-evidence-4.svg',
    briefing: {
      title: 'Wing D Audit Export',
      subtitle: 'Forensics // Dataset integrity',
      storyContext: `Wing D's audit export was copied off the archive mirror after the breach. The Council's exporter recorded a SHA-256 fingerprint for every file at export time. Since then, someone has changed a few cells in one file without changing its row count or its size.`,
      objective: `Find the file that no longer matches its manifest. Submit MANU{filename_first8}: the exact filename, an underscore, then the first 8 hex characters of that file's CURRENT SHA-256 (the one you compute, not the one in the manifest). Shape: MANU{example.csv_0a1b2c3d}.`,
      loreHint: 'Timestamps and file sizes are easy to fake — a SHA-256 fingerprint is not.',
    },
    evidenceList: [
      {
        id: 'ev-4-1',
        title: 'Export Notice — Wing D Audit Package',
        type: 'log',
        content: [
          'ARCHIVE EXPORT NOTICE // WING D AUDIT PACKAGE',
          '------------------------------------------------------------',
          'Package  : wing_d_audit_export.zip',
          'Contents : 5 x CSV (thousands of rows each) + manifest.txt',
          'Manifest : SHA-256 per file, recorded at export time',
          '           format:  <64-hex-hash>  <filename>',
          '',
          'HANDLING WARNING',
          '  - Do NOT open these CSVs in Excel or Sheets and save them.',
          '    Re-saving rewrites bytes (line endings, number formats)',
          '    and changes every hash: you would destroy the evidence.',
          '  - Unzip, hash the files exactly as they are, then compare.',
        ].join('\n'),
      },
      {
        id: 'ev-4-2',
        title: 'Field Toolkit — Hashing a File',
        type: 'record',
        content: [
          'Windows (PowerShell, inside the unzipped folder):',
          '  Get-FileHash .\\ration_audit.csv -Algorithm SHA256',
          '  Get-FileHash .\\*.csv -Algorithm SHA256        (all at once)',
          '',
          'Linux / macOS:',
          '  sha256sum *.csv              (macOS: shasum -a 256 *.csv)',
          '  sha256sum -c manifest.txt    (checks every file for you)',
          '',
          'Notes:',
          '  - Hex case (abc vs ABC) does not matter for the flag.',
          '  - Compare against manifest.txt, not against your memory of',
          '    which file "looks" suspicious.',
        ].join('\n'),
      },
      {
        id: 'att-4-1',
        title: 'Wing D audit export (ZIP)',
        type: 'record',
        fileUrl: '/act3/hash-mismatch/wing_d_audit_export.zip',
        content: [
          'Export cover sheet for the evidence package below.',
          'Filename : wing_d_audit_export.zip',
          'Contents : 5 CSV files + manifest.txt (about 1 MB)',
          '',
          'Unzip, then hash. Do not re-save anything.',
        ].join('\n'),
        notes: 'The real evidence is the file package above.'
      }
    ],
    questionPrompt: {
      text: 'Submit the mismatching file and the first 8 hex characters of its current SHA-256.',
      inputPlaceholder: 'MANU{filename.csv_xxxxxxxx}',
      formatHint: 'MANU{filename.csv_first8hex}'
    },
    flagHash: '168c3e71ca3adad89c5e1476e1ef4c3112395d0f691fa650202e53569cefd309',
    datasetFragment: {
      fragmentId: 4,
      filename: 'fragment_4.csv',
      downloadUrl: '/data/fragments/fragment_4.csv',
      recordRange: 'HIST_271 — HIST_360',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 4. Contains social support, quarantine days, and resilience metrics.'
    }
  },
  {
    id: 'building-5',
    buildingNumber: 5,
    name: 'Research Evaluation Quarantine Wing',
    sectorTag: 'SEC-05 / SURVIVAL-GATE',
    dead: true,
    coordinates: [0, 0, 52],
    color: '#ff3300',
    themeColor: 'from-amber-600/20 to-orange-700/10',
    evidenceImage: '/images/forensic-evidence-5.svg',
    briefing: {
      title: 'Sealed Historical Survivor Cohort',
      subtitle: 'Unlocking the Continuous Survival Probability Model Target',
      storyContext: 'This final vault facility holds the sealed medical records and ground-truth outcomes for all 450 historical survivors. The target variable is continuous survival probability (0.0 to 1.0) rather than a simple binary label—empowering the upcoming ML competition model.',
      objective: 'Enter the final research clearance key to unlock Fragment 5 and assemble the full 450-record dataset.',
      loreHint: 'The clearance key confirms the continuous regression target for the Random Forest model.',
    },
    evidenceList: [
      {
        id: 'ev-5-1',
        title: 'Research Model Specification',
        type: 'log',
        content: `TARGET SPECIFICATION:
Variable: Survival_Probability (Float 0.000 to 1.000)
Training Cohort: 450 Historical Records
Model Architecture: Random Forest Regressor / Gradient Booster
Clearance Token: MANU{surv1v4l_pr0b4b1l17y_m0d3l_0k}
RESULT: Unlocks Fragment 5 and activates Full Dataset Download.`,
        notes: 'Final sector unlocking the entire historical archive.'
      }
    ],
    questionPrompt: {
      text: 'Submit the Research Clearance Token to unlock Dataset Fragment 5 (Records HIST_361 to HIST_450) and complete the Orange Zone!',
      inputPlaceholder: 'MANU{...}',
      formatHint: 'Default flag: MANU{surv1v4l_pr0b4b1l17y_m0d3l_0k}'
    },
    defaultFlag: 'MANU{surv1v4l_pr0b4b1l17y_m0d3l_0k}',
    flagHash: 'dc0d35afdef497ade2b23d00c05f27a9db02fb34119fde00636b447ba3dcae57',
    datasetFragment: {
      fragmentId: 5,
      filename: 'fragment_5.csv',
      downloadUrl: '/data/fragments/fragment_5.csv',
      recordRange: 'HIST_361 — HIST_450',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 5. Completes the 450 dataset with ground truth Survival_Probability.'
    }
  }
];

/** Sectors that actually host a live CTF terminal (dead sectors excluded). */
export const ACTIVE_CHALLENGES: BuildingChallenge[] = FORENSIC_CHALLENGES.filter((c) => !c.dead);

/** Live CTF sectors — drives the progress bar, dashboard and finale. */
export const TOTAL_ACTIVE_SECTORS = ACTIVE_CHALLENGES.length;

/** Ids of dead / decommissioned sectors that never accept a flag. */
export const DEAD_SECTOR_IDS: ReadonlySet<string> = new Set(
  FORENSIC_CHALLENGES.filter((c) => c.dead).map((c) => c.id)
);

