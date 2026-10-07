'use client';

import React, { useEffect, useState } from 'react';
import { Type, X, Check, Monitor } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { FONT_OPTIONS, applyFont, injectFontStyles, initFontPreview } from '@/lib/fontPreview';

/**
 * TEMPORARY font preview tool (evaluation only — remove before ship).
 * Right-edge tab opens a list of candidate fonts; clicking one applies it
 * live across the UI via the --app-font CSS variable and remembers it in
 * localStorage. Picking "System Mono" restores the default.
 */
export const FontPreviewMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('system');
  const themePreset = useGameStore((s) => s.themePreset);
  const currentTheme = THEMES[themePreset] || THEMES['cyberpunk-neon'];
  const accent = currentTheme.uiAccentHex;

  useEffect(() => {
    injectFontStyles(); // pre-load candidates so switching is instant
    setSelected(initFontPreview());
  }, []);

  return (
    <>
      {/* Side tab — right edge, vertically centered */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[75] px-1.5 py-3 rounded-l-lg border border-r-0 text-[10px] font-bold uppercase tracking-widest transition-all hover:px-2.5"
        style={{
          writingMode: 'vertical-rl',
          background: 'rgba(8, 11, 17, 0.92)',
          borderColor: `${accent}50`,
          color: open ? '#ffffff' : accent,
          boxShadow: `-2px 0 14px ${accent}22`,
        }}
        title="Font preview options (temporary)"
      >
        <span className="flex items-center gap-2">
          <Type className="w-3.5 h-3.5 rotate-90" />
          FONTS
        </span>
      </button>

      {open && (
        <>
          {/* Scrim */}
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />

          <div
            className="fixed right-8 top-1/2 -translate-y-1/2 z-[75] w-72 rounded-xl shadow-2xl border overflow-hidden"
            style={{ background: 'rgba(8, 11, 17, 0.98)', borderColor: `${accent}40` }}
          >
            <div
              className="px-3 py-2 flex items-center justify-between border-b"
              style={{ borderColor: `${accent}30` }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                Font Preview{' '}
                <span className="text-amber-400/80 normal-case tracking-normal">· temporary</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-500 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {FONT_OPTIONS.map((opt) => {
                const active = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(applyFont(opt.id))}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-all border ${
                      active
                        ? 'bg-white/10 border-gray-500'
                        : 'border-transparent hover:bg-gray-800/70'
                    }`}
                    style={active ? { borderColor: `${accent}60` } : undefined}
                  >
                    {opt.id === 'system' ? (
                      <Monitor
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: active ? accent : '#6b7280' }}
                      />
                    ) : active ? (
                      <Check className="w-3.5 h-3.5 text-cyber-green flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`text-xs ${active ? 'text-white font-bold' : 'text-gray-300'}`}
                          style={{ fontFamily: opt.css }}
                        >
                          {opt.name}
                        </span>
                        <span
                          className="text-[8px] px-1 py-px rounded uppercase tracking-wider"
                          style={{
                            color: accent,
                            background: `${accent}18`,
                          }}
                        >
                          {opt.kind}
                        </span>
                      </span>
                      <span className="block text-[10px] text-gray-500 truncate">{opt.note}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 border-t border-gray-800 text-[9px] text-gray-500">
              Live preview — pick <span className="text-gray-300">System Mono</span> to revert.
              Not part of the shipped UI.
            </div>
          </div>
        </>
      )}
    </>
  );
};
