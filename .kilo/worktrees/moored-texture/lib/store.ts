import { create } from 'zustand';
import { GameState, ThemePreset } from './types';
import { FORENSIC_CHALLENGES } from './challenges';
import { sound } from '@/components/audio/SoundEffects';

export const STORAGE_KEY = 'manu-forensics-state';

const VALID_BUILDING_IDS = new Set(FORENSIC_CHALLENGES.map((c) => c.id));

/**
 * Sectors are standalone and can be opened in any order, so every known
 * sector is enterable. (Offline sectors still open, but only to show their
 * offline briefing; see `status` in lib/challenges.ts.)
 * The second parameter is kept so existing call sites don't change.
 */
export function isBuildingUnlocked(buildingId: string, _clearedBuildingIds: string[]): boolean {
  void _clearedBuildingIds;
  return VALID_BUILDING_IDS.has(buildingId);
}

interface PersistedShape {
  clearedBuildingIds: string[];
  submittedFlags: Record<string, string>;
  revealedHints: Record<string, number>;
}

function persistState(next: PersistedShape) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Progress is already in memory; a storage failure must not break gameplay.
  }
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

  if (
    raw.revealedHints &&
    typeof raw.revealedHints === 'object' &&
    !Array.isArray(raw.revealedHints)
  ) {
    const hints: Record<string, number> = {};
    for (const [id, n] of Object.entries(raw.revealedHints as Record<string, unknown>)) {
      const challenge = FORENSIC_CHALLENGES.find((c) => c.id === id);
      if (challenge && typeof n === 'number' && Number.isInteger(n) && n > 0) {
        const clamped = Math.min(n, challenge.hints.length);
        if (clamped > 0) hints[id] = clamped;
      }
    }
    sanitized.revealedHints = hints;
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
  activeWaypointId: 'building-3',
  sonarScanTrigger: 0,
  selectedEvidenceImage: null,
  clearedBuildingIds: [],
  submittedFlags: {},
  revealedHints: {},
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
        if (get().soundEnabled) sound.playError();
        set({
          notification: {
            message: 'CLEARANCE DENIED: unknown sector.',
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

      persistState({
        clearedBuildingIds: nextCleared,
        submittedFlags: nextFlags,
        revealedHints: get().revealedHints,
      });

      if (nextCleared.length === FORENSIC_CHALLENGES.length) {
        setTimeout(() => {
          set({ showMasterModal: true });
        }, 1200);
      }
    }
  },

  revealHint: (id) => {
    const challenge = FORENSIC_CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    const current = get().revealedHints[id] ?? 0;
    if (current >= challenge.hints.length) return;
    const nextHints = { ...get().revealedHints, [id]: current + 1 };
    set({ revealedHints: nextHints });
    persistState({
      clearedBuildingIds: get().clearedBuildingIds,
      submittedFlags: get().submittedFlags,
      revealedHints: nextHints,
    });
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
      revealedHints: {},
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
  if (!persisted.clearedBuildingIds && !persisted.submittedFlags && !persisted.revealedHints) return;

  useGameStore.setState({
    clearedBuildingIds: persisted.clearedBuildingIds || [],
    submittedFlags: persisted.submittedFlags || {},
    revealedHints: persisted.revealedHints || {},
  });
}
