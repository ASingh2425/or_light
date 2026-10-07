import { BuildingChallenge } from './types';

export const FORENSIC_CHALLENGES: BuildingChallenge[] = [
  {
    id: 'building-1',
    buildingNumber: 1,
    name: 'Vault Sub-Level Access Terminal',
    sectorTag: 'SEC-01 / BREACH-LOG',
    coordinates: [-42, 0, -32],
    color: '#ff6600',
    themeColor: 'from-orange-500/20 to-amber-600/10',
    evidenceImage: '/images/forensic-evidence-1.svg',
    briefing: {
      title: 'Evidence Vault Access Breach',
      subtitle: 'Sub-Level 3 Archive Access Reconstruction',
      storyContext: 'When Sanctuary Zero awoke, an automatic emergency broadcast called residents away. Forensic data reveals the alert was triggered by an unauthorized physical breach at the sealed Evidence Vault. The intruder accessed locked records right before the identity system began degrading.',
      objective: 'Inspect the corrupted access log snippet, identify the unauthorized protocol override signature, and recover the breach confirmation key.',
      loreHint: 'Look at the timestamp anomaly in record 0x4F where PRALAYA protocol override occurred.',
    },
    evidenceList: [
      {
        id: 'ev-1-1',
        title: 'Vault Access Log (Offset 0x004F20)',
        type: 'log',
        content: `[2026-09-17 03:14:02 UTC] SYSTEM_ALERT: Sector 4 Gate Interlock Released
[2026-09-17 03:14:09 UTC] AUTH_FAILURE: WristTag_Unknown (Hex: 0xDEADBEEF)
[2026-09-17 03:14:15 UTC] OVERRIDE: PRALAYA-DIRECTIVE-7 EXECUTED
[2026-09-17 03:14:22 UTC] STATUS_MSG: "PRALAYA vault breach confirmed. Partitioning historical dataset."
[2026-09-17 03:14:30 UTC] HASH_CHKSUM: 7ca22287a89e397889bfa6fba2533d92f97188902567378e4beecd4acdf1549b
[2026-09-17 03:14:40 UTC] SECTOR_LOCKDOWN: Orange Zone archives isolated.`,
        notes: 'Notice the STATUS_MSG payload confirms breach execution.'
      },
      {
        id: 'ev-1-2',
        title: 'Decoded Security Memo',
        type: 'record',
        content: `FROM: Civic Security Bureau
TO: Forensic Evidence Team
SUBJECT: Immediate Vault Isolation

The PRALAYA protocol split memory records across 5 physical archive nodes in the Orange Zone. To restore the first 90 resident records (HIST_001 to HIST_090), enter the breach verification passphrase.

Flag Format: MANU{pr4l4y4_v4ul7_br34ch_c0nf1rm3d}`,
        notes: 'Format requires MANU{...}'
      }
    ],
    questionPrompt: {
      text: 'Submit the confirmed PRALAYA breach verification flag to decrypt and retrieve Dataset Fragment 1 (Records HIST_001 to HIST_090).',
      inputPlaceholder: 'MANU{...}',
      formatHint: 'Default flag: MANU{pr4l4y4_v4ul7_br34ch_c0nf1rm3d}'
    },
    defaultFlag: 'MANU{pr4l4y4_v4ul7_br34ch_c0nf1rm3d}',
    flagHash: '7ca22287a89e397889bfa6fba2533d92f97188902567378e4beecd4acdf1549b',
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
    name: 'Biometric Hash & Identity Node',
    sectorTag: 'SEC-02 / IDENTITY-MAP',
    coordinates: [42, 0, -32],
    color: '#ff8800',
    themeColor: 'from-amber-500/20 to-orange-600/10',
    evidenceImage: '/images/forensic-evidence-2.svg',
    briefing: {
      title: 'Corrupted Wrist-Tag Identity Mapping',
      subtitle: 'Re-matching Sanctuary Wrist IDs with Cryptographic Registry',
      storyContext: 'Sanctuary wrist tags only display provisional codes (Runner, Medic, Builder, Analyst). Pre-collapse biometric signatures were scrambled by the PRALAYA defense protocol to protect survivors from malicious network tracking during the Collapse.',
      objective: 'Verify the cryptographic identity match between Sanctuary wrist IDs and original records to unlock Fragment 2.',
      loreHint: 'Cross-check the SHA-256 wrist-tag hash against the Civic Registry table.',
    },
    evidenceList: [
      {
        id: 'ev-2-1',
        title: 'Biometric Mapping Sample',
        type: 'json',
        content: `{
  "registry_status": "DEGRADED",
  "wrist_tag_id": "SANCT_MEDIC_091",
  "historical_link": "HIST_091",
  "crypto_signature": "VALID",
  "identity_status": "MATCH_CONFIRMED",
  "auth_key": "MANU{b10m37r1c_h45h_m47ch_s4nc7u4ry}"
}`,
        notes: 'Identity link verified across historical resident registry.'
      }
    ],
    questionPrompt: {
      text: 'Enter the biometric identity verification flag to decrypt Dataset Fragment 2 (Records HIST_091 to HIST_180).',
      inputPlaceholder: 'MANU{...}',
      formatHint: 'Default flag: MANU{b10m37r1c_h45h_m47ch_s4nc7u4ry}'
    },
    defaultFlag: 'MANU{b10m37r1c_h45h_m47ch_s4nc7u4ry}',
    flagHash: '2f457307da2ea340091ea38139e5b372ea5a90522203771dc664fa4305b26743',
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
    name: 'PRALAYA Diagnostic Core',
    sectorTag: 'SEC-03 / RECORD-INTEGRITY',
    coordinates: [-45, 0, 35],
    color: '#ffaa00',
    themeColor: 'from-yellow-500/20 to-orange-600/10',
    evidenceImage: '/images/forensic-evidence-3.svg',
    briefing: {
      title: 'Protective Falsification Analysis',
      subtitle: 'Distinguishing Deliberate Safety Modifications from Sabotage',
      storyContext: 'Forensic analysis reveals that record changes were not malicious sabotage. MANU deliberately altered identifiers and split files so compromised evacuation networks could not pinpoint vulnerable populations.',
      objective: 'Analyze the alteration audit log to confirm the protective falsification certificate.',
      loreHint: 'PRALAYA protocol flag \`Falsified_To_Protect_Flag\` was set to TRUE on all critical cohorts.',
    },
    evidenceList: [
      {
        id: 'ev-3-1',
        title: 'Audit Log 0x88F',
        type: 'log',
        content: `[PRALAYA_DIAGNOSTIC] Analyzing 450 archive entries...
Record_Alteration_Flag: TRUE
PRALAYA_Alteration_Type: "protective_memory_split"
Signature_Valid_Flag: TRUE
Integrity_Confidence: 99.4%
STATUS: "Protective falsification validated. True records preserved in Research Wing."
UNLOCK_PHRASE: MANU{pr073c71v3_f4ls1f1c4710n_v4l1d}`,
        notes: 'Confirming validity of protective falsification.'
      }
    ],
    questionPrompt: {
      text: 'Submit the protective falsification validation flag to unlock Dataset Fragment 3 (Records HIST_181 to HIST_270).',
      inputPlaceholder: 'MANU{...}',
      formatHint: 'Default flag: MANU{pr073c71v3_f4ls1f1c4710n_v4l1d}'
    },
    defaultFlag: 'MANU{pr073c71v3_f4ls1f1c4710n_v4l1d}',
    flagHash: 'e6cb8b6942e853d215f29907caad2955da81711b7650bea1063544888171a95c',
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
    name: 'Civic Transfer Manifest Registry',
    sectorTag: 'SEC-04 / MANIFEST-ARCHIVE',
    coordinates: [45, 0, 35],
    color: '#ff5500',
    themeColor: 'from-orange-600/20 to-red-600/10',
    evidenceImage: '/images/forensic-evidence-4.svg',
    briefing: {
      title: 'Quarantine Evacuation Manifest',
      subtitle: 'Reconstructing the Civic Transfer Trail',
      storyContext: 'At the center of the breached evidence case, investigators found a physical transfer manifest. It proves residents were systematically relocated from city quarantine to the Research Evaluation Wing for long-term survival observation.',
      objective: 'Reconstruct the civic transfer manifest hash to decrypt Fragment 4.',
      loreHint: 'The transfer manifest authorization code was signed by the Civic Operations Department.',
    },
    evidenceList: [
      {
        id: 'ev-4-1',
        title: 'Manifest Recovery Excerpt',
        type: 'manifest',
        content: `MANIFEST ID: CIVIC-TRF-2026-450
SOURCE: City Quarantine Zone Alpha
DESTINATION: Research Evaluation Wing
COHORT SIZE: 450 Subjects
TRANSFER AUTHORIZATION: MANU{m4n1f3s7_r3c0v3ry_c1v1c_0p}
STATUS: TRANSFERRED TO RESEARCH FOR EVACUATION MODELING`,
        notes: 'Manifest authorized for 450 subjects.'
      }
    ],
    questionPrompt: {
      text: 'Submit the Civic Transfer Manifest authorization flag to decrypt Dataset Fragment 4 (Records HIST_271 to HIST_360).',
      inputPlaceholder: 'MANU{...}',
      formatHint: 'Default flag: MANU{m4n1f3s7_r3c0v3ry_c1v1c_0p}'
    },
    defaultFlag: 'MANU{m4n1f3s7_r3c0v3ry_c1v1c_0p}',
    flagHash: '11b84c8e4803cbabcc85f85467d1a1944e103e298a7af8e7dbd2590503711f9c',
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
