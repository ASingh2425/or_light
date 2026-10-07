import { BuildingChallenge } from './types';

/** Public handle of the real Instagram account for SEC-02. Must match HANDLE in organizer-only/build_act3.py (a test checks this). */
export const INSTAGRAM_HANDLE = 'manu_archivist_0';

/**
 * The five sectors of the Orange Zone.
 *
 *  SEC-01  GitHub     - offline placeholder (built in a later drop)
 *  SEC-02  Instagram  - The Archivist's Account (live, real public account)
 *  SEC-03  Crypto     - Sealed Features        (live)
 *  SEC-04  Forensics  - Hash Mismatch          (live)
 *  SEC-05  Forensics  - Who Edited This?       (live)
 *
 * This module is bundled into the browser, so it must never contain a flag.
 * Flags exist only as SHA-256 hashes in lib/server/flagHashes.generated.ts.
 * Sectors are standalone: solve them in any order.
 *
 * To bring SEC-01 online: set status to 'live', fill in briefing,
 * hints, evidence and questionPrompt, then add the sector's hash record to
 * the generated flag file.
 */
export const FORENSIC_CHALLENGES: BuildingChallenge[] = [
  // ───────────────────────── SEC-01 · GitHub (offline) ─────────────────────────
  {
    id: 'building-1',
    buildingNumber: 1,
    name: 'Commit History Archive',
    sectorTag: 'SEC-01 / VERSION-LOG',
    coordinates: [-42, 0, -32],
    color: '#ff6600',
    themeColor: 'from-orange-500/20 to-amber-600/10',
    category: 'github',
    status: 'coming-soon',
    points: 150,
    briefing: {
      title: 'Channel Offline',
      subtitle: 'GitHub intelligence feed — not yet declassified',
      storyContext:
        'The Council kept a public mirror of its training data together with every change ever made to it. The mirror link is still being recovered from the archive.',
      objective:
        'This sector opens in a later drop. The sectors are standalone, so work through the live ones in any order meanwhile.',
    },
    mlConnection: {
      concept: 'Data poisoning & versioning',
      text: 'Every change to a training set is a possible poisoning event. Version history is how you find it.',
    },
    hints: [],
    evidenceList: [],
    questionPrompt: { text: '', inputPlaceholder: '', formatHint: '' },
    evidenceImage: '/images/forensic-evidence-1.svg',
    datasetFragment: {
      fragmentId: 1,
      filename: 'fragment_1.csv',
      downloadUrl: '/data/fragments/fragment_1.csv',
      recordRange: 'HIST_001 — HIST_090',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 1. Contains baseline health, stress, and immunity metrics.',
    },
  },

  // ───────────────────────── SEC-02 · Instagram (live) ─────────────────────────
  {
    id: 'building-2',
    buildingNumber: 2,
    name: "The Archivist's Account",
    sectorTag: 'SEC-02 / SOCIAL-TRACE',
    coordinates: [42, 0, -32],
    color: '#ff8800',
    themeColor: 'from-amber-500/20 to-orange-600/10',
    category: 'instagram',
    status: 'live',
    points: 100,
    briefing: {
      title: "The Archivist's Account",
      subtitle: 'Social trace // Public survivor-card feed',
      storyContext:
        "A former MANU staffer kept a public account of survivor cards: a role, an age, a survival score and a label for each person in the Sanctuary ledger. The account also pins the one rule the ledger was meant to follow. Someone has since slipped a card into the feed that breaks it.",
      objective:
        `Open the account @${INSTAGRAM_HANDLE} on Instagram (no login needed). Find the single card whose label contradicts the pinned ledger rule. Submit LASTDATA{CARD-ID}, using the card's ID exactly as printed on it. Shape: LASTDATA{SC-0000}.`,
    },
    mlConnection: {
      concept: 'Mislabeled data',
      text: 'One wrong label can hide in plain sight. Cross-checking every label against the rule that produced it is how you catch it before training.',
    },
    hints: [
      {
        cost: 5,
        text: 'The rule you need is not on any card. It is in a pinned post on the account.',
      },
      {
        cost: 15,
        text: 'Check every card: compare its SURVIVAL SCORE to the pinned threshold and see whether its LABEL agrees. Cards sitting very close to the threshold are the easy ones to misjudge.',
      },
      {
        cost: 30,
        text: 'Exactly one card breaks the rule. Two cards sit one step either side of the threshold and obey it, and one person appears twice with identical data. None of those three is the answer.',
      },
    ],
    evidenceImage: '/images/forensic-evidence-2.svg',
    evidenceImageCaption: 'Sector cover. The evidence itself lives on the public account named below.',
    evidenceList: [
      {
        id: 'ev-2-1',
        title: 'Recovered Staff Note — The Ledger Keeper',
        type: 'record',
        content: [
          'MANU ARCHIVE COUNCIL // RECOVERED NOTE',
          'RE: Survivor cards kept off the official ledger',
          '------------------------------------------------------------',
          'One of the Sanctuary staff published a public mirror of the',
          'ledger as picture cards, one person per card, on Instagram.',
          '',
          `  Account : @${INSTAGRAM_HANDLE}`,
          `  Address : instagram.com/${INSTAGRAM_HANDLE}`,
          '',
          'The account is public. You do not need to log in or follow it.',
          'The keeper pinned the labelling rule to the top of the feed.',
        ].join('\n'),
      },
      {
        id: 'ev-2-2',
        title: 'Field Toolkit — Social Trace',
        type: 'guide',
        content: [
          'What to do:',
          '  - Open the account in a private/incognito window if the app',
          '    keeps asking you to sign in.',
          '  - Scroll the whole feed, including the pinned post. Make a',
          '    table: ID | score | label | does it follow the rule?',
          '',
          'Tips:',
          '  - Read the ID digit by digit. Zoom in. Do not trust a',
          '    screenshot that was compressed or cropped.',
          '  - A repost of the same person is not a second person.',
          '  - Captions are story, not evidence. The rule and the cards',
          '    are the evidence.',
        ].join('\n'),
      },
    ],
    questionPrompt: {
      text: 'Submit the ID of the one card whose label breaks the pinned ledger rule.',
      inputPlaceholder: 'LASTDATA{...}',
      formatHint: 'LASTDATA{SC-0000}',
    },
    datasetFragment: {
      fragmentId: 2,
      filename: 'fragment_2.csv',
      downloadUrl: '/data/fragments/fragment_2.csv',
      recordRange: 'HIST_091 — HIST_180',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 2. Contains hydration, nutrition, and fitness index metrics.',
    },
  },

  // ───────────────────────── SEC-03 · Cryptography ─────────────────────────
  {
    id: 'building-3',
    buildingNumber: 3,
    name: 'Sealed Features Vault',
    sectorTag: 'SEC-03 / SEALED-FEATURES',
    coordinates: [-45, 0, 35],
    color: '#ffaa00',
    themeColor: 'from-yellow-500/20 to-orange-600/10',
    category: 'crypto',
    status: 'live',
    points: 100,
    briefing: {
      title: 'The Sealed Feature Manifest',
      subtitle: 'Cryptography // Recovered seal plate',
      storyContext:
        "Before the Council shattered MANU into 108 fragments, it sealed one list above all others: the signals its survival model read, the model's feature columns. The plate was recovered from a mirror node. The Council never stored a seal's key on the seal itself.",
      objective:
        "Recover the five feature names MANU's model used, in the order it read them. Submit LASTDATA{FEATURE_FEATURE_...}: UPPERCASE, joined by underscores, in plate order. Ignore any trailing padding X.",
    },
    mlConnection: {
      concept: 'Features',
      text: 'A model only ever sees its feature columns. Knowing which features were used, and keeping that list intact, is the first thing you audit in any model.',
    },
    hints: [
      {
        cost: 5,
        text: 'Two strings, two different ciphers. Whatever falls out of an easy letter shift on the plate edge is not the sealed manifest.',
      },
      {
        cost: 15,
        text: 'The plate is a keyed polyalphabetic cipher (Vigenère). The key is a single word in capitals, and it appears throughout the MANU lore. Spaces do not use up key letters.',
      },
      {
        cost: 30,
        text: 'The key is the 7-letter name of the protocol that shattered the archive into 108 fragments. Decode the 25 letters, then split them into the five feature names.',
      },
    ],
    evidenceImage: '/act3/sealed-features/sealed_plate.png',
    evidenceImageCaption: 'Seal plate photographed at the mirror node. Click to enlarge, or download it below.',
    attachments: [
      {
        id: 'att-3-1',
        label: 'Seal plate (PNG)',
        filename: 'sealed_plate.png',
        url: '/act3/sealed-features/sealed_plate.png',
        description: 'Full-resolution plate image.',
      },
    ],
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
      },
      {
        id: 'ev-3-3',
        title: 'Field Toolkit — Cryptography',
        type: 'guide',
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
    ],
    questionPrompt: {
      text: "Submit the five feature names MANU's survival model read, in plate order.",
      inputPlaceholder: 'LASTDATA{...}',
      formatHint: 'LASTDATA{FEATURE_FEATURE_FEATURE_FEATURE_FEATURE}',
    },
    datasetFragment: {
      fragmentId: 3,
      filename: 'fragment_3.csv',
      downloadUrl: '/data/fragments/fragment_3.csv',
      recordRange: 'HIST_181 — HIST_270',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 3. Contains technical skills, navigation, and teamwork scores.',
    },
  },

  // ───────────────────────── SEC-04 · Forensics 1 ─────────────────────────
  {
    id: 'building-4',
    buildingNumber: 4,
    name: 'Hash Mismatch Registry',
    sectorTag: 'SEC-04 / HASH-MISMATCH',
    coordinates: [45, 0, 35],
    color: '#ff5500',
    themeColor: 'from-orange-600/20 to-red-600/10',
    category: 'forensics',
    status: 'live',
    points: 150,
    briefing: {
      title: 'Wing D Audit Export',
      subtitle: 'Forensics // Dataset integrity',
      storyContext:
        "Wing D's audit export was copied off the archive mirror after the breach. The Council's exporter recorded a SHA-256 fingerprint for every file at export time. Since then, someone has changed a few cells in one file without changing its row count or its size.",
      objective:
        "Find the file that no longer matches its manifest. Submit LASTDATA{filename_first8}: the exact filename, an underscore, then the first 8 hex characters of that file's CURRENT SHA-256 (the one you compute, not the one in the manifest). Shape: LASTDATA{example.csv_0a1b2c3d}.",
    },
    mlConnection: {
      concept: 'Dataset integrity',
      text: 'Silent edits to training data change what a model learns. A checksum is how you prove the data you train on is the data you were given.',
    },
    hints: [
      {
        cost: 10,
        text: "Timestamps and file sizes are easy to fake, so don't trust them. A file's fingerprint can't be faked.",
      },
      {
        cost: 25,
        text: "Compute SHA-256 for every CSV on your own machine and compare with manifest.txt. Exactly one file won't match. Don't open the CSVs in Excel.",
      },
      {
        cost: 45,
        text: 'The file with the strange timestamp still matches its hash. The flag uses the hash YOU compute for the mismatching file: first 8 characters, upper or lower case.',
      },
    ],
    evidenceImage: '/images/forensic-evidence-4.svg',
    evidenceImageCaption: 'Export cover sheet. The real evidence is the file package below.',
    attachments: [
      {
        id: 'att-4-1',
        label: 'Wing D audit export (ZIP)',
        filename: 'wing_d_audit_export.zip',
        url: '/act3/hash-mismatch/wing_d_audit_export.zip',
        description: '5 CSV files + manifest.txt (about 1 MB). Unzip, then hash. Do not re-save anything.',
      },
    ],
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
        type: 'guide',
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
    ],
    questionPrompt: {
      text: 'Submit the mismatching file and the first 8 hex characters of its current SHA-256.',
      inputPlaceholder: 'LASTDATA{filename.csv_xxxxxxxx}',
      formatHint: 'LASTDATA{filename.csv_first8hex}',
    },
    datasetFragment: {
      fragmentId: 4,
      filename: 'fragment_4.csv',
      downloadUrl: '/data/fragments/fragment_4.csv',
      recordRange: 'HIST_271 — HIST_360',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 4. Contains social support, quarantine days, and resilience metrics.',
    },
  },

  // ───────────────────────── SEC-05 · Forensics 2 ─────────────────────────
  {
    id: 'building-5',
    buildingNumber: 5,
    name: 'Who Edited This?',
    sectorTag: 'SEC-05 / PROVENANCE-TRACE',
    coordinates: [0, 0, 52],
    color: '#ff3300',
    themeColor: 'from-amber-600/20 to-orange-700/10',
    category: 'forensics',
    status: 'live',
    points: 150,
    briefing: {
      title: 'Fragment Seal 047 Certificate',
      subtitle: 'Forensics // Data provenance',
      storyContext:
        "Two copies of the Council's sealing certificate for Fragment 047 surfaced on the mirror: the original, and a copy that appeared after the breach. The Council needs to know who edited it, and exactly when.",
      objective:
        "Identify who edited the certificate and when. Submit LASTDATA{NAME_HHMM}. NAME is the editor's FIRST name in UPPERCASE. HHMM is the 24-hour time of the file's modification in UTC, no colon, seconds dropped (07:05:59 becomes 0705).",
    },
    mlConnection: {
      concept: 'Data provenance',
      text: 'A dataset is only as trustworthy as its history. Provenance (who changed what, and when) is how you decide whether to train on it.',
    },
    hints: [
      {
        cost: 10,
        text: "What you can read on the page isn't the evidence. Compare the two files, then look at each file's properties.",
      },
      {
        cost: 25,
        text: 'Use exiftool, Chrome or Acrobat Document Properties, or Windows Properties. Read the Author and the modification date of the edited copy. A name printed on the page and the Producer (software) field are not the editor.',
      },
      {
        cost: 45,
        text: 'exiftool prints the stored time with its timezone. Most GUI viewers silently convert to YOUR local time. Convert to UTC before writing HHMM.',
      },
    ],
    evidenceImage: '/images/forensic-evidence-5.svg',
    evidenceImageCaption: 'Certificate pair cover sheet. The real evidence is in the files below.',
    attachments: [
      {
        id: 'att-5-1',
        label: 'Original certificate (PDF)',
        filename: 'sealing_certificate_original.pdf',
        url: '/act3/who-edited/sealing_certificate_original.pdf',
        description: "The Council's copy of record.",
      },
      {
        id: 'att-5-2',
        label: 'Edited certificate (PDF)',
        filename: 'sealing_certificate_edited.pdf',
        url: '/act3/who-edited/sealing_certificate_edited.pdf',
        description: 'The copy that surfaced after the breach. Open read-only; never re-save.',
      },
    ],
    evidenceList: [
      {
        id: 'ev-5-1',
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
          '  LASTDATA{NAME_HHMM}',
          "  NAME = editor's first name, UPPERCASE",
          '  HHMM = modification time in UTC, 24-hour, no colon,',
          '         seconds dropped   (07:05:59 -> 0705)',
          '',
          'HANDLING WARNING',
          '  Do NOT re-save, "Save as" or print-to-PDF either file.',
          '  Saving rewrites the metadata and erases the evidence.',
          '  Open them read-only.',
        ].join('\n'),
      },
      {
        id: 'ev-5-2',
        title: 'Field Toolkit — Reading PDF Metadata',
        type: 'guide',
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
    ],
    questionPrompt: {
      text: 'Submit the editor and the modification time (UTC) of the edited certificate.',
      inputPlaceholder: 'LASTDATA{NAME_HHMM}',
      formatHint: 'LASTDATA{NAME_HHMM}  (UTC)',
    },
    datasetFragment: {
      fragmentId: 5,
      filename: 'fragment_5.csv',
      downloadUrl: '/data/fragments/fragment_5.csv',
      recordRange: 'HIST_361 — HIST_450',
      rowCount: 90,
      description: 'Historical records for Sanctuary batch 5. Completes the 450 dataset with ground truth Survival_Probability.',
    },
  },
];
