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
  Cpu,
  Bot,
  Zap,
  Globe,
  Lock,
  Unlock,
} from 'lucide-react';
import { useGameStore, isBuildingUnlocked } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { ThemePreset } from '@/lib/types';
import { sound } from '@/components/audio/SoundEffects';
import { FragmentsDropdown } from '@/components/ui/FragmentsDropdown';

// ─── CTF Portal sector cards ───────────────────────────────────────────────
// Each card opens the in-arena forensic terminal for that sector
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
    name: 'Identity Node',
    icon: Cpu,
  },
  {
    id: 'building-3',
    label: 'SEC-03',
    name: 'Diagnostic Core',
    icon: Zap,
  },
  {
    id: 'building-4',
    label: 'SEC-04',
    name: 'Transfer Manifest',
    icon: Globe,
  },
  {
    id: 'building-5',
    label: 'SEC-05',
    name: 'Survivor Gate',
    icon: Bot,
  },
];

// ─── AI image placeholder slots ─────────────────────────────────────────────
// Drop your AI-generated image paths here once generated (e.g. /images/ai_banner_1.png)
// Until then, they render as styled placeholder tiles
const AI_IMAGE_SLOTS = [
  { id: 'ai-1', label: 'Survivor Cohort', src: null },
  { id: 'ai-2', label: 'Digital Graveyard', src: null },
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

  const [showThemeMenu, setShowThemeMenu] = useState(false);

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

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none font-mono">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP BAR — title + controls (unchanged layout, theme-reactive bg)
      ═══════════════════════════════════════════════════════════════════ */}
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

          {/* Completed Fragments Dropdown */}
          <FragmentsDropdown onOpen={() => setShowThemeMenu(false)} />

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
            onClick={() => { if (soundEnabled) sound.playClick(); toggleSound(); }}
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ARENA STRIP — doubled width, CTF portal cards + AI image slots
          (pinned below the top bar, stretched full-width)
      ═══════════════════════════════════════════════════════════════════ */}
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

        {/* ── CTF Portal Sector Cards (one per sector, opens terminal) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {CTF_PORTAL_LINKS.map((portal) => {
            const isCleared = clearedBuildingIds.includes(portal.id);
            const isUnlocked = isBuildingUnlocked(portal.id, clearedBuildingIds);
            const Icon = portal.icon;
            return (
              <button
                key={portal.id}
                type="button"
                onClick={() => { if (soundEnabled) sound.playClick(); setActiveBuilding(portal.id); }}
                className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all duration-200 select-none ${
                  isUnlocked ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'
                }`}
                style={{
                  background: isCleared
                    ? 'rgba(0,255,136,0.12)'
                    : isUnlocked
                    ? `${currentTheme.uiAccentHex}10`
                    : 'rgba(255,255,255,0.04)',
                  borderColor: isCleared
                    ? 'rgba(0,255,136,0.5)'
                    : isUnlocked
                    ? `${currentTheme.uiAccentHex}40`
                    : 'rgba(255,255,255,0.15)',
                  color: isCleared ? '#00ff88' : isUnlocked ? currentTheme.uiAccentHex : '#94a3b8',
                  boxShadow: isCleared
                    ? '0 0 10px rgba(0,255,136,0.25)'
                    : isUnlocked
                    ? `0 0 6px ${currentTheme.uiAccentHex}20`
                    : 'none',
                }}
                title={
                  isCleared
                    ? `Sector Cleared: ${portal.name}`
                    : isUnlocked
                    ? `Open forensic terminal: ${portal.name}`
                    : `Locked: Complete previous sector first`
                }
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span className="tracking-wide">{portal.label}</span>
                {isCleared
                  ? <Unlock className="w-2.5 h-2.5 text-cyber-green opacity-90" />
                  : isUnlocked
                  ? <Lock className="w-2.5 h-2.5 opacity-50" />
                  : <Lock className="w-2.5 h-2.5 text-amber-400 opacity-90" />
                }
                {/* Tooltip name on hover */}
                <span
                  className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ background: currentTheme.uiPanelBg, color: '#ddd', border: `1px solid ${currentTheme.uiAccentHex}30` }}
                >
                  {isUnlocked ? portal.name : `[LOCKED] ${portal.name}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-700 flex-shrink-0" />

        {/* ── AI Image Placeholder Slots ────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {AI_IMAGE_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="relative flex-shrink-0 w-20 h-10 rounded-lg border overflow-hidden flex items-center justify-center"
              style={{ borderColor: `${currentTheme.uiAccentHex}30`, background: `${currentTheme.uiAccentHex}08` }}
              title={slot.label}
            >
              {slot.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slot.src} alt={slot.label} className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <Bot className="w-3.5 h-3.5" style={{ color: `${currentTheme.uiAccentHex}70` }} />
                  <span className="text-[7px] text-gray-500 uppercase tracking-wide">{slot.label}</span>
                </div>
              )}
              {/* Glitch scanline overlay on placeholder */}
              {!slot.src && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `repeating-linear-gradient(0deg,transparent,transparent 2px,${currentTheme.uiAccentHex}06 2px,${currentTheme.uiAccentHex}06 4px)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right-edge filler */}
        <div className="flex-1" />

        {/* Small zone label */}
        <div
          className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border"
          style={{ color: currentTheme.uiAccentHex, borderColor: `${currentTheme.uiAccentHex}30`, background: `${currentTheme.uiAccentHex}0c` }}
        >
          ◉ ORANGE ZONE ACTIVE
        </div>
      </div>
    </header>
  );
};
