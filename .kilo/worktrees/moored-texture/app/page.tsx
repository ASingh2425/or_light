'use client';

import React, { useEffect } from 'react';
import { CityCanvas } from '@/components/canvas/CityCanvas';
import { HeaderHUD } from '@/components/ui/HeaderHUD';
import { TerminalHUD } from '@/components/terminal/TerminalHUD';
import { MiniMap } from '@/components/ui/MiniMap';
import { MasterDatasetModal } from '@/components/ui/MasterDatasetModal';
import { InstructionsModal } from '@/components/ui/InstructionsModal';
import { DashboardModal } from '@/components/ui/DashboardModal';
import { NotificationToast } from '@/components/ui/NotificationToast';
import { CarCockpitHUD } from '@/components/ui/CarCockpitHUD';
import { EvidenceImageModal } from '@/components/ui/EvidenceImageModal';
import { useGameStore, hydrateStoreFromStorage } from '@/lib/store';
import { THEMES } from '@/lib/themes';

export default function Home() {
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  useEffect(() => {
    // Rehydrate persisted progress after mount so the first client render
    // matches the statically prerendered HTML.
    hydrateStoreFromStorage();
  }, []);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden transition-colors duration-700"
      style={{
        background: theme.pageBg,
        '--theme-bg': theme.pageBg,
        '--theme-panel': theme.pageBg,
        '--theme-accent': theme.uiAccentHex,
      } as React.CSSProperties}
    >
      {/* Background 3D City Simulation Engine */}
      <div className="absolute inset-0 z-0">
        <CityCanvas />
      </div>

      {/* Top Header & HUD */}
      <HeaderHUD />

      {/* Mini Radar Map in Bottom-Left */}
      <MiniMap />

      {/* Interactive Car Cockpit Controls at Bottom-Center */}
      <CarCockpitHUD />

      {/* Split-Screen Interactive Forensic Terminal (Right Side) */}
      <TerminalHUD />

      {/* Modals & Overlays */}
      <DashboardModal />
      <MasterDatasetModal />
      <InstructionsModal />
      <NotificationToast />
      <EvidenceImageModal />
    </main>
  );
}
