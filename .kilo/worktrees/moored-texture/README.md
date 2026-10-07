# MANU Protocol: Orange Zone // Forensics Department CTF Portal

An interactive, gamified 3D CTF and Dataset Forensic Investigation portal built with **Next.js 14**, **React Three Fiber (Three.js)**, **Tailwind CSS**, and **Zustand**.

---

## 📖 Overview & Lore

Participants play as investigators entering the **Orange Zone** (Civic Evidence Vault & Archives) following the events of the MANU Protocol:
1. **Explore the City**: Navigate a 3D isometric city district using an investigator drone.
2. **Access Forensic Facilities**: Enter 5 sealed archive buildings to trigger split-screen cyber-forensic terminals.
3. **Solve CTF Challenges**: Act III, "Someone Changed the Past". Break a sealed cipher, catch a tampered dataset by its hash, and trace who edited a forged certificate. Sectors are standalone and can be solved in any order.
4. **Recover Dataset Fragments**: Verify cryptographic clearance flags to decrypt and download the **5 partitioned fragments of `MANU_Historical_Records_450-1.csv`**.
5. **Master Archive Assembly**: Reach 100% clearance to assemble the full 450-record dataset for the downstream Machine Learning survival probability competition.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) + TypeScript | Routing, layout, server API routes |
| **3D Rendering** | Three.js + React Three Fiber (R3F) | 3D city scene, volumetric amber fog, dynamic lighting |
| **3D Helpers** | `@react-three/drei` | HTML overlays, camera controls, billboard tags |
| **State Management** | Zustand | 3D-to-UI state synchronization and flag tracking |
| **Styling** | Tailwind CSS | Cyberpunk retro HUD, CRT scanlines, responsive layout |
| **Audio** | Web Audio API | Procedural sound synthesizer (zero external audio files) |
| **Validation** | Next.js API Routes (`/api/verify-flag`) | SHA-256 flag verification |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm** / **yarn**

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Run Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🕹️ Controls & Navigation

- **Move Drone**: `W`, `A`, `S`, `D` or `Arrow Keys`
- **Enter Facility**: Walk into the glowing beacon radius or click any building on the map/radar
- **Tactical Radar**: Click building numbers on the bottom-left mini-map to instantly navigate
- **Terminal Tabs**:
  - `[ BRIEFING ]`: Story background and investigation objectives.
  - `[ EVIDENCE ]`: Logs, hex dumps, and cryptographic tables.
  - `[ SUBMIT FLAG ]`: Enter flag to verify and clear the sector.
  - `[ FRAGMENT ]`: View decrypted CSV table and download `.csv`.

---

## 🧩 The Five Sectors (Act III)

| Sector | Category | Pts | Status | ML idea it teaches |
| :--- | :--- | :--- | :--- | :--- |
| SEC-01 Commit History Archive | GitHub | 150 | offline, later drop | Data poisoning & versioning |
| SEC-02 The Archivist's Account | Instagram | 100 | **live** (real public account) | Mislabeled data |
| SEC-03 Sealed Features Vault | Cryptography | 100 | **live** | Features |
| SEC-04 Hash Mismatch Registry | Forensics | 150 | **live** | Dataset integrity |
| SEC-05 Who Edited This? | Forensics | 150 | **live** | Data provenance |

No ML knowledge is needed to solve any of them. Flag format is `LASTDATA{...}`. Every live sector has three hints (the first is cheap), at least one decoy, and a step that needs a human at a keyboard. Hints cost points; the terminal shows the live value.

SEC-02 needs the real public Instagram account named by `INSTAGRAM_HANDLE` in `lib/challenges.ts` to be up for the whole event. Offline sectors still open in the 3D city but only show an "offline" briefing, and the API refuses flags for them (HTTP 403).

---

## ⚙️ Adding & Customizing Challenges

Public challenge data (briefing, evidence, hints, downloads, points) lives in 👉 **[`lib/challenges.ts`](lib/challenges.ts)**. It is bundled into the browser, so **it must never contain a flag**.

Flags exist only as SHA-256 hashes, server-side, in `lib/server/flagHashes.generated.ts`, checked by `lib/server/flags.ts` through `/api/verify-flag`. Submissions are trimmed and upper-cased before hashing. A hash record also carries *decoy* hashes whose wrong answers return a targeted nudge.

```typescript
{
  id: 'building-3',
  buildingNumber: 3,
  name: 'Sealed Features Vault',
  sectorTag: 'SEC-03 / SEALED-FEATURES',
  coordinates: [-45, 0, 35],
  category: 'crypto',            // github | instagram | crypto | forensics
  status: 'live',                // 'coming-soon' renders an offline briefing
  points: 100,
  briefing: { ... },
  mlConnection: { concept: 'Features', text: '...' },
  hints: [{ cost: 5, text: '...' }, { cost: 15, text: '...' }, { cost: 30, text: '...' }],
  evidenceList: [ ... ],         // text evidence ('guide' items hold the tool cheat sheet)
  attachments: [ ... ],          // downloads served from /public/act3/...
  questionPrompt: { ... },
  datasetFragment: { fragmentId: 3, ... }   // reward unlocked on success
}
```

**Bringing SEC-01 online:** fill in the entry, set `status: 'live'`, and add its hash record to the generated flag file (use the organizer tooling, never type a flag into this repo).

Evidence artifacts (`public/act3/**`) are binary-exact on purpose: the hash challenge breaks if a checkout rewrites line endings, which is why they ship as a ZIP and `.gitattributes` marks `public/act3/**` as binary.

> **Organizer-only material** (the artifact generator, the answer key and the test suite) is *not* part of this repository. `/organizer-only/` and `ANSWER_KEY*` are git-ignored as a safety net.

---

## 📂 Project Structure

```
├── app/
│   ├── api/verify-flag/route.ts   # Server-side flag verification API (hash-only)
│   ├── ctf/page.tsx               # Simple challenge-list view
│   ├── globals.css                # Cyberpunk theme, CRT scanlines, animations
│   ├── layout.tsx                 # Root HTML layout & metadata
│   └── page.tsx                   # Main game entry & canvas wrapper
├── components/
│   ├── audio/SoundEffects.ts      # Web Audio API synthesizer
│   ├── canvas/                    # React Three Fiber 3D world components
│   │   ├── Building3D.tsx         # 3D building models, lights & HTML tags
│   │   ├── CityCanvas.tsx         # Client-side dynamic canvas loader
│   │   ├── CityEnvironment.tsx    # Grid, roads, fog, and particle simulation
│   │   ├── CityScene.tsx          # 3D scene & camera coordinator
│   │   └── Player3D.tsx           # Controllable player avatar
│   ├── terminal/                  # Split-screen forensic terminal
│   │   ├── DatasetViewer.tsx      # CSV parser, paginated table & download
│   │   └── TerminalHUD.tsx        # Multi-tab HUD with validation logic
│   └── ui/                        # HUD, Radar, and Modals
│       ├── HeaderHUD.tsx          # Top progress bar & controls
│       ├── InstructionsModal.tsx  # Game guide modal
│       ├── MasterDatasetModal.tsx # 100% completion celebration & full download
│       ├── MiniMap.tsx            # Bottom-left tactical radar
│       └── NotificationToast.tsx  # Interactive status alerts
├── lib/
│   ├── challenges.ts              # CTF challenge registry (public, no flags)
│   ├── server/                    # SERVER-ONLY: flag hashes + checker
│   │   ├── flagHashes.generated.ts
│   │   └── flags.ts
│   ├── store.ts                   # Zustand global state store
│   └── types.ts                   # TypeScript interfaces
├── public/
│   ├── act3/                      # Evidence artifacts (plate PNG, audit ZIP, certificate PDFs)
│   └── data/
│       ├── fragments/             # 5 partitioned CSV dataset fragments (90 rows each)
│       └── MANU_Historical_Records_Full.csv # Master 450-record dataset
├── .gitattributes                 # Line endings and binary attributes
├── .gitignore                      # Git ignore rules
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 📜 License
MIT
