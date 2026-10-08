'use client';

import React from 'react';
import { 
  Trophy, 
  Download, 
  X, 
  CheckCircle2, 
  BrainCircuit, 
  FileSpreadsheet, 
  Sparkles,
  DoorOpen 
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { sound } from '@/components/audio/SoundEffects';

export const MasterDatasetModal: React.FC = () => {
  const showMasterModal = useGameStore((state) => state.showMasterModal);
  const setShowMasterModal = useGameStore((state) => state.setShowMasterModal);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const finaleState = useGameStore((state) => state.finaleState);
  const startFinale = useGameStore((state) => state.startFinale);

  if (!showMasterModal) return null;

  const handleDownloadMaster = () => {
    if (soundEnabled) sound.playClick();
    const link = document.createElement('a');
    link.href = '/data/forensics_final.csv';
    link.download = 'forensics_final_120_COMPLETE.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-darker/80 backdrop-blur-md font-mono">
      <div className="relative w-full max-w-2xl bg-cyber-darker border-2 border-cyber-green rounded-xl shadow-green-glow overflow-hidden">
        {/* CRT Scanline Overlay */}
        <div className="crt-overlay absolute inset-0 pointer-events-none" />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-cyber-dark/95 border-b border-cyber-green/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-cyber-green">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-cyber-green uppercase tracking-widest flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ORANGE ZONE COMPLETED // FORENSICS RESTORED</span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                MASTER HISTORICAL DATASET RECONSTRUCTED
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowMasterModal(false);
            }}
            className="p-1.5 hover:bg-cyber-dark text-gray-400 hover:text-white rounded border border-transparent hover:border-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-sm text-gray-200">
          <div className="p-4 bg-cyber-green/10 border border-cyber-green/40 rounded-lg flex items-start space-x-3.5">
            <CheckCircle2 className="w-6 h-6 text-cyber-green flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-cyber-green text-xs uppercase tracking-wider">
                All 4 Forensic Archive Nodes Verified & Unlocked
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                You have successfully decrypted the breach logs, restored biometric wrist-tag mappings, validated protective falsification flags, and retrieved the civic transfer manifest. All 120 records are now consolidated into the unified master dataset.
              </p>
            </div>
          </div>

          {/* Dataset Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase">Total Records</div>
              <div className="text-lg font-bold text-cyber-orange">120 Rows</div>
            </div>
            <div className="p-3 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase">Features</div>
              <div className="text-lg font-bold text-cyber-amber">36 Columns</div>
            </div>
            <div className="p-3 bg-cyber-dark/80 border border-cyber-border/40 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase">Target Metric</div>
              <div className="text-xs font-bold text-cyber-green mt-1">Survival_Prob (0-1)</div>
            </div>
          </div>

          {/* Next Phase ML Briefing */}
          <div className="p-4 bg-cyber-dark/60 border border-cyber-border/40 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-cyber-orange">
              <BrainCircuit className="w-4 h-4" />
              <span>HANDOFF TO MACHINE LEARNING MODELING PHASE:</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Use this complete 120-record dataset to train your regression model (e.g. Random Forest / XGBoost) predicting continuous survival probabilities for current Sanctuary candidates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadMaster}
              className="flex-1 py-3 px-4 bg-cyber-green hover:bg-green-400 text-slate-900 font-bold rounded-lg flex items-center justify-center space-x-2 shadow-green-glow transition-all text-xs"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD MASTER DATASET (.CSV)</span>
            </button>

            {finaleState === 'idle' && (
              <button
                onClick={() => {
                  if (soundEnabled) sound.playMasterVictory();
                  setShowMasterModal(false);
                  startFinale();
                }}
                className="flex-1 py-3 px-4 bg-cyber-orange hover:bg-amber-400 text-slate-900 font-black rounded-lg flex items-center justify-center space-x-2 transition-all text-xs uppercase tracking-wider animate-pulse"
                style={{ boxShadow: '0 0 22px rgba(255,170,0,0.55)' }}
              >
                <DoorOpen className="w-4 h-4" />
                <span>Enter Final Exit</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowMasterModal(false);
            }}
            className="w-full py-3 px-4 bg-cyber-dark hover:bg-cyber-darker border border-gray-700 text-gray-400 hover:text-white font-bold rounded-lg text-xs"
          >
            RETURN TO EXPLORATION
          </button>
        </div>
      </div>
    </div>
  );
};
