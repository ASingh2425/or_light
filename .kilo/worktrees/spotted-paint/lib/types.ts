export interface EvidenceItem {
  id: string;
  title: string;
  type: 'log' | 'hex' | 'json' | 'record' | 'manifest';
  content: string;
  notes?: string;
}

export type ThemePreset = 'cyberpunk-neon' | 'deus-ex' | 'blade-runner';

export interface BuildingChallenge {
  id: string;
  buildingNumber: number;
  name: string;
  sectorTag: string;
  coordinates: [number, number, number];
  color: string;
  themeColor: string;
  briefing: {
    title: string;
    subtitle: string;
    storyContext: string;
    objective: string;
    loreHint: string;
  };
  evidenceList: EvidenceItem[];
  questionPrompt: {
    text: string;
    inputPlaceholder: string;
    formatHint: string;
  };
  defaultFlag: string;
  flagHash: string;
  evidenceImage?: string;
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
  toggleSound: () => void;
  setThemePreset: (preset: ThemePreset) => void;
  setShowMasterModal: (show: boolean) => void;
  setShowInstructions: (show: boolean) => void;
  setShowDashboard: (show: boolean) => void;
  setNotification: (notif: { message: string; type: 'info' | 'success' | 'warning' } | null) => void;
  resetProgress: () => void;
}
