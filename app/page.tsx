'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CityCanvas } from '@/components/canvas/CityCanvas';
import { HeaderHUD } from '@/components/ui/HeaderHUD';
import { MiniMap } from '@/components/ui/MiniMap';
import { NotificationToast } from '@/components/ui/NotificationToast';
import { CarCockpitHUD } from '@/components/ui/CarCockpitHUD';
import { HudMenuPanel } from '@/components/ui/HudMenuPanel';
import { FinaleOverlay } from '@/components/ui/FinaleOverlay';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';

const TerminalHUD = dynamic(
  () => import('@/components/terminal/TerminalHUD').then((m) => m.TerminalHUD),
  { ssr: false }
);
const DashboardModal = dynamic(
  () => import('@/components/ui/DashboardModal').then((m) => m.DashboardModal),
  { ssr: false }
);
const MasterDatasetModal = dynamic(
  () => import('@/components/ui/MasterDatasetModal').then((m) => m.MasterDatasetModal),
  { ssr: false }
);
const InstructionsModal = dynamic(
  () => import('@/components/ui/InstructionsModal').then((m) => m.InstructionsModal),
  { ssr: false }
);
const EvidenceImageModal = dynamic(
  () => import('@/components/ui/EvidenceImageModal').then((m) => m.EvidenceImageModal),
  { ssr: false }
);

export default function Home() {
  const setNotification = useGameStore((state) => state.setNotification);
  const finaleState = useGameStore((state) => state.finaleState);
  const hudPanels = useGameStore((state) => state.hudPanels);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];
  const hudVisible = finaleState === 'idle';

  useEffect(() => {
    // Welcome message on boot
    setNotification({
      message: 'FORENSIC INVESTIGATION ZONE INITIALIZED. Navigate the vehicle across sectors to reconstruct evidence.',
      type: 'info',
    });
  }, [setNotification]);

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

      {/* Top Header & HUD (hidden during the finale for cinematic view) */}
      {hudVisible && (
        <>
          <HeaderHUD />
          <HudMenuPanel />
          {hudPanels.radar && <MiniMap />}
          {hudPanels.cockpit && <CarCockpitHUD />}
          <TerminalHUD />
          <DashboardModal />
          <MasterDatasetModal />
          <InstructionsModal />
        </>
      )}

      {/* Finale: progress banner → white flash → redirect */}
      <FinaleOverlay />

      <NotificationToast />
      <EvidenceImageModal />
    </main>
  );
}
