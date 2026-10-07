'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { HudPanelKey } from '@/lib/types';
import { sound } from '@/components/audio/SoundEffects';

const HUD_MENU_ITEMS: Array<[HudPanelKey, string]> = [
  ['topBar', 'TITLE BAR'],
  ['strip', 'PROGRESS STRIP'],
  ['cockpit', 'CAR CONSOLE'],
  ['radar', 'TACTICAL RADAR'],
];

/**
 * HUD show/hide dropdown. Rendered at PAGE LEVEL (viewport-fixed, z-70)
 * rather than inside the strip/top bar: the strip's overflow-x-auto and
 * backdrop-filter would clip a child dropdown, making the menu invisible
 * when the title bar was hidden.
 */
export const HudMenuPanel: React.FC = () => {
  const open = useGameStore((s) => s.hudMenuOpen);
  const setOpen = useGameStore((s) => s.setHudMenuOpen);
  const hudPanels = useGameStore((s) => s.hudPanels);
  const toggleHudPanel = useGameStore((s) => s.toggleHudPanel);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const themePreset = useGameStore((s) => s.themePreset);
  const currentTheme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  if (!open) return null;

  return (
    <>
      {/* Click-away scrim */}
      <div className="fixed inset-0 z-[65]" onClick={() => setOpen(false)} />

      <div
        className="fixed right-3 top-16 z-[70] w-52 rounded-xl shadow-2xl p-2 backdrop-blur-2xl space-y-1 border"
        style={{
          background: 'rgba(8, 11, 17, 0.98)',
          borderColor: `${currentTheme.uiAccentHex}40`,
        }}
      >
        <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase border-b border-gray-800 flex items-center justify-between">
          HUD DISPLAY
          <button
            onClick={() => setOpen(false)}
            className="p-0.5 text-gray-500 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        {HUD_MENU_ITEMS.map(([key, label]) => {
          const visible = hudPanels[key];
          return (
            <button
              key={key}
              onClick={() => {
                if (soundEnabled) sound.playClick();
                toggleHudPanel(key);
                setOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-xs transition-all hover:bg-gray-800 ${
                visible ? 'text-white font-bold' : 'text-gray-500'
              }`}
            >
              {visible ? (
                <Check className="w-3.5 h-3.5 text-cyber-green flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />
              )}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
