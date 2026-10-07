'use client';

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Palette,
  BarChart3,
  Check,
  Terminal,
  Cpu,
  Zap,
  Globe,
  Lock,
  Unlock,
  ChevronUp,
  DoorOpen,
  SlidersHorizontal,
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { ThemePreset } from '@/lib/types';
import { sound } from '@/components/audio/SoundEffects';

// ─── CTF sector cards — open the in-page forensic terminal ─────────────────
const CTF_PORTAL_LINKS = [
  {
    id: 'building-1',
    label: 'SEC-01',
    name: 'Vault Breach',
    icon: Lock,
  },
  {
    id: 'building-2',
    label: 'SEC-02',
    name: "Archivist's Account",
    icon: Cpu,
  },
  {
    id: 'building-3',
    label: 'SEC-03',
    name: 'Sealed Features',
    icon: Zap,
  },
  {
    id: 'building-4',
    label: 'SEC-04',
    name: 'Hash Mismatch',
    icon: Globe,
  },
];

export const HeaderHUD: React.FC = () => {
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const themePreset = useGameStore((state) => state.themePreset);
  const setThemePreset = useGameStore((state) => state.setThemePreset);
  const setShowInstructions = useGameStore((state) => state.setShowInstructions);
  const setShowDashboard = useGameStore((state) => state.setShowDashboard);
  const setShowMasterModal = useGameStore((state) => state.setShowMasterModal);
  const resetProgress = useGameStore((state) => state.resetProgress);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const setActiveWaypoint = useGameStore((state) => state.setActiveWaypoint);
  const setNotification = useGameStore((state) => state.setNotification);
  const finaleState = useGameStore((state) => state.finaleState);
  const startFinale = useGameStore((state) => state.startFinale);
  const hudPanels = useGameStore((state) => state.hudPanels);
  const toggleHudPanel = useGameStore((state) => state.toggleHudPanel);

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const hudMenuOpen = useGameStore((state) => state.hudMenuOpen);
  const setHudMenuOpen = useGameStore((state) => state.setHudMenuOpen);

  const showTopBar = hudPanels.topBar;
  const showStrip = hudPanels.strip;
  // The HUD menu button lives: in the title bar, else in the strip, else floating
  const menuPlacement: 'topbar' | 'strip' | 'floating' = showTopBar
    ? 'topbar'
    : showStrip
      ? 'strip'
      : 'floating';

  const totalBuildings = FORENSIC_CHALLENGES.length;
  const clearedCount = clearedBuildingIds.length;
  const percentage = Math.round((clearedCount / totalBuildings) * 100);
  const isComplete = clearedCount === totalBuildings;

  const currentTheme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const handleSelectTheme = (preset: ThemePreset) => {
    if (soundEnabled) sound.playClick();
    setThemePreset(preset);
    setShowThemeMenu(false);
  };

  const showExitTab = isComplete && finaleState === 'idle';

  const handleStartFinale = () => {
    if (soundEnabled) sound.playMasterVictory();
    startFinale();
  };

  // Tab that appears once all 5 flags are captured — triggers the exit sequence
  const finalExitPill = showExitTab && (
    <button
      onClick={handleStartFinale}
      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105 animate-pulse"
      style={{
        background: 'linear-gradient(90deg, rgba(255,136,0,0.25), rgba(0,255,136,0.22))',
        borderColor: '#ffaa00',
        color: '#ffe9c4',
        boxShadow: '0 0 18px rgba(255,170,0,0.45)',
      }}
      title="Trigger the Orange Zone exit sequence"
    >
      <DoorOpen className="w-3.5 h-3.5" />
      ENTER FINAL EXIT
    </button>
  );

  // Trigger only — the dropdown panel itself lives in <HudMenuPanel/> at page
  // level (viewport-fixed, z-70): inside the strip it was clipped by
  // overflow-x-auto + backdrop-filter.
  const renderHudMenu = () => (
    <button
      onClick={() => {
        if (soundEnabled) sound.playClick();
        setHudMenuOpen(!hudMenuOpen);
      }}
      className={`p-2.5 bg-cyber-darker/90 hover:bg-gray-800 border transition-colors rounded-lg ${
        hudMenuOpen ? 'border-gray-400 text-white' : 'border-gray-700 hover:border-gray-500 text-gray-300'
      }`}
      title="HUD display options — show or hide panels"
    >
      <SlidersHorizontal className="w-4 h-4" style={{ color: currentTheme.uiAccentHex }} />
    </button>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none font-mono">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP BAR — title + controls (theme-reactive bg, hideable)
      ═══════════════════════════════════════════════════════════════════ */}
      {showTopBar && (
      <div
        className="pointer-events-auto px-4 md:px-5 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b"
        style={{
          background: currentTheme.uiPanelBg,
          borderColor: `${currentTheme.uiAccentHex}30`,
          boxShadow: `0 4px 40px ${currentTheme.uiAccentHex}18`,
        }}
      >
        {/* Left — Title & badge */}
        <div className={`flex items-center space-x-3`}>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ background: `${currentTheme.uiAccentHex}22`, borderColor: `${currentTheme.uiAccentHex}60` }}
          >
            <ShieldCheck className="w-5 h-5" style={{ color: currentTheme.uiAccentHex }} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: currentTheme.uiAccentHex }}
              >
                MANU PROTOCOL // FORENSICS DEPARTMENT
              </span>
              <span
                className="px-1.5 py-0.5 text-[9px] rounded font-bold"
                style={{ background: `${currentTheme.uiAccentHex}25`, color: currentTheme.uiAccentHex }}
              >
                ORANGE ZONE
              </span>
            </div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-wide">
              CIVIC EVIDENCE VAULT RECONSTRUCTION
            </h1>
          </div>
        </div>

        {/* Right — Controls */}
        <div className="pointer-events-auto flex items-center space-x-2.5">

          {/* HUD display dropdown (show / hide panels) */}
          {menuPlacement === 'topbar' && renderHudMenu()}

          {/* Dashboard */}
          <button
            onClick={() => { if (soundEnabled) sound.playClick(); setShowDashboard(true); }}
            className="px-3 py-2 rounded-lg flex items-center space-x-2 text-xs border transition-all text-white"
            style={{ background: `${currentTheme.uiAccentHex}15`, borderColor: `${currentTheme.uiAccentHex}40` }}
            title="Open Forensic Operations Dashboard"
          >
            <BarChart3 className="w-4 h-4" style={{ color: currentTheme.uiAccentHex }} />
            <span className="font-bold">DASHBOARD</span>
          </button>

          {/* Theme Selector */}
          <div className="relative">
            <button
              onClick={() => { if (soundEnabled) sound.playClick(); setShowThemeMenu(!showThemeMenu); }}
              className="px-3 py-2 bg-cyber-darker/90 border border-gray-700 hover:border-gray-500 text-white rounded-lg flex items-center space-x-2 text-xs transition-all"
            >
              <Palette className="w-4 h-4" style={{ color: currentTheme.uiAccentHex }} />
              <span className="hidden sm:inline text-gray-300">THEME:</span>
              <span className="font-bold" style={{ color: currentTheme.uiAccentHex }}>{currentTheme.name}</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>
            {showThemeMenu && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-cyber-darker/98 border border-gray-700 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-2xl space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-800">
                  SELECT VISUAL ATMOSPHERE
                </div>
                {(Object.keys(THEMES) as ThemePreset[]).map((key) => {
                  const t = THEMES[key];
                  const isSelected = themePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectTheme(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-start space-x-2.5 transition-all text-xs ${
                        isSelected ? 'border font-bold' : 'hover:bg-gray-800/60 text-gray-300'
                      }`}
                      style={isSelected ? { background: `${t.uiAccentHex}20`, borderColor: `${t.uiAccentHex}50` } : {}}
                    >
                      <div className="mt-0.5">
                        {isSelected
                          ? <Check className="w-3.5 h-3.5 text-cyber-green" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                        }
                      </div>
                      <div>
                        <div className="text-white font-bold">{t.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{t.tagline}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Dataset Download */}
          {isComplete && (
            <button
              onClick={() => { if (soundEnabled) sound.playClick(); setShowMasterModal(true); }}
              className="px-3 py-2.5 text-slate-900 font-bold text-xs rounded-lg flex items-center space-x-1.5 animate-pulse transition-all"
              style={{ background: '#00ff88', boxShadow: '0 0 20px rgba(0,255,136,0.5)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">MASTER ARCHIVE</span>
            </button>
          )}

          {/* Help */}
          <button
            onClick={() => { if (soundEnabled) sound.playClick(); setShowInstructions(true); }}
            className="p-2.5 bg-cyber-darker/90 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors"
            title="Investigation Guide & Controls"
          >
            <HelpCircle className="w-4 h-4" style={{ color: currentTheme.uiAccentHex }} />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => { toggleSound(); sound.playClick(); }}
            className="p-2.5 bg-cyber-darker/90 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled
              ? <Volume2 className="w-4 h-4" style={{ color: currentTheme.uiAccentHex }} />
              : <VolumeX className="w-4 h-4 text-gray-500" />
            }
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              if (confirm('Reset your forensic investigation session and locked flags?')) {
                if (soundEnabled) sound.playClick();
                resetProgress();
              }
            }}
            className="p-2.5 bg-cyber-darker/90 hover:bg-gray-800 border border-gray-700 hover:border-cyber-red text-gray-400 hover:text-cyber-red rounded-lg transition-colors"
            title="Reset Investigation Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Hide title bar (restore via HUD menu or floating button) */}
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              toggleHudPanel('topBar');
            }}
            className="p-2.5 bg-cyber-darker/90 hover:bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Hide title bar"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ARENA STRIP — doubled width, CTF portal cards + AI image slots
          (pinned below the top bar, stretched full-width, collapsible)
      ═══════════════════════════════════════════════════════════════════ */}
      {showStrip && (
      <div
        className="pointer-events-auto w-full px-4 md:px-6 py-2 flex items-center gap-3 border-b overflow-x-auto"
        style={{
          background: `${currentTheme.uiPanelBg}`,
          borderColor: `${currentTheme.uiAccentHex}18`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* ── Progress meter (wider / doubled) ──────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border"
          style={{ background: `${currentTheme.uiAccentHex}0d`, borderColor: `${currentTheme.uiAccentHex}30` }}
        >
          <div className="text-right">
            <div className="text-[9px] text-gray-400 uppercase tracking-wider">PROGRESS</div>
            <div className="text-xs font-bold text-white flex items-center space-x-1">
              <span style={{ color: isComplete ? '#00ff88' : currentTheme.uiAccentHex }}>
                {clearedCount}/{totalBuildings}
              </span>
              <span className="text-gray-500">({percentage}%)</span>
            </div>
          </div>
          {/* Wide progress bar (doubled from bar-chips to a gradient fill bar) */}
          <div className="w-32 h-4 bg-cyber-darker/40 rounded border" style={{ borderColor: `${currentTheme.uiAccentHex}30` }}>
            <div
              className="h-full rounded transition-all duration-700"
              style={{
                width: `${percentage}%`,
                background: isComplete
                  ? 'linear-gradient(90deg,#00ff88,#00cc66)'
                  : `linear-gradient(90deg,${currentTheme.uiAccentHex},${currentTheme.roadTrimColor})`,
                boxShadow: `0 0 8px ${isComplete ? '#00ff88' : currentTheme.uiAccentHex}80`,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700 flex-shrink-0" />

        {/* ── CTF Portal Link Cards (one per sector) ────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {CTF_PORTAL_LINKS.map((portal) => {
            const isCleared = clearedBuildingIds.includes(portal.id);
            const Icon = portal.icon;
            return (
              <button
                key={portal.id}
                type="button"
                onClick={() => {
                  if (soundEnabled) sound.playClick();
                  if (isCleared) {
                    setActiveBuilding(portal.id);
                  } else {
                    // Locked sector: guide the driver instead of opening remotely
                    setActiveWaypoint(portal.id);
                    setNotification({
                      message: `${portal.label} locked — drive the car to this building to open its terminal.`,
                      type: 'info',
                    });
                  }
                }}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all duration-200 select-none ${
                  isCleared ? 'hover:scale-105' : 'opacity-60 hover:opacity-90'
                }`}
                style={{
                  background: isCleared
                    ? 'rgba(0,255,136,0.12)'
                    : 'rgba(140,150,170,0.07)',
                  borderColor: isCleared
                    ? 'rgba(0,255,136,0.5)'
                    : 'rgba(140,150,170,0.25)',
                  color: isCleared ? '#00ff88' : '#8b95a7',
                  boxShadow: isCleared
                    ? '0 0 10px rgba(0,255,136,0.25)'
                    : 'none',
                }}
                title={
                  isCleared
                    ? `Open ${portal.label} forensic terminal`
                    : `Locked — drive here to unlock`
                }
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="tracking-wide">{portal.label}</span>
                {isCleared
                  ? <Unlock className="w-2.5 h-2.5 opacity-80" />
                  : <Lock className="w-2.5 h-2.5 opacity-80" />
                }
                <Terminal className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                {/* Tooltip name on hover */}
                <span
                  className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: currentTheme.uiPanelBg, color: '#ddd', border: `1px solid ${currentTheme.uiAccentHex}30` }}
                >
                  {portal.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700 flex-shrink-0" />

        {/* Right-edge filler */}
        <div className="flex-1" />

        {/* Final Exit tab (appears at 5/5 flags) */}
        {finalExitPill}

        {/* HUD menu (when title bar is hidden) */}
        {menuPlacement === 'strip' && renderHudMenu()}

        {/* Small zone label */}
        <div
          className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border"
          style={{ color: currentTheme.uiAccentHex, borderColor: `${currentTheme.uiAccentHex}30`, background: `${currentTheme.uiAccentHex}0c` }}
        >
          ◉ ORANGE ZONE ACTIVE
        </div>

        {/* Hide the progress & sector strip (restore via HUD menu) */}
        <button
          onClick={() => { if (soundEnabled) sound.playClick(); toggleHudPanel('strip'); }}
          className="flex-shrink-0 p-1.5 rounded-lg border transition-all hover:scale-110"
          style={{
            color: currentTheme.uiAccentHex,
            borderColor: `${currentTheme.uiAccentHex}40`,
            background: `${currentTheme.uiAccentHex}10`,
          }}
          title="Hide progress & sector strip"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
      )}

      {/* Floating HUD menu — the only remnant when title bar + strip are hidden */}
      {menuPlacement === 'floating' && (
        <div className="pointer-events-auto fixed top-3 right-3 z-50">
          {renderHudMenu()}
        </div>
      )}
    </header>
  );
};
