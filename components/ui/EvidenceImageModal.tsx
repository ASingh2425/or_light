'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ExternalLink, ShieldAlert, Sparkles, Filter } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

export const EvidenceImageModal: React.FC = () => {
  const selectedEvidenceImage = useGameStore((state) => state.selectedEvidenceImage);
  const setSelectedEvidenceImage = useGameStore((state) => state.setSelectedEvidenceImage);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const [scale, setScale] = useState(1);
  const [filterMode, setFilterMode] = useState<'normal' | 'uv' | 'contrast'>('normal');

  if (!selectedEvidenceImage) return null;

  const handleClose = () => {
    if (soundEnabled) sound.playClick();
    setSelectedEvidenceImage(null);
    setScale(1);
    setFilterMode('normal');
  };

  const getFilterStyle = () => {
    if (filterMode === 'uv') {
      return 'hue-rotate-180 invert brightness-110 contrast-125';
    }
    if (filterMode === 'contrast') {
      return 'contrast-150 brightness-110 saturate-150';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/75 select-none font-mono">
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-3xl border-2 flex flex-col overflow-hidden shadow-2xl transition-all"
        style={{
          background: theme.uiPanelBg,
          borderColor: theme.uiAccentHex,
          boxShadow: `0 0 50px ${theme.uiAccentHex}50`,
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-900 shadow">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-wide uppercase flex items-center space-x-2">
                <span>{selectedEvidenceImage.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  CLASSIFIED
                </span>
              </div>
              {selectedEvidenceImage.subtitle && (
                <div className="text-xs text-gray-300 mt-0.5">
                  {selectedEvidenceImage.subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Raw / New Tab */}
            <a
              href={selectedEvidenceImage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Open Raw Image in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-2 border-b border-white/10 bg-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-[11px]">INSPECTION TOOLS:</span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.25))}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center space-x-1"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>ZOOM IN</span>
            </button>
            <button
              onClick={() => setScale((s) => Math.max(0.75, s - 0.25))}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center space-x-1"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>ZOOM OUT</span>
            </button>
            <button
              onClick={() => { setScale(1); setFilterMode('normal'); }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterMode((m) => (m === 'uv' ? 'normal' : 'uv'))}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                filterMode === 'uv'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_#9333ea]'
                  : 'bg-white/10 hover:bg-white/20 text-purple-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>UV INVERT</span>
            </button>
            <button
              onClick={() => setFilterMode((m) => (m === 'contrast' ? 'normal' : 'contrast'))}
              className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                filterMode === 'contrast'
                  ? 'bg-cyan-500 text-slate-900 font-bold shadow-[0_0_12px_#06b6d4]'
                  : 'bg-white/10 hover:bg-white/20 text-cyan-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ENHANCE</span>
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-900/60 min-h-[380px]">
          <div
            className="transition-transform duration-200 flex items-center justify-center"
            style={{ transform: `scale(${scale})` }}
          >
            <img
              src={selectedEvidenceImage.url}
              alt={selectedEvidenceImage.title}
              className={`max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl border-2 border-white/20 transition-all ${getFilterStyle()}`}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-white/20 bg-white/5 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FORENSIC VERIFICATION: AUTHENTIC ARCHIVE ARTIFACT</span>
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-extrabold shadow transition-all"
          >
            RETURN TO GRID
          </button>
        </div>
      </div>
    </div>
  );
};
