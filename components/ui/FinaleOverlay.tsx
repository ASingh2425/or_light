'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Lock,
  Rocket,
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { ACTIVE_CHALLENGES } from '@/lib/challenges';
import { FINAL_REDIRECT_URL, FINALE_REDIRECT_DELAY_MS } from '@/lib/constants';
import { sound } from '@/components/audio/SoundEffects';

// The fragment produced by the 4th CTF — the exit link stays locked until it
// has been downloaded.
const FINAL_FRAGMENT_ID = 4;

export const FinaleOverlay: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);
  const downloadedFragmentIds = useGameStore((state) => state.downloadedFragmentIds);
  const markFragmentDownloaded = useGameStore((state) => state.markFragmentDownloaded);
  const returnToArena = useGameStore((state) => state.returnToArena);
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  const [navigating, setNavigating] = useState(false);

  // The overlay stays mounted between finales — clear a pending hand-off so a
  // replayed exit sequence starts from a clean slate.
  useEffect(() => {
    if (finaleState !== 'redirecting') setNavigating(false);
  }, [finaleState]);

  if (finaleState !== 'redirecting') return null;

  const finalFragment =
    ACTIVE_CHALLENGES.find((c) => c.datasetFragment.fragmentId === FINAL_FRAGMENT_ID) ??
    ACTIVE_CHALLENGES[ACTIVE_CHALLENGES.length - 1];
  const fragment = finalFragment.datasetFragment;
  const gateOpen = downloadedFragmentIds.includes(FINAL_FRAGMENT_ID);

  const handleDownload = () => {
    if (soundEnabled) sound.playClick();
    const link = document.createElement('a');
    link.href = fragment.downloadUrl;
    link.download = `MANU_Historical_${fragment.filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    markFragmentDownloaded(FINAL_FRAGMENT_ID);
  };

  const handleEnter = () => {
    if (!gateOpen || navigating) return;
    if (soundEnabled) sound.playMasterVictory();
    setNavigating(true);
    setTimeout(() => {
      window.location.href = FINAL_REDIRECT_URL;
    }, FINALE_REDIRECT_DELAY_MS);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-cyber-darker/75 backdrop-blur-sm font-mono">
      {/* Convergence burst, then the portal panel settles in */}
      <div className="absolute inset-0 pointer-events-none finale-flash" />

      <div className="relative w-full max-w-xl border-2 border-cyber-green/50 bg-cyber-darker/95 rounded-2xl shadow-[0_0_60px_rgba(0,255,136,0.35)] overflow-hidden finale-panel-in">
        <div className="crt-overlay absolute inset-0 pointer-events-none" />

        <div className="relative px-6 pt-6 pb-5 border-b border-cyber-green/25">
          <div className="flex items-center gap-2 text-[10px] font-bold text-cyber-green uppercase tracking-[0.3em]">
            <Rocket className="w-4 h-4" />
            First Passage Authorized
          </div>
          <h2 className="mt-3 text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            Archive Convergence Complete
          </h2>
          <p className="mt-2 text-xs text-gray-400 leading-relaxed">
            All four live sectors poured their beams into the core. Recover the final
            fragment below, then step through the portal to the next site.
          </p>
        </div>

        <div className="relative px-6 py-5 space-y-4">
          {/* Step 1 — recover the file */}
          <div
            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
              gateOpen
                ? 'border-cyber-green/50 bg-cyber-green/10'
                : 'border-gray-700 bg-cyber-dark/70'
            }`}
          >
            <div className="w-10 h-10 rounded-lg border border-cyber-green/60 bg-cyber-green/20 text-cyber-green flex items-center justify-center flex-shrink-0">
              {gateOpen ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Step 1 — Recover the file
              </div>
              <div className="text-xs font-bold text-white truncate">
                {fragment.filename} · {fragment.recordRange}
              </div>
            </div>
            <button
              onClick={handleDownload}
              className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                gateOpen
                  ? 'border-cyber-green/50 text-cyber-green hover:bg-cyber-green/10'
                  : 'border-cyber-green text-slate-900 bg-cyber-green hover:bg-cyber-green/80'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {gateOpen ? 'Downloaded' : 'Download .CSV'}
            </button>
          </div>

          {/* Step 2 — gated exit link */}
          <div
            className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
              gateOpen
                ? 'border-amber-400/60 bg-amber-400/10'
                : 'border-gray-800 bg-cyber-dark/50'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                gateOpen
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-400'
                  : 'border-gray-700 bg-gray-800 text-gray-500'
              }`}
            >
              {gateOpen ? <ExternalLink className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Step 2 — Proceed
              </div>
              <div className="text-xs font-bold text-white">
                {gateOpen ? 'Portal is open' : 'Portal locked — download the fragment first'}
              </div>
            </div>
            <button
              onClick={handleEnter}
              disabled={!gateOpen || navigating}
              className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                gateOpen
                  ? 'border-amber-400 text-slate-900 bg-amber-400 hover:bg-amber-300'
                  : 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed'
              }`}
            >
              {navigating ? 'Redirecting…' : 'Enter Next Site'}
            </button>
          </div>
        </div>

        <div className="relative px-6 py-4 border-t border-gray-800 bg-cyber-dark/90 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            ORANGE_ZONE://PORTAL_HANDSHAKE
          </span>
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              returnToArena();
            }}
            className="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Arena
          </button>
        </div>
      </div>
    </div>
  );
};
