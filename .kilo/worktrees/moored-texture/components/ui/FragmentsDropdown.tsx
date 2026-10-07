'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Lock, Terminal as TerminalIcon, Minimize2, Maximize2, FileText, Database, Key, Eye } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

interface FragmentsDropdownProps {
  /** Called just before the panel opens — lets the header close sibling menus. */
  onOpen?: () => void;
}

export const FragmentsDropdown: React.FC<FragmentsDropdownProps> = ({ onOpen }) => {
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);
  const isTerminalOpen = useGameStore((state) => state.isTerminalOpen);
  const isTerminalMinimized = useGameStore((state) => state.isTerminalMinimized);
  const setTerminalOpen = useGameStore((state) => state.setTerminalOpen);
  const setTerminalMinimized = useGameStore((state) => state.setTerminalMinimized);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const activeTerminalTab = useGameStore((state) => state.activeTerminalTab);
  const setActiveTerminalTab = useGameStore((state) => state.setActiveTerminalTab);

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];
  const accent = theme.uiAccentHex;

  const totalSectors = FORENSIC_CHALLENGES.length;
  const clearedCount = clearedBuildingIds.length;
  const isComplete = clearedCount === totalSectors;

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  const handleToggle = () => {
    if (isOpen) {
      close();
      return;
    }
    if (soundEnabled) sound.playClick();
    if (onOpen) onOpen();
    setIsOpen(true);
  };

  const handleSelect = (id: string, isCleared: boolean) => {
    if (soundEnabled) sound.playClick();
    setActiveBuilding(id);
    setTerminalOpen(true);
    setTerminalMinimized(false);
    setActiveTerminalTab(isCleared ? 'fragment' : 'briefing');
    close();
  };

  const handleToggleTerminal = () => {
    if (soundEnabled) sound.playClick();
    if (!activeBuildingId) {
      setActiveBuilding(FORENSIC_CHALLENGES.find((c) => c.status === 'live')?.id ?? FORENSIC_CHALLENGES[0].id);
    }
    setTerminalOpen(!isTerminalOpen);
    setTerminalMinimized(false);
  };

  const handleToggleMinimize = () => {
    if (soundEnabled) sound.playClick();
    setTerminalMinimized(!isTerminalMinimized);
  };

  return (
    <div ref={wrapperRef} className="relative font-mono">
      {/* Trigger — progress summary + rotating chevron */}
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="px-3 py-2 rounded-lg flex items-center space-x-2 text-xs border transition-all text-white hover:brightness-125"
        style={{ background: `${accent}15`, borderColor: `${accent}40` }}
        title="Dataset fragments & Forensic side tab controls"
      >
        <Database className="w-3.5 h-3.5" style={{ color: accent }} />
        <span
          className="text-[10px] font-bold uppercase tracking-wider hidden md:inline"
          style={{ color: isComplete ? '#00ff88' : accent }}
        >
          FRAGMENTS ({clearedCount}/{totalSectors})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: accent }}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Recovered dataset fragments and side tab controls"
          className="absolute top-full right-0 mt-2 w-84 max-w-[90vw] bg-cyber-darker/98 border border-gray-700 rounded-xl shadow-2xl p-2.5 z-50 backdrop-blur-2xl space-y-2.5"
        >
          {/* Side Tab Control Bar */}
          <div className="p-2 bg-cyber-dark/80 rounded-lg border border-gray-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center justify-between">
              <span>SIDE TAB CONTROL</span>
              <TerminalIcon className="w-3.5 h-3.5" style={{ color: accent }} />
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleToggleTerminal}
                className="px-2.5 py-1.5 rounded text-[10px] font-bold border flex items-center justify-center space-x-1.5 transition-all"
                style={{
                  background: isTerminalOpen ? 'rgba(0,255,136,0.15)' : `${accent}15`,
                  borderColor: isTerminalOpen ? '#00ff88' : `${accent}40`,
                  color: isTerminalOpen ? '#00ff88' : '#ffffff',
                }}
              >
                <Eye className="w-3 h-3" />
                <span>{isTerminalOpen ? 'CLOSE TERMINAL' : 'SHOW TERMINAL'}</span>
              </button>

              <button
                onClick={handleToggleMinimize}
                disabled={!isTerminalOpen}
                className="px-2.5 py-1.5 rounded text-[10px] font-bold border flex items-center justify-center space-x-1.5 transition-all disabled:opacity-40"
                style={{
                  background: isTerminalMinimized ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
                  borderColor: isTerminalMinimized ? '#eab308' : 'rgba(255,255,255,0.2)',
                  color: isTerminalMinimized ? '#eab308' : '#ffffff',
                }}
              >
                {isTerminalMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                <span>{isTerminalMinimized ? 'EXPAND TAB' : 'MINIMIZE TAB'}</span>
              </button>
            </div>

            {/* Quick Tab Switcher */}
            {isTerminalOpen && (
              <div className="pt-1 border-t border-gray-800 flex items-center justify-between text-[9px] gap-1">
                <span className="text-gray-400 font-bold">TAB:</span>
                {(['briefing', 'evidence', 'flag', 'fragment'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (soundEnabled) sound.playClick();
                      setActiveTerminalTab(tab);
                    }}
                    className={`px-1.5 py-0.5 rounded font-bold uppercase transition-all ${
                      activeTerminalTab === tab
                        ? 'bg-cyan-500 text-slate-900'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panel header + recovery summary */}
          <div className="px-1 border-b border-gray-800 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>
              COMPLETED FRAGMENTS ({clearedCount}/{totalSectors})
            </div>
          </div>

          {/* Sector Fragment Rows */}
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
            {FORENSIC_CHALLENGES.map((challenge) => {
              const isCleared = clearedBuildingIds.includes(challenge.id);
              return (
                <button
                  key={challenge.id}
                  role="menuitem"
                  onClick={() => handleSelect(challenge.id, isCleared)}
                  className="w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-start gap-2.5 hover:brightness-125"
                  style={{
                    background: isCleared ? 'rgba(0,255,136,0.10)' : `${accent}08`,
                    borderColor: isCleared ? 'rgba(0,255,136,0.45)' : `${accent}25`,
                  }}
                  title={
                    isCleared
                      ? `Open ${challenge.name} fragment viewer`
                      : `Open ${challenge.name} briefing`
                  }
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isCleared ? (
                      <Check className="w-3.5 h-3.5 text-cyber-green" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: isCleared ? '#00ff88' : accent }}
                      >
                        SEC-0{challenge.buildingNumber}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                        {isCleared ? 'DECRYPTED' : 'LOCKED'}
                      </span>
                    </div>

                    <div className={`text-[11px] font-bold leading-tight truncate ${isCleared ? 'text-white' : 'text-gray-400'}`}>
                      {challenge.name}
                    </div>

                    {isCleared ? (
                      <div className="text-[9px] text-cyber-green font-bold tracking-wide mt-0.5">
                        FRAGMENT #{challenge.datasetFragment.fragmentId} · {challenge.datasetFragment.rowCount} RECORDS
                      </div>
                    ) : (
                      <div className="text-[9px] text-gray-500 leading-tight tracking-wide uppercase mt-0.5">
                        Click to view investigation briefing
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-1 py-1 text-[9px] uppercase tracking-wider text-gray-500 border-t border-gray-800">
            Click any sector to switch active terminal context
          </div>
        </div>
      )}
    </div>
  );
};
