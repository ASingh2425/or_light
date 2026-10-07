'use client';

import React from 'react';
import { 
  BarChart3, 
  X, 
  ShieldCheck, 
  Database, 
  Download, 
  CheckCircle2, 
  Lock, 
  BrainCircuit, 
  Activity, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

export const DashboardModal: React.FC = () => {
  const showDashboard = useGameStore((state) => state.showDashboard);
  const setShowDashboard = useGameStore((state) => state.setShowDashboard);
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const submittedFlags = useGameStore((state) => state.submittedFlags);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  if (!showDashboard) return null;

  const totalBuildings = FORENSIC_CHALLENGES.length;
  const clearedCount = clearedBuildingIds.length;
  const percentage = Math.round((clearedCount / totalBuildings) * 100);
  const totalRecoveredRows = clearedCount * 90;

  const handleJumpToBuilding = (id: string) => {
    if (soundEnabled) sound.playEnter();
    setShowDashboard(false);
    setActiveBuilding(id);
  };

  const handleDownloadFragment = (e: React.MouseEvent, url: string, fname: string) => {
    e.stopPropagation();
    if (soundEnabled) sound.playClick();
    const link = document.createElement('a');
    link.href = url;
    link.download = fname;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-cyber-darker/85 backdrop-blur-md font-mono select-none">
      <div className={`relative w-full max-w-5xl max-h-[92vh] bg-cyber-darker/98 border-2 ${theme.uiBorderClass}/70 rounded-2xl ${theme.uiGlowClass} flex flex-col overflow-hidden shadow-2xl`}>
        {/* CRT Scanline Overlay */}
        <div className="crt-overlay absolute inset-0 pointer-events-none" />

        {/* Dashboard Top Header */}
        <div className={`px-6 py-4 bg-cyber-dark/95 border-b ${theme.uiBorderClass}/40 flex items-center justify-between z-10`}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl ${theme.uiBgBadgeClass} border flex items-center justify-center`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-[10px] font-bold ${theme.uiTextAccentClass} uppercase tracking-widest flex items-center space-x-2`}>
                <Layers className="w-3.5 h-3.5" />
                <span>FORENSIC OPERATIONS & METRICS DASHBOARD</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] ${theme.uiBgBadgeClass}`}>
                  LIVE TELEMETRY
                </span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-white tracking-wide">
                ORANGE ZONE // SECTOR CLEARANCE MATRIX
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowDashboard(false);
            }}
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg border border-transparent hover:border-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="p-6 overflow-y-auto space-y-6 z-10 text-xs text-gray-200">
          {/* Top Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className={`p-3.5 bg-cyber-dark/80 border ${theme.uiBorderClass}/30 rounded-xl space-y-1`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
                <span>SECTOR CLEARANCE</span>
                <Activity className="w-3.5 h-3.5 text-cyber-green" />
              </div>
              <div className="text-xl font-bold text-white flex items-baseline space-x-1">
                <span className={percentage === 100 ? 'text-cyber-green' : theme.uiTextAccentClass}>
                  {percentage}%
                </span>
                <span className="text-xs text-gray-400 font-normal">({clearedCount}/{totalBuildings})</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyber-green h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className={`p-3.5 bg-cyber-dark/80 border ${theme.uiBorderClass}/30 rounded-xl space-y-1`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
                <span>RECOVERED ROWS</span>
                <Database className={`w-3.5 h-3.5 ${theme.uiTextAccentClass}`} />
              </div>
              <div className="text-xl font-bold text-white">
                {totalRecoveredRows} <span className="text-xs text-gray-400 font-normal">/ 450</span>
              </div>
              <div className="text-[10px] text-gray-400">
                {5 - clearedCount} fragments encrypted
              </div>
            </div>

            <div className={`p-3.5 bg-cyber-dark/80 border ${theme.uiBorderClass}/30 rounded-xl space-y-1`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
                <span>DATA INTEGRITY</span>
                <ShieldCheck className="w-3.5 h-3.5 text-cyber-cyan" />
              </div>
              <div className="text-xl font-bold text-cyber-cyan">
                {Math.round((clearedCount / 5) * 99.4)}%
              </div>
              <div className="text-[10px] text-gray-400">
                SHA-256 Signatures Valid
              </div>
            </div>

            <div className={`p-3.5 bg-cyber-dark/80 border ${theme.uiBorderClass}/30 rounded-xl space-y-1`}>
              <div className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-between">
                <span>ML READINESS</span>
                <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400">
                {clearedCount === 5 ? '100% READY' : `${percentage}%`}
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {clearedCount === 5 ? 'Dataset Consolidated' : 'Awaiting Full Assembly'}
              </div>
            </div>
          </div>

          {/* Section 1: Sector Clearance Matrix (The 5 Archive Buildings) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold ${theme.uiTextAccentClass} uppercase tracking-wider flex items-center space-x-1.5`}>
                <Database className="w-3.5 h-3.5" />
                <span>FORENSIC ARCHIVE SECTOR MATRIX (5 FACILITIES)</span>
              </h3>
              <span className="text-[10px] text-gray-400">
                Click any sector to inspect or teleport
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {FORENSIC_CHALLENGES.map((bldg) => {
                const isCleared = clearedBuildingIds.includes(bldg.id);
                const flag = submittedFlags[bldg.id];

                return (
                  <div
                    key={bldg.id}
                    onClick={() => handleJumpToBuilding(bldg.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isCleared
                        ? 'bg-cyber-darker/95 border-cyber-green/50 shadow-green-glow hover:border-cyber-green'
                        : `bg-cyber-dark/60 border-gray-800 hover:${theme.uiBorderClass}/60`
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${isCleared ? 'text-cyber-green' : theme.uiTextAccentClass}`}>
                          SEC-0{bldg.buildingNumber}
                        </span>
                        {isCleared ? (
                          <span className="p-1 bg-cyber-green/20 text-cyber-green rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 bg-gray-800 text-gray-500 rounded-full">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-white text-xs line-clamp-2 leading-snug">
                        {bldg.name}
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono">
                        {bldg.datasetFragment.recordRange} ({bldg.datasetFragment.rowCount} rows)
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 space-y-2">
                      {isCleared ? (
                        <>
                          <div className="text-[9px] text-cyber-green font-bold truncate">
                            KEY: {flag || 'VERIFIED'}
                          </div>
                          <button
                            onClick={(e) =>
                              handleDownloadFragment(
                                e,
                                bldg.datasetFragment.downloadUrl,
                                bldg.datasetFragment.filename
                              )
                            }
                            className="w-full py-1 bg-cyber-green/20 hover:bg-cyber-green/30 border border-cyber-green/60 text-cyber-green hover:text-white rounded text-[10px] font-bold flex items-center justify-center space-x-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>DOWNLOAD CSV</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] text-gray-500 flex items-center space-x-1">
                          <span>Awaiting Flag</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Machine Learning Dataset Summary & Feature Dictionary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ML Target & Pipeline Overview */}
            <div className={`p-4 bg-cyber-dark/70 border ${theme.uiBorderClass}/30 rounded-xl space-y-3`}>
              <div className={`text-xs font-bold ${theme.uiTextAccentClass} flex items-center space-x-1.5`}>
                <BrainCircuit className="w-4 h-4" />
                <span>DOWNSTREAM ML MODEL SPECIFICATIONS</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                The objective of the machine learning phase is to train a regression model (e.g. Random Forest Regressor) on the reconstructed 450 historical records to predict continuous survival probabilities (0.0 to 1.0) for active Sanctuary residents.
              </p>
              
              <div className="space-y-1.5 font-mono text-[11px] bg-cyber-darker/60 p-3 rounded-lg border border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-400">Target Variable:</span>
                  <span className="text-cyber-green font-bold">Survival_Probability (Float 0.0 - 1.0)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Records:</span>
                  <span className="text-white font-bold">450 Cohort Entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Feature Count:</span>
                  <span className="text-amber-400 font-bold">36 Attributes (Health, Skills, Comms)</span>
                </div>
              </div>
            </div>

            {/* Quick Feature Categories */}
            <div className={`p-4 bg-cyber-dark/70 border ${theme.uiBorderClass}/30 rounded-xl space-y-3`}>
              <div className={`text-xs font-bold ${theme.uiTextAccentClass} flex items-center space-x-1.5`}>
                <Sparkles className="w-4 h-4" />
                <span>FEATURE DOMAINS IN RECOVERED DATASET</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
                  <span><strong>Biometric & Health:</strong> Age, Immunity_Score, Nutrition_Score, Injury_Count.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span><strong>Skills & Aptitude:</strong> First_Aid_Skill, Technical_Skill, Navigation_Skill.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Social & Teamwork:</strong> Leadership_Score, Communication_Skill, Teamwork.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                  <span><strong>History & Exposure:</strong> Outside_Experience_Years, Days_In_Quarantine.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dashboard Footer */}
        <div className={`px-6 py-3 bg-cyber-dark/95 border-t ${theme.uiBorderClass}/30 flex items-center justify-between text-xs text-gray-400 z-10`}>
          <div>ORANGE_ZONE://FORENSIC_TELEMETRY_ENGINE_V2</div>
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setShowDashboard(false);
            }}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
          >
            CLOSE DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};
