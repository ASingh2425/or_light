'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Terminal as TerminalIcon, 
  FileText, 
  Key, 
  Database, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download,
  HelpCircle,
  Sparkles,
  ArrowRight
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
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { DatasetViewer } from './DatasetViewer';
import { sound } from '@/components/audio/SoundEffects';

export const TerminalHUD: React.FC = () => {
  const isTerminalOpen = useGameStore((state) => state.isTerminalOpen);
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);
  const setTerminalOpen = useGameStore((state) => state.setTerminalOpen);
  const activeTerminalTab = useGameStore((state) => state.activeTerminalTab);
  const setActiveTerminalTab = useGameStore((state) => state.setActiveTerminalTab);
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const unlockBuilding = useGameStore((state) => state.unlockBuilding);
  const setSelectedEvidenceImage = useGameStore((state) => state.setSelectedEvidenceImage);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['deus-ex'];

  const [inputFlag, setInputFlag] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [denyPulse, setDenyPulse] = useState(0);
  const [showDeny, setShowDeny] = useState(false);
  const [denyMessage, setDenyMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showDeny) return;
    const timer = setTimeout(() => setShowDeny(false), 4000);
    return () => clearTimeout(timer);
  }, [showDeny, denyPulse]);

  const challenge = FORENSIC_CHALLENGES.find((c) => c.id === activeBuildingId);
  const isCleared = challenge ? clearedBuildingIds.includes(challenge.id) : false;

  if (!isTerminalOpen || !challenge) {
    return null;
  }

  const handleTabChange = (tab: 'briefing' | 'evidence' | 'flag' | 'fragment') => {
    if (soundEnabled) sound.playClick();
    setActiveTerminalTab(tab);
  };

  const handleCopyEvidence = (text: string, id: string) => {
    if (soundEnabled) sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerDeny = (message: string) => {
    if (soundEnabled) sound.playError();
    setDenyMessage(message);
    setDenyPulse((p) => p + 1);
    setShowDeny(true);
    const el = inputRef.current;
    if (el) {
      el.classList.remove('animate-input-shake');
      void el.offsetWidth;
      el.classList.add('animate-input-shake');
    }
  };

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputFlag.trim() || isVerifying) return;

    try {
      setIsVerifying(true);

      const res = await fetch('/api/verify-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId: challenge.id,
          flag: inputFlag.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (soundEnabled) sound.playSuccess();
        
        fireConfetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: [theme.roadTrimColor, theme.spotLightColor, '#00ff88'],
        });

        unlockBuilding(challenge.id, inputFlag.trim());
        setInputFlag('');
      } else {
        triggerDeny(
          data.message ||
            'Nope — that clearance code does not match. Give it another shot.'
        );
      }
    } catch {
      triggerDeny('CONNECTION LOST — we could not check your code. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`fixed top-0 right-0 w-full md:w-[50%] lg:w-[46%] h-full z-40 bg-[#090d15] border-l-2 ${theme.uiBorderClass}/70 shadow-2xl flex flex-col transition-transform duration-300 font-mono`}>
      {/* CRT Scanline Overlay */}
      <div className="crt-overlay absolute inset-0 z-50 pointer-events-none" />

      {/* Wrong-flag red flash */}
      {showDeny && (
        <div
          key={denyPulse}
          className="absolute inset-0 z-50 pointer-events-none bg-cyber-red animate-error-flash"
        />
      )}

      {/* Terminal Top Window Header */}
      <div className={`px-5 py-3.5 bg-cyber-dark/95 border-b ${theme.uiBorderClass}/40 flex items-center justify-between z-10`}>
        <div className="flex items-center space-x-3">
          <div className={`w-7 h-7 rounded ${theme.uiBgBadgeClass} border flex items-center justify-center`}>
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div>
            <div className={`text-[10px] font-bold ${theme.uiTextAccentClass} tracking-widest uppercase flex items-center space-x-2`}>
              <span>{challenge.sectorTag}</span>
              {isCleared ? (
                <span className="px-1.5 py-0.2 bg-cyber-green/20 text-cyber-green border border-cyber-green/40 rounded text-[9px]">
                  ✔ CLEARED
                </span>
              ) : (
                <span className={`px-1.5 py-0.2 ${theme.uiBgBadgeClass} border rounded text-[9px]`}>
                  ACTIVE INVESTIGATION
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white tracking-wide truncate max-w-[280px]">
              {challenge.name}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (soundEnabled) sound.playClick();
            setTerminalOpen(false);
          }}
          className={`p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded border border-transparent hover:${theme.uiBorderClass}/40 transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={`px-5 py-2 bg-cyber-darker/90 border-b ${theme.uiBorderClass}/20 flex space-x-2 z-10 overflow-x-auto`}>
        <button
          onClick={() => handleTabChange('briefing')}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all ${
            activeTerminalTab === 'briefing'
              ? theme.uiActiveTabClass
              : 'text-gray-300 hover:text-white hover:bg-cyber-dark'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>BRIEFING</span>
        </button>

        <button
          onClick={() => handleTabChange('evidence')}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all ${
            activeTerminalTab === 'evidence'
              ? theme.uiActiveTabClass
              : 'text-gray-300 hover:text-white hover:bg-cyber-dark'
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>EVIDENCE ({challenge.evidenceList.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('flag')}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all ${
            activeTerminalTab === 'flag'
              ? theme.uiActiveTabClass
              : isCleared
              ? 'text-cyber-green hover:bg-cyber-green/10'
              : 'text-gray-300 hover:text-white hover:bg-cyber-dark'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>{isCleared ? 'FLAG VERIFIED' : 'SUBMIT FLAG'}</span>
        </button>

        <button
          onClick={() => handleTabChange('fragment')}
          className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all ${
            activeTerminalTab === 'fragment'
              ? 'bg-cyber-green text-slate-900 shadow-green-glow'
              : isCleared
              ? 'text-cyber-green hover:bg-cyber-green/10'
              : 'text-gray-500 hover:text-gray-400'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>FRAGMENT #{challenge.datasetFragment.fragmentId}</span>
        </button>
      </div>

      {/* Main Terminal Body (solid background for readability) */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 z-10 text-sm bg-[#0b0f18]">
        {/* TAB 1: BRIEFING */}
        {activeTerminalTab === 'briefing' && (
          <div className="space-y-4 text-gray-200">
            <div className={`p-4 bg-cyber-dark/80 border ${theme.uiBorderClass}/30 rounded-lg`}>
              <div className={`text-xs font-bold ${theme.uiTextAccentClass} uppercase tracking-wider mb-1`}>
                {challenge.briefing.subtitle}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {challenge.briefing.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {challenge.briefing.storyContext}
              </p>
            </div>

            <div className={`p-3.5 bg-cyber-card border ${theme.uiBorderClass}/25 rounded-lg space-y-1.5`}>
              <div className={`text-xs font-bold ${theme.uiTextAccentClass} flex items-center space-x-1.5`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRIMARY INVESTIGATION OBJECTIVE</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {challenge.briefing.objective}
              </p>
            </div>

            {/* Hint Box */}
            <div className={`border ${theme.uiBorderClass}/25 rounded-lg p-3 bg-cyber-darker`}>
              <button
                onClick={() => {
                  if (soundEnabled) sound.playClick();
                  setShowHint(!showHint);
                }}
                className={`w-full flex items-center justify-between text-xs ${theme.uiTextAccentClass} font-bold`}
              >
                <div className="flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showHint ? 'HIDE FORENSIC HINT' : 'ACCESS FORENSIC HINT'}</span>
                </div>
                <span>{showHint ? '▲' : '▼'}</span>
              </button>
              {showHint && (
                <div className="mt-2 text-xs text-gray-400 border-t border-gray-800 pt-2 leading-relaxed">
                  💡 {challenge.briefing.loreHint}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleTabChange('evidence')}
                className={`w-full py-2.5 bg-cyber-dark hover:bg-gray-800 border ${theme.uiBorderClass} ${theme.uiTextAccentClass} rounded text-xs font-bold flex items-center justify-center space-x-2 transition-all ${theme.uiGlowClass}`}
              >
                <span>PROCEED TO EVIDENCE REPOSITORY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE */}
        {activeTerminalTab === 'evidence' && (
          <div className="space-y-4">
            {/* Visual Forensic Evidence Image Card */}
            {challenge.evidenceImage && (
              <div
                onClick={() => setSelectedEvidenceImage({
                  url: challenge.evidenceImage!,
                  title: `SECTOR 0${challenge.buildingNumber} FORENSIC DOSSIER`,
                  subtitle: challenge.name,
                })}
                className="cursor-pointer group relative p-3 rounded-xl border border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex items-center space-x-3 shadow-lg"
              >
                <img
                  src={challenge.evidenceImage}
                  alt={challenge.name}
                  className="w-20 h-16 object-cover rounded-lg border border-amber-400/40 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>FORENSIC EVIDENCE IMAGE FILE</span>
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    Click to Inspect Classified High-Res Evidence
                  </div>
                  <div className="text-[10px] text-gray-300 font-mono mt-0.5">
                    Includes cryptographic hash, biometric verification & logs
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400">
              Recovered archive logs and cryptographic records for this sector:
            </div>

            {challenge.evidenceList.map((ev) => (
              <div
                key={ev.id}
                className={`border ${theme.uiBorderClass}/30 rounded-lg overflow-hidden bg-cyber-darker`}
              >
                <div className={`px-3.5 py-2 bg-cyber-dark flex items-center justify-between border-b ${theme.uiBorderClass}/25`}>
                  <div className={`text-xs font-bold ${theme.uiTextAccentClass} flex items-center space-x-2`}>
                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: theme.roadTrimColor }} />
                    <span>{ev.title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {ev.fileUrl && (
                      <a
                        href={ev.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors text-[10px] flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>DOWNLOAD</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleCopyEvidence(ev.content, ev.id)}
                      className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors text-[10px] flex items-center space-x-1"
                    >
                      {copiedId === ev.id ? (
                        <>
                          <Check className="w-3 h-3 text-cyber-green" />
                          <span className="text-cyber-green">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-cyber-darker/80 font-mono text-[11px] text-gray-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {ev.content}
                </div>
                {ev.notes && (
                  <div className="px-3 py-1.5 bg-cyber-dark/40 border-t border-gray-800 text-[10px] text-gray-400 italic">
                    ℹ {ev.notes}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-2">
              <button
                onClick={() => handleTabChange('flag')}
                className={`w-full py-2.5 ${theme.uiButtonClass} font-bold rounded text-xs flex items-center justify-center space-x-2 transition-all ${theme.uiGlowClass}`}
              >
                <span>ENTER CLEARANCE FLAG</span>
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SUBMIT FLAG */}
        {activeTerminalTab === 'flag' && (
          <div className="space-y-4">
            {isCleared ? (
              <div className="p-5 bg-cyber-green/10 border border-cyber-green/60 rounded-lg text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-cyber-green mx-auto animate-bounce" />
                <div className="text-sm font-bold text-cyber-green uppercase tracking-wider">
                  SECTOR ACCESS GRANTED & CLEARED
                </div>
                <p className="text-xs text-gray-300">
                  The cryptographic key for this sector has been successfully verified. Dataset Fragment {challenge.datasetFragment.fragmentId} is unlocked and ready for export.
                </p>
                <button
                  onClick={() => handleTabChange('fragment')}
                  className="px-4 py-2 bg-cyber-green text-slate-900 font-bold rounded text-xs inline-flex items-center space-x-2 hover:bg-green-400 shadow-green-glow transition-all"
                >
                  <Database className="w-4 h-4" />
                  <span>VIEW & DOWNLOAD FRAGMENT #{challenge.datasetFragment.fragmentId}</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleFlagSubmit} className="space-y-4">
                {showDeny && (
                  <div
                    key={denyPulse}
                    className="relative overflow-hidden border-2 border-cyber-red bg-cyber-red/15 rounded-lg px-4 py-6 text-center animate-deny-badge shadow-[0_0_35px_rgba(255,51,68,0.45)]"
                  >
                    <div className="text-4xl sm:text-5xl font-black tracking-[0.12em] text-cyber-red leading-none drop-shadow-[0_0_14px_rgba(255,51,68,0.9)]">
                      WRONG
                      <br />
                      CTF CODE
                    </div>
                    <div className="mt-3 text-xs text-red-100 font-bold uppercase tracking-widest">
                      {denyMessage}
                    </div>
                    <div className="mt-1 text-[10px] text-red-200/70">
                      Check the evidence files again — the answer is in there somewhere.
                    </div>
                  </div>
                )}

                <div className={`p-3.5 bg-cyber-dark/80 border ${theme.uiBorderClass}/25 rounded-lg text-xs text-gray-300 leading-relaxed`}>
                  {challenge.questionPrompt.text}
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold ${theme.uiTextAccentClass} tracking-wider flex items-center justify-between`}>
                    <span>CLEARANCE AUTHORIZATION FLAG:</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {challenge.questionPrompt.formatHint}
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputFlag}
                      onChange={(e) => setInputFlag(e.target.value)}
                      placeholder={challenge.questionPrompt.inputPlaceholder}
                      autoComplete="off"
                      spellCheck={false}
                      className={`w-full px-3.5 py-2.5 bg-black/70 border ${
                        showDeny ? 'border-cyber-red' : 'border-white/25'
                      } focus:border-white/60 rounded text-white font-mono text-xs placeholder-gray-500 outline-none selection:bg-orange-500/40`}
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  {/* Organizer convenience only — never shipped to players */}
                  {challenge.defaultFlag && process.env.NODE_ENV !== 'production' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (soundEnabled) sound.playClick();
                        setInputFlag(challenge.defaultFlag!);
                      }}
                      className="px-3 py-2 bg-cyber-dark border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded text-xs"
                    >
                      Auto-Fill Test Flag
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifying || !inputFlag.trim()}
                    className={`flex-1 py-2 ${theme.uiButtonClass} disabled:opacity-50 font-bold rounded text-xs flex items-center justify-center space-x-1.5 ${theme.uiGlowClass} transition-all`}
                  >
                    {isVerifying ? (
                      <span className="animate-pulse">VERIFYING TOKEN...</span>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>SUBMIT & DECRYPT</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: DECRYPTED FRAGMENT */}
        {activeTerminalTab === 'fragment' && (
          <div>
            {isCleared ? (
              <DatasetViewer challenge={challenge} />
            ) : (
              <div className="p-8 text-center border border-dashed border-gray-700 rounded-lg space-y-3 bg-cyber-darker">
                <Database className="w-10 h-10 text-gray-600 mx-auto" />
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  FRAGMENT ENCRYPTED & LOCKED
                </div>
                <p className="text-xs text-gray-500 max-w-[280px] mx-auto">
                  Submit the valid clearance flag in the SUBMIT FLAG tab to decrypt and download this sector&apos;s dataset chunk.
                </p>
                <button
                  onClick={() => handleTabChange('flag')}
                  className={`px-3 py-1.5 ${theme.uiBgBadgeClass} border rounded text-xs font-bold`}
                >
                  GO TO FLAG TAB
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <div className={`px-5 py-2 bg-cyber-darker border-t ${theme.uiBorderClass}/20 text-[10px] text-gray-500 flex items-center justify-between z-10`}>
        <div>ORANGE_ZONE://{theme.id.toUpperCase()}_NODE</div>
        <div>
          STATUS: {isCleared ? '✔ AUTH_SUCCESS' : '● AWAITING_CLEARANCE'}
        </div>
      </div>
    </div>
  );
};
