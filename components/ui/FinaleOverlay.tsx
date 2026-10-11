'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Globe2,
  Lock,
  LogOut,
  Rocket,
} from 'lucide-react';
type ConfettiFn = (opts?: any) => void;
let confettiFn: ConfettiFn | null = null;
async function loadConfetti() {
  if (!confettiFn) {
    const mod = await import('canvas-confetti');
    confettiFn = mod.default as ConfettiFn;
  }
  return confettiFn;
}
function fireConfetti(opts?: any) {
  loadConfetti().then((fn) => fn(opts));
}
import { useGameStore } from '@/lib/store';
import { ACTIVE_CHALLENGES } from '@/lib/challenges';
import { FINAL_REDIRECT_URL, FINALE_REDIRECT_DELAY_MS } from '@/lib/constants';
import { sound } from '@/components/audio/SoundEffects';
import { syncOrangeZoneToSupabase } from '@/lib/supabaseSync';

// The fragment produced by the 4th CTF — the redirect stays locked until it
// has been downloaded.
const FINAL_FRAGMENT_ID = 4;

const REDIRECT_HOST = FINAL_REDIRECT_URL.replace(/^https?:\/\//, '').split('/')[0];

export const FinaleOverlay: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);
  const downloadedFragmentIds = useGameStore((state) => state.downloadedFragmentIds);
  const markFragmentDownloaded = useGameStore((state) => state.markFragmentDownloaded);
  const returnToArena = useGameStore((state) => state.returnToArena);
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  const [phase, setPhase] = useState<'idle' | 'warp'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);

  // The overlay stays mounted between finales — clear a pending hand-off so a
  // replayed exit sequence starts from a clean slate.
  useEffect(() => {
    if (finaleState === 'redirecting') {
      syncOrangeZoneToSupabase();
    } else {
      setPhase('idle');
    }
  }, [finaleState]);

  // The warp (and only the warp) owns the hand-off: navigation fires once the
  // colourful transition has fully played out.
  useEffect(() => {
    if (phase !== 'warp') {
      setSecondsLeft(0);
      return;
    }
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const left = FINALE_REDIRECT_DELAY_MS - (Date.now() - startedAt);
      if (left <= 0) {
        window.clearInterval(id);
        window.location.href = FINAL_REDIRECT_URL;
        return;
      }
      setSecondsLeft(Math.ceil(left / 1000));
    }, 120);
    return () => window.clearInterval(id);
  }, [phase]);

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
    syncOrangeZoneToSupabase();
  };

  const handleRedirect = () => {
    if (!gateOpen || phase === 'warp') return;
    syncOrangeZoneToSupabase();
    if (soundEnabled) sound.playMasterVictory();
    fireConfetti({
      particleCount: 170,
      spread: 110,
      startVelocity: 42,
      scalar: 1.15,
      origin: { y: 0.55 },
      ticks: 140,
      colors: ['#22ff88', '#bbffee', '#ffffff'],
    });
    setPhase('warp');
  };

  const handleExit = () => {
    if (soundEnabled) sound.playClick();
    returnToArena();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-cyber-darker/75 backdrop-blur-sm font-mono">
      {/* Portal warp — plays only when you actually redirect to another site */}
      {phase === 'warp' && (
        <div className="absolute inset-0 z-30 overflow-hidden bg-cyber-darker">
          <div className="absolute inset-0 finale-warp" />
          <div className="absolute inset-0 finale-warp-rays" />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div
              key={secondsLeft}
              className="finale-count text-7xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.9)]"
            >
              {secondsLeft}
            </div>
            <div className="text-sm md:text-base font-black uppercase tracking-[0.4em] text-cyan-100">
              Warping to next site
            </div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-fuchsia-200">
              {FINAL_REDIRECT_URL}
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-xl">
        {/* Breathing colour halo */}
        <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] opacity-50 blur-2xl finale-halo" />

        <div className="relative w-full border-2 border-fuchsia-400/50 bg-cyber-darker/95 rounded-2xl shadow-[0_0_60px_rgba(255,45,149,0.35)] overflow-hidden finale-panel-in">
          {/* Flowing rainbow bars */}
          <div className="h-1.5 w-full finale-rainbow" />
          <div className="crt-overlay absolute inset-0 pointer-events-none" />

          <div className="relative px-6 pt-5 pb-5 border-b border-fuchsia-400/25">
            <div className="flex items-center gap-2 text-[10px] font-bold text-fuchsia-300 uppercase tracking-[0.3em]">
              <Rocket className="w-4 h-4" />
              First Passage Authorized
            </div>
            <h2 className="mt-3 text-2xl md:text-3xl font-black uppercase tracking-wider bg-gradient-to-r from-fuchsia-400 via-amber-300 via-50% to-cyan-300 bg-clip-text text-transparent">
              Archive Convergence Complete
            </h2>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              All four live sectors poured their beams into the core. Recover the final
              fragment below, then pick your exit — nothing redirects on its own.
            </p>
          </div>

          <div className="relative px-6 py-5 space-y-4">
            {/* Step 1 — recover the file */}
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                gateOpen
                  ? 'border-cyan-300/50 bg-cyan-400/10'
                  : 'border-gray-700 bg-cyber-dark/70'
              }`}
            >
              <div className="w-10 h-10 rounded-lg border border-cyan-300/60 bg-cyan-400/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                {gateOpen ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-widest">
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
                    ? 'border-cyan-300/60 text-cyan-200 hover:bg-cyan-400/10'
                    : 'border-cyan-300 text-slate-900 bg-gradient-to-r from-cyan-300 to-emerald-300 hover:from-cyan-200 hover:to-emerald-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                {gateOpen ? 'Downloaded' : 'Download .CSV'}
              </button>
            </div>

            {/* Step 2 — choose: leave the zone, or redirect onward */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                gateOpen
                  ? 'border-fuchsia-400/50 bg-fuchsia-400/10'
                  : 'border-gray-800 bg-cyber-dark/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                    gateOpen
                      ? 'border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-300'
                      : 'border-gray-700 bg-gray-800 text-gray-500'
                  }`}
                >
                  {gateOpen ? <Globe2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-fuchsia-300/90 uppercase tracking-widest">
                    Step 2 — Choose your exit
                  </div>
                  <div className="text-xs font-bold text-white">
                    {gateOpen
                      ? 'Portal armed — leave the zone, or jump to the next site'
                      : 'Redirect locked — download the fragment first'}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleExit}
                  disabled={phase === 'warp'}
                  className="py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] border-2 border-white/25 text-white bg-white/5 hover:border-cyan-300 hover:text-cyan-200 hover:bg-cyan-400/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  Exit Zone
                </button>

                <button
                  onClick={handleRedirect}
                  disabled={!gateOpen || phase === 'warp'}
                  className={`py-3 px-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] border-2 transition-all flex items-center justify-center gap-2 ${
                    gateOpen
                      ? 'border-transparent text-slate-900 bg-gradient-to-r from-fuchsia-400 via-amber-300 to-cyan-300 bg-[length:200%_100%] hover:bg-right shadow-[0_0_28px_rgba(255,45,149,0.5)]'
                      : 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed'
                  }`}
                >
                  {phase === 'warp'
                    ? `Warping ${secondsLeft}s`
                    : gateOpen
                      ? 'Redirect to Next Site'
                      : 'Redirect Locked'}
                  {phase !== 'warp' &&
                    (gateOpen ? <Rocket className="w-4 h-4" /> : <Lock className="w-4 h-4" />)}
                </button>
              </div>

              <p className="mt-2.5 text-[10px] leading-relaxed text-gray-500">
                <span className="text-cyan-300 font-bold">Exit Zone</span> keeps you inside
                the Orange Zone. <span className="text-fuchsia-300 font-bold">Redirect</span>{' '}
                hands you off to <span className="text-amber-300">{REDIRECT_HOST}</span> and
                plays the full portal warp first.
              </p>
            </div>
          </div>

          <div className="relative px-6 py-3 border-t border-gray-800 bg-cyber-dark/90 flex items-center justify-between gap-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">
              ORANGE_ZONE://PORTAL_HANDSHAKE
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                gateOpen ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {gateOpen ? 'Portal armed' : 'Portal locked'}
            </span>
          </div>
          <div className="h-1.5 w-full finale-rainbow" />
        </div>
      </div>
    </div>
  );
};
