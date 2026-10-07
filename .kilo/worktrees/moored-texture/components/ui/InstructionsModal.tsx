'use client';

import React from 'react';
import { 
  HelpCircle, 
  X, 
  Navigation, 
  Terminal, 
  Key, 
  Database,
  ArrowRight
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { sound } from '@/components/audio/SoundEffects';

export const InstructionsModal: React.FC = () => {
  const showInstructions = useGameStore((state) => state.showInstructions);
  const setShowInstructions = useGameStore((state) => state.setShowInstructions);
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  if (!showInstructions) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-darker/80 backdrop-blur-md font-mono">
      <div className="relative w-full max-w-xl bg-cyber-darker border border-cyber-orange/60 rounded-xl shadow-orange-glow overflow-hidden">
        {/* CRT Scanline Overlay */}
        <div className="crt-overlay absolute inset-0 pointer-events-none" />

        {/* Header */}
        <div className="px-6 py-4 bg-cyber-dark/95 border-b border-cyber-orange/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-cyber-orange/20 border border-cyber-orange flex items-center justify-center text-cyber-orange">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-cyber-orange uppercase tracking-widest">
                OPERATIONAL MANUAL
              </div>
              <h2 className="text-base font-bold text-white">
                ORANGE ZONE // INVESTIGATOR BRIEF
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowInstructions(false);
            }}
            className="p-1.5 hover:bg-cyber-dark text-gray-400 hover:text-white rounded border border-transparent hover:border-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-gray-300">
          <div className="p-3.5 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg space-y-1">
            <div className="font-bold text-cyber-orange text-xs flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>1. EXPLORATION & CONTROLS</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Use <span className="text-cyber-orange font-bold">W, A, S, D</span> or <span className="text-cyber-orange font-bold">Arrow Keys</span> on your keyboard to navigate your investigator drone through the city grid. You can also click on buildings directly or via the bottom-left radar.
            </p>
          </div>

          <div className="p-3.5 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg space-y-1">
            <div className="font-bold text-cyber-amber text-xs flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>2. FORENSIC TERMINALS</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Approaching any of the 5 archive buildings slides open its dedicated forensic terminal on the right half of your screen. Each facility holds its own evidence, downloadable files and a field toolkit. Sectors are standalone: solve them in any order. Sectors 01 and 02 open in a later drop.
            </p>
          </div>

          <div className="p-3.5 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg space-y-1">
            <div className="font-bold text-cyber-green text-xs flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>3. VERIFY FLAGS & RECOVER DATASETS</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Submit the correct flag (format LASTDATA&#123;...&#125;) in the terminal to clear the building (marked with a green ✔ tick) and unlock that sector&apos;s 90-record dataset fragment. Hints come in three tiers and each one costs points, so use them last. Some strings in the evidence are decoys.
            </p>
          </div>

          <div className="p-3.5 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg space-y-1">
            <div className="font-bold text-cyber-cyan text-xs flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>4. MASTER ARCHIVE ASSEMBLY</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Once all 5 buildings reach 100% clearance, the complete 450-record dataset is assembled for downstream machine learning survival modeling.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (soundEnabled) sound.playClick();
                setShowInstructions(false);
              }}
              className="w-full py-2.5 bg-cyber-orange hover:bg-cyber-orange-glow text-slate-900 font-bold rounded-lg flex items-center justify-center space-x-1.5 shadow-orange-glow transition-all"
            >
              <span>ENTER THE ORANGE ZONE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
