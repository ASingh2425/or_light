# MANU Protocol: Orange Zone // Forensics Department CTF Portal

An interactive, gamified 3D CTF and Dataset Forensic Investigation portal built with **Next.js 14**, **React Three Fiber (Three.js)**, **Tailwind CSS**, and **Zustand**.

---

## 📖 Overview & Lore

Participants play as investigators entering the **Orange Zone** (Civic Evidence Vault & Archives) following the events of the MANU Protocol:
1. **Explore the City**: Navigate a 3D isometric city district using an investigator drone.
2. **Access Forensic Facilities**: Enter 5 sealed archive buildings to trigger split-screen cyber-forensic terminals.
3. **Solve CTF Challenges**: Inspect access logs, biometric hash registries, protective falsification diagnostic logs, and transfer manifests.
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

## ⚙️ Adding & Customizing Challenges

All CTF challenges, briefings, evidence logs, questions, and flag hashes are located in a single file:
👉 **[`lib/challenges.ts`](lib/challenges.ts)**

Each challenge structure:
```typescript
{
  id: 'building-1',
  buildingNumber: 1,
  name: 'Vault Sub-Level Access Terminal',
  sectorTag: 'SEC-01 / BREACH-LOG',
  coordinates: [-18, 0, -14],
  color: '#ff6600',
  briefing: { ... },
  evidenceList: [ ... ],
  questionPrompt: { ... },
  defaultFlag: 'MANU{...}',
  flagHash: '<sha-256-hash-of-flag>',
  datasetFragment: {
    fragmentId: 1,
    filename: 'fragment_1.csv',
    downloadUrl: '/data/fragments/fragment_1.csv',
    recordRange: 'HIST_001 — HIST_090',
    rowCount: 90,
    description: '...'
  }
}
```

---

## 📂 Project Structure

```
├── app/
│   ├── api/verify-flag/route.ts   # Server-side flag verification API
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
│   ├── challenges.ts              # CTF challenge registry and flag hashes
│   ├── store.ts                   # Zustand global state store
│   └── types.ts                   # TypeScript interfaces
├── public/
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
