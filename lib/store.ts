import { create } from 'zustand';
import { GameState, HudPanelKey, ThemePreset } from './types';
import { ACTIVE_CHALLENGES, TOTAL_ACTIVE_SECTORS } from './challenges';
import { FINALE_AUTO_START_DELAY_MS } from './constants';
import { sound } from '@/components/audio/SoundEffects';

export const useGameStore = create<GameState>((set, get) => ({
  playerPos: [0, 0, 0],
  playerHeading: 0,
  carSpeed: 0,
  isNitroActive: false,
  activeBuildingId: null,
  activeWaypointId: 'building-1',
  selectedEvidenceImage: null,
  clearedBuildingIds: [],
  submittedFlags: {},
  isTerminalOpen: false,
  activeTerminalTab: 'briefing',
  soundEnabled: true,
  themePreset: 'cyberpunk-neon',
  showMasterModal: false,
  showInstructions: false,
  showDashboard: false,
  notification: null,
  finaleState: 'idle',
  downloadedFragmentIds: [],
  teleportNonce: 0,
  cameraMode: 'chase',
  hudPanels: { topBar: true, strip: true, cockpit: true, radar: true },
  hudMenuOpen: false,

  setPlayerPos: (pos) => set({ playerPos: pos }),
  setPlayerHeading: (heading) => set({ playerHeading: heading }),
  setCarSpeed: (speed) => set({ carSpeed: speed }),
  setNitroActive: (active) => set({ isNitroActive: active }),
  setActiveWaypoint: (id) => set({ activeWaypointId: id }),
  setSelectedEvidenceImage: (img) => set({ selectedEvidenceImage: img }),
  
  setActiveBuilding: (id) => {
    set({ 
      activeBuildingId: id,
      isTerminalOpen: id !== null,
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

      const liveCleared = nextCleared.filter((clearedId) =>
        ACTIVE_CHALLENGES.some((c) => c.id === clearedId)
      ).length;

      // Every live sector cleared -> kick off the ray-convergence finale.
      if (liveCleared >= TOTAL_ACTIVE_SECTORS && get().finaleState === 'idle') {
        setTimeout(() => {
          const stillComplete =
            get().clearedBuildingIds.filter((clearedId) =>
              ACTIVE_CHALLENGES.some((c) => c.id === clearedId)
            ).length >= TOTAL_ACTIVE_SECTORS;
          if (!stillComplete || get().finaleState !== 'idle') return;
          sound.playMasterVictory();
          get().startFinale();
        }, FINALE_AUTO_START_DELAY_MS);
      }
    }
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  setShowMasterModal: (show) => set({ showMasterModal: show }),

  setShowInstructions: (show) => set({ showInstructions: show }),

  setShowDashboard: (show) => set({ showDashboard: show }),

  setNotification: (notif) => set({ notification: notif }),

  startFinale: () =>
    set({
      finaleState: 'running',
      isTerminalOpen: false,
      activeBuildingId: null,
      showMasterModal: false,
      showDashboard: false,
      showInstructions: false,
    }),

  beginFinaleRedirect: () => set({ finaleState: 'redirecting' }),

  returnToArena: () => set({ finaleState: 'idle' }),

  markFragmentDownloaded: (fragmentId) =>
    set((s) =>
      s.downloadedFragmentIds.includes(fragmentId)
        ? s
        : { downloadedFragmentIds: [...s.downloadedFragmentIds, fragmentId] }
    ),

  requestTeleport: (pos) =>
    set((s) => ({ playerPos: pos, teleportNonce: s.teleportNonce + 1 })),

  cycleCameraMode: () =>
    set((s) => ({
      cameraMode:
        s.cameraMode === 'chase' ? 'close' :
        s.cameraMode === 'close' ? 'wide' :
        s.cameraMode === 'wide' ? 'top' : 'chase',
    })),

  toggleHudPanel: (key: HudPanelKey) =>
    set((s) => ({ hudPanels: { ...s.hudPanels, [key]: !s.hudPanels[key] } })),

  setHudMenuOpen: (open) => set({ hudMenuOpen: open }),

  resetProgress: () => {
    set({
      clearedBuildingIds: [],
      submittedFlags: {},
      activeBuildingId: null,
      isTerminalOpen: false,
      showMasterModal: false,
      showDashboard: false,
      notification: null,
      finaleState: 'idle',
      downloadedFragmentIds: [],
    });
  }
}));
