import { create } from 'zustand';
import { GameState, ThemePreset } from './types';
import { FORENSIC_CHALLENGES } from './challenges';
import { sound } from '@/components/audio/SoundEffects';

export const STORAGE_KEY = 'manu-forensics-state';

const VALID_BUILDING_IDS = new Set(FORENSIC_CHALLENGES.map((c) => c.id));

export function isBuildingUnlocked(buildingId: string, clearedBuildingIds: string[]): boolean {
  const index = FORENSIC_CHALLENGES.findIndex((c) => c.id === buildingId);
  if (index <= 0) return true;
  const prevBuilding = FORENSIC_CHALLENGES[index - 1];
  return clearedBuildingIds.includes(prevBuilding.id);
}

function sanitizePersistedState(value: unknown): Partial<GameState> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const sanitized: Partial<GameState> = {};

  if (Array.isArray(raw.clearedBuildingIds)) {
    const ids = raw.clearedBuildingIds.filter(
      (id): id is string => typeof id === 'string' && VALID_BUILDING_IDS.has(id)
    );
    sanitized.clearedBuildingIds = Array.from(new Set(ids));
  }

  if (
    raw.submittedFlags &&
    typeof raw.submittedFlags === 'object' &&
    !Array.isArray(raw.submittedFlags)
  ) {
    const flags: Record<string, string> = {};
    for (const [id, flag] of Object.entries(raw.submittedFlags as Record<string, unknown>)) {
      if (VALID_BUILDING_IDS.has(id) && typeof flag === 'string') flags[id] = flag;
    }
    sanitized.submittedFlags = flags;
  }

  return sanitized;
}

function loadPersistedState(): Partial<GameState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitizePersistedState(JSON.parse(raw));
  } catch {
    return {};
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  playerPos: [0, 0, 0],
  playerHeading: 0,
  carSpeed: 0,
  isNitroActive: false,
  isUvLightActive: false,
  isSirenActive: false,
  activeBuildingId: null,
  activeWaypointId: 'building-1',
  sonarScanTrigger: 0,
  selectedEvidenceImage: null,
  clearedBuildingIds: [],
  submittedFlags: {},
  isTerminalOpen: false,
  isTerminalMinimized: false,
  activeTerminalTab: 'briefing',
  soundEnabled: true,
  themePreset: 'cyberpunk-neon',
  showMasterModal: false,
  showInstructions: false,
  showDashboard: false,
  notification: null,

  setPlayerPos: (pos) => set({ playerPos: pos }),
  setPlayerHeading: (heading) => set({ playerHeading: heading }),
  setCarSpeed: (speed) => set({ carSpeed: speed }),
  setNitroActive: (active) => set({ isNitroActive: active }),
  toggleUvLight: () => set((s) => ({ isUvLightActive: !s.isUvLightActive })),
  toggleSiren: () => set((s) => ({ isSirenActive: !s.isSirenActive })),
  triggerSonarPulse: () => set((s) => ({ sonarScanTrigger: s.sonarScanTrigger + 1 })),
  setActiveWaypoint: (id) => set({ activeWaypointId: id }),
  setSelectedEvidenceImage: (img) => set({ selectedEvidenceImage: img }),
  
  setActiveBuilding: (id) => {
    if (id !== null) {
      const cleared = get().clearedBuildingIds;
      if (!isBuildingUnlocked(id, cleared)) {
        const challenge = FORENSIC_CHALLENGES.find((c) => c.id === id);
        const index = FORENSIC_CHALLENGES.findIndex((c) => c.id === id);
        const prevBuilding = index > 0 ? FORENSIC_CHALLENGES[index - 1] : null;
        if (get().soundEnabled) sound.playError();
        set({
          notification: {
            message: `CLEARANCE DENIED: Complete Sector 0${prevBuilding?.buildingNumber || 1} before opening ${challenge?.name || 'this sector'}.`,
            type: 'warning',
          },
        });
        return;
      }
    }
    set({ 
      activeBuildingId: id,
      isTerminalOpen: id !== null,
      isTerminalMinimized: false,
      activeTerminalTab: 'briefing',
      activeWaypointId: id || get().activeWaypointId,
    });
  },

  setTerminalOpen: (isOpen) => {
    set({ 
      isTerminalOpen: isOpen,
      activeBuildingId: isOpen ? get().activeBuildingId : null
    });
  },

  setTerminalMinimized: (minimized) => set({ isTerminalMinimized: minimized }),

  setActiveTerminalTab: (tab) => set({ activeTerminalTab: tab }),

  setThemePreset: (preset: ThemePreset) => {
    set({ themePreset: preset });
  },

  unlockBuilding: (id, flag) => {
    const current = get().clearedBuildingIds;
    if (!current.includes(id)) {
      const nextCleared = [...current, id];
      const nextFlags = { ...get().submittedFlags, [id]: flag };
      
      set({ 
        clearedBuildingIds: nextCleared,
        submittedFlags: nextFlags,
        activeTerminalTab: 'fragment'
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            clearedBuildingIds: nextCleared,
            submittedFlags: nextFlags,
          }));
        } catch {
          // Progress is already in memory; a storage failure must not fail the unlock.
        }
      }

      if (nextCleared.length === 5) {
        setTimeout(() => {
          set({ showMasterModal: true });
        }, 1200);
      }
    }
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  setShowMasterModal: (show) => set({ showMasterModal: show }),

  setShowInstructions: (show) => set({ showInstructions: show }),

  setShowDashboard: (show) => set({ showDashboard: show }),

  setNotification: (notif) => set({ notification: notif }),

  resetProgress: () => {
    set({
      clearedBuildingIds: [],
      submittedFlags: {},
      activeBuildingId: null,
      isTerminalOpen: false,
      showMasterModal: false,
      showDashboard: false,
      notification: null
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage unavailable; in-memory state is already cleared.
      }
    }
  }
}));

let hasHydratedFromStorage = false;

export function hydrateStoreFromStorage() {
  if (hasHydratedFromStorage || typeof window === 'undefined') return;
  hasHydratedFromStorage = true;

  const persisted = loadPersistedState();
  if (!persisted.clearedBuildingIds && !persisted.submittedFlags) return;

  useGameStore.setState({
    clearedBuildingIds: persisted.clearedBuildingIds || [],
    submittedFlags: persisted.submittedFlags || {},
  });
}
