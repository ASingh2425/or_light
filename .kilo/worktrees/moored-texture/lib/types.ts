export interface EvidenceItem {
  id: string;
  title: string;
  type: 'log' | 'hex' | 'json' | 'record' | 'manifest' | 'guide';
  content: string;
  notes?: string;
}

/** A downloadable evidence file served from /public (players analyse it on their own machine). */
export interface EvidenceAttachment {
  id: string;
  label: string;
  filename: string;
  url: string;
  description: string;
}

/** One tier of the hint ladder. `cost` is the points deducted when revealed. */
export interface ChallengeHint {
  cost: number;
  text: string;
}

export type ChallengeCategory = 'github' | 'instagram' | 'crypto' | 'forensics';

/** 'coming-soon' sectors render an offline briefing and cannot be solved yet. */
export type ChallengeStatus = 'live' | 'coming-soon';

export type ThemePreset = 'cyberpunk-neon' | 'deus-ex' | 'blade-runner';

export interface BuildingChallenge {
  id: string;
  buildingNumber: number;
  name: string;
  sectorTag: string;
  coordinates: [number, number, number];
  color: string;
  themeColor: string;
  category: ChallengeCategory;
  status: ChallengeStatus;
  points: number;
  briefing: {
    title: string;
    subtitle: string;
    storyContext: string;
    objective: string;
  };
  /** The machine-learning idea this challenge quietly teaches (no ML needed to solve it). */
  mlConnection?: { concept: string; text: string };
  /** Ordered hint ladder - first tier is cheap. */
  hints: ChallengeHint[];
  evidenceList: EvidenceItem[];
  attachments?: EvidenceAttachment[];
  questionPrompt: {
    text: string;
    inputPlaceholder: string;
    formatHint: string;
  };
  // NOTE: flags are never stored here. Only SHA-256 hashes exist, server-side,
  // in lib/server/flagHashes.generated.ts. This file is bundled into the browser.
  evidenceImage?: string;
  evidenceImageCaption?: string;
  datasetFragment: {
    fragmentId: number;
    filename: string;
    downloadUrl: string;
    recordRange: string;
    rowCount: number;
    description: string;
  };
}

export interface GameState {
  playerPos: [number, number, number];
  playerHeading: number;
  carSpeed: number;
  isNitroActive: boolean;
  isUvLightActive: boolean;
  isSirenActive: boolean;
  activeBuildingId: string | null;
  activeWaypointId: string | null;
  sonarScanTrigger: number;
  selectedEvidenceImage: { url: string; title: string; subtitle?: string } | null;
  clearedBuildingIds: string[];
  submittedFlags: Record<string, string>;
  /** Number of hint tiers revealed per building (persisted). */
  revealedHints: Record<string, number>;
  isTerminalOpen: boolean;
  isTerminalMinimized: boolean;
  activeTerminalTab: 'briefing' | 'evidence' | 'flag' | 'fragment';
  soundEnabled: boolean;
  themePreset: ThemePreset;
  showMasterModal: boolean;
  showInstructions: boolean;
  showDashboard: boolean;
  notification: { message: string; type: 'info' | 'success' | 'warning' } | null;
  
  // Actions
  setPlayerPos: (pos: [number, number, number]) => void;
  setPlayerHeading: (heading: number) => void;
  setCarSpeed: (speed: number) => void;
  setNitroActive: (active: boolean) => void;
  toggleUvLight: () => void;
  toggleSiren: () => void;
  triggerSonarPulse: () => void;
  setActiveWaypoint: (id: string | null) => void;
  setSelectedEvidenceImage: (img: { url: string; title: string; subtitle?: string } | null) => void;
  setActiveBuilding: (id: string | null) => void;
  setTerminalOpen: (isOpen: boolean) => void;
  setTerminalMinimized: (minimized: boolean) => void;
  setActiveTerminalTab: (tab: 'briefing' | 'evidence' | 'flag' | 'fragment') => void;
  unlockBuilding: (id: string, flag: string) => void;
  revealHint: (id: string) => void;
  toggleSound: () => void;
  setThemePreset: (preset: ThemePreset) => void;
  setShowMasterModal: (show: boolean) => void;
  setShowInstructions: (show: boolean) => void;
  setShowDashboard: (show: boolean) => void;
  setNotification: (notif: { message: string; type: 'info' | 'success' | 'warning' } | null) => void;
  resetProgress: () => void;
}
