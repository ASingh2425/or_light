'use client';

import React from 'react';
import { Zap, Camera, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

const CAM_LABELS: Record<string, string> = {
  chase: 'CHASE',
  close: 'CLOSE',
  wide: 'WIDE',
  top: 'TOP',
};

export const CarCockpitHUD: React.FC = () => {
  const carSpeed = useGameStore((state) => state.carSpeed);
  const isNitroActive = useGameStore((state) => state.isNitroActive);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const cycleCameraMode = useGameStore((state) => state.cycleCameraMode);
  const setNitroActive = useGameStore((state) => state.setNitroActive);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const accent = theme.uiAccentHex;

  // Simulate keydown for on-screen touch D-Pad
  const dispatchKey = (key: string, isDown: boolean) => {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { key, bubbles: true });
    window.dispatchEvent(event);
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 font-mono select-none flex flex-col items-center">
      {/* Control Console */}
      <div
        className="px-4 py-2 rounded-2xl backdrop-blur-2xl border-2 flex items-center space-x-3 shadow-2xl transition-all"
        style={{
          background: theme.uiPanelBg,
          borderColor: `${accent}70`,
          boxShadow: `0 0 25px ${accent}40`,
        }}
      >
        {/* Real-time Digital Speedometer Gauge */}
        <div className="flex flex-col items-center px-2 border-r border-white/20">
          <div className="text-[9px] uppercase font-bold text-gray-300 tracking-wider">
            SPEED
          </div>
          <div className="text-xl font-black text-white font-mono flex items-baseline space-x-1">
            <span className={carSpeed > 50 ? 'text-cyan-300 animate-pulse' : 'text-white'}>
              {carSpeed}
            </span>
            <span className="text-[10px] text-gray-400 font-normal">KM/H</span>
          </div>
          {/* Speed Bar */}
          <div className="w-14 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-100"
              style={{ width: `${Math.min(100, (carSpeed / 120) * 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Nitro Boost Button */}
          <button
            onMouseDown={() => setNitroActive(true)}
            onMouseUp={() => setNitroActive(false)}
            onTouchStart={() => setNitroActive(true)}
            onTouchEnd={() => setNitroActive(false)}
            className={`px-3 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 transition-all shadow-lg ${
              isNitroActive
                ? 'bg-cyan-400 text-slate-900 shadow-[0_0_20px_#00f0ff] scale-105'
                : 'bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-400/40'
            }`}
            title="Hold Shift or Click to Turbo Boost"
          >
            <Zap className={`w-4 h-4 ${isNitroActive ? 'animate-bounce' : ''}`} />
            <span>NITRO</span>
          </button>

          {/* Camera Angle Cycler */}
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              cycleCameraMode();
            }}
            className="px-3 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 bg-white/10 hover:bg-white/25 text-cyan-200 border border-cyan-300/40 transition-all hover:scale-105"
            title="Press C or Click to cycle camera angle — drag the view to orbit, scroll to zoom"
          >
            <Camera className="w-4 h-4" />
            <span>CAM: {CAM_LABELS[cameraMode] || 'CHASE'}</span>
          </button>
        </div>

        {/* On-screen Drive D-Pad for Mobile / Mouse Steering */}
        <div className="flex items-center space-x-1 pl-2 border-l border-white/20">
          <button
            onMouseDown={() => dispatchKey('a', true)}
            onMouseUp={() => dispatchKey('a', false)}
            onTouchStart={() => dispatchKey('a', true)}
            onTouchEnd={() => dispatchKey('a', false)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 active:bg-cyan-500 active:text-slate-900 text-white flex items-center justify-center transition-all"
            title="Steer Left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col space-y-1">
            <button
              onMouseDown={() => dispatchKey('w', true)}
              onMouseUp={() => dispatchKey('w', false)}
              onTouchStart={() => dispatchKey('w', true)}
              onTouchEnd={() => dispatchKey('w', false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 active:bg-cyan-500 active:text-slate-900 text-white flex items-center justify-center transition-all"
              title="Drive Forward"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onMouseDown={() => dispatchKey('s', true)}
              onMouseUp={() => dispatchKey('s', false)}
              onTouchStart={() => dispatchKey('s', true)}
              onTouchEnd={() => dispatchKey('s', false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 active:bg-cyan-500 active:text-slate-900 text-white flex items-center justify-center transition-all"
              title="Reverse"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
          <button
            onMouseDown={() => dispatchKey('d', true)}
            onMouseUp={() => dispatchKey('d', false)}
            onTouchStart={() => dispatchKey('d', true)}
            onTouchEnd={() => dispatchKey('d', false)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 active:bg-cyan-500 active:text-slate-900 text-white flex items-center justify-center transition-all"
            title="Steer Right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
