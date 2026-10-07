import { create } from 'zustand';
import { GameState, HudPanelKey, ThemePreset } from './types';

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
    // SEC-05 is a dead sector — its CTF terminal was removed, so it never opens.
    if (id === 'building-5') return;
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

      if (nextCleared.length === 5 && get().finaleState === 'idle') {
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
    });
  }
}));
