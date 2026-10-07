'use client';

import React, { useMemo, useState } from 'react';
import { 
  X, 
  Terminal as TerminalIcon, 
  FileText, 
  Key, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronsRight,
  ChevronRight,
  Lock,
  Download,
  Brain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { DatasetViewer } from './DatasetViewer';
import { sound } from '@/components/audio/SoundEffects';

type TerminalTab = 'briefing' | 'evidence' | 'flag' | 'fragment';

export const TerminalHUD: React.FC = () => {
  const isTerminalOpen = useGameStore((state) => state.isTerminalOpen);
  const isTerminalMinimized = useGameStore((state) => state.isTerminalMinimized);
  const setTerminalMinimized = useGameStore((state) => state.setTerminalMinimized);
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);
  const setTerminalOpen = useGameStore((state) => state.setTerminalOpen);
  const activeTerminalTab = useGameStore((state) => state.activeTerminalTab);
  const setActiveTerminalTab = useGameStore((state) => state.setActiveTerminalTab);
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const unlockBuilding = useGameStore((state) => state.unlockBuilding);
  const setSelectedEvidenceImage = useGameStore((state) => state.setSelectedEvidenceImage);
  const revealedHints = useGameStore((state) => state.revealedHints);
  const revealHint = useGameStore((state) => state.revealHint);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['deus-ex'];

  const [inputFlag, setInputFlag] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<TerminalTab | null>(null);
  const [hoveredHeaderButton, setHoveredHeaderButton] = useState<'minimize' | 'close' | null>(null);

  const challenge = useMemo(
    () => FORENSIC_CHALLENGES.find((c) => c.id === activeBuildingId),
    [activeBuildingId]
  );
  const isCleared = challenge ? clearedBuildingIds.includes(challenge.id) : false;
  const isLive = challenge ? challenge.status === 'live' : false;

  const accent = theme.uiAccentHex;

  const tabMeta = useMemo<ReadonlyArray<{ tab: TerminalTab; label: string; icon: React.ReactNode }>>(() => {
    if (!challenge) return [];
    if (challenge.status !== 'live') {
      return [{ tab: 'briefing', label: 'BRIEFING', icon: <FileText className="w-3.5 h-3.5" /> }];
    }
    return [
      { tab: 'briefing', label: 'BRIEFING', icon: <FileText className="w-3.5 h-3.5" /> },
      { tab: 'evidence', label: `EVIDENCE (${challenge.evidenceList.length})`, icon: <TerminalIcon className="w-3.5 h-3.5" /> },
      { tab: 'flag', label: isCleared ? 'FLAG VERIFIED' : 'SUBMIT FLAG', icon: <Key className="w-3.5 h-3.5" /> },
      { tab: 'fragment', label: `FRAGMENT #${challenge.datasetFragment.fragmentId}`, icon: <Database className="w-3.5 h-3.5" /> },
    ];
  }, [challenge, isCleared]);

  // An offline sector only has a briefing; never render a tab it doesn't offer.
  const activeTab: TerminalTab = tabMeta.some((t) => t.tab === activeTerminalTab)
    ? activeTerminalTab
    : 'briefing';

  const briefingCoversFragment = useMemo(() => {
    if (!challenge) return true;
    const b = challenge.briefing;
    return /\bfragment\b/i.test(`${b.title} ${b.subtitle} ${b.storyContext} ${b.objective}`);
  }, [challenge]);

  if (!isTerminalOpen || !challenge) {
    return null;
  }

  const hintsRevealed = Math.min(revealedHints[challenge.id] ?? 0, challenge.hints.length);
  const hintPenalty = challenge.hints.slice(0, hintsRevealed).reduce((sum, h) => sum + h.cost, 0);
  const netPoints = Math.max(0, challenge.points - hintPenalty);
  const nextHint = challenge.hints[hintsRevealed];

  const fragmentLockReason = `Encrypted \u2014 submit this sector's clearance flag to decrypt its ${challenge.datasetFragment.rowCount}-record fragment.`;

  if (isTerminalMinimized) {
    return (
      <button
        onClick={() => {
          if (soundEnabled) sound.playClick();
          setTerminalMinimized(false);
        }}
        title="Expand terminal"
        aria-label={`Expand forensic terminal for ${challenge.sectorTag}`}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-11 md:w-12 h-56 flex flex-col items-center justify-center gap-4 rounded-l-xl font-mono shadow-2xl backdrop-blur-xl transition-all hover:brightness-125 focus:outline-none"
        style={{
          background: 'rgba(10, 14, 22, 0.92)',
          border: `1px solid ${accent}60`,
          borderRight: 'none',
          color: accent,
          boxShadow: `0 0 25px ${accent}40`,
        }}
      >
        <ChevronRight className="w-4 h-4 flex-shrink-0" />
        <span
          className="text-[10px] font-bold uppercase tracking-widest select-none"
          style={{ writingMode: 'vertical-rl' }}
        >
          {challenge.sectorTag}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest select-none opacity-80"
          style={{ writingMode: 'vertical-rl' }}
        >
          {`BLDG-${String(challenge.buildingNumber).padStart(2, '0')}`}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
          {isCleared ? 'CLEARED' : 'LOCKED'}
        </span>
      </button>
    );
  }

  const handleTabChange = (tab: TerminalTab) => {
    if (soundEnabled) sound.playClick();
    setActiveTerminalTab(tab);
    setErrorMessage(null);
  };

  const handleCopyEvidence = (text: string, id: string) => {
    if (soundEnabled) sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputFlag.trim() || isVerifying) return;

    try {
      setIsVerifying(true);
      setErrorMessage(null);

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
        
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: [theme.roadTrimColor, theme.spotLightColor, '#00ff88'],
        });

        unlockBuilding(challenge.id, inputFlag.trim());
        setInputFlag('');
      } else {
        if (soundEnabled) sound.playError();
        setErrorMessage(data.message || 'Verification failed. Flag is incorrect.');
      }
    } catch {
      if (soundEnabled) sound.playError();
      setErrorMessage('Network error during flag verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className="fixed top-0 right-0 w-full md:w-[50%] lg:w-[46%] h-full z-40 bg-cyber-darker/95 border-l-2 flex flex-col transition-transform duration-300 font-mono shadow-2xl backdrop-blur-xl"
      style={{ borderLeftColor: `${accent}70` }}
    >
      {/* CRT Scanline Overlay */}
      <div className="crt-overlay absolute inset-0 z-50 pointer-events-none" />

      {/* Terminal Top Window Header */}
      <div
        className="px-5 py-3.5 bg-cyber-dark/95 flex items-center justify-between z-10"
        style={{ borderBottom: `1px solid ${accent}40` }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-7 h-7 rounded border flex items-center justify-center"
            style={{
              background: `${accent}20`,
              borderColor: `${accent}50`,
              color: accent,
            }}
          >
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase flex items-center space-x-2"
              style={{ color: accent }}
            >
              <span>{challenge.sectorTag}</span>
              {isCleared ? (
                <span className="px-1.5 py-0.2 bg-cyber-green/20 text-cyber-green border border-cyber-green/40 rounded text-[9px]">
                  ✔ CLEARED
                </span>
              ) : (
                <span
                  className="px-1.5 py-0.2 border rounded text-[9px]"
                  style={{
                    background: `${accent}20`,
                    borderColor: `${accent}50`,
                    color: accent,
                  }}
                >
                  ACTIVE INVESTIGATION
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white tracking-wide truncate max-w-[280px]">
              {challenge.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setTerminalMinimized(true);
            }}
            title="Minimise terminal"
            aria-label="Minimise terminal"
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
            style={{ border: `1px solid ${hoveredHeaderButton === 'minimize' ? `${accent}40` : 'transparent'}` }}
            onMouseEnter={() => setHoveredHeaderButton('minimize')}
            onMouseLeave={() => setHoveredHeaderButton((prev) => (prev === 'minimize' ? null : prev))}
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (soundEnabled) sound.playClick();
              setTerminalOpen(false);
            }}
            title="Close terminal"
            aria-label="Close terminal"
            className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
            style={{ border: `1px solid ${hoveredHeaderButton === 'close' ? `${accent}40` : 'transparent'}` }}
            onMouseEnter={() => setHoveredHeaderButton('close')}
            onMouseLeave={() => setHoveredHeaderButton((prev) => (prev === 'close' ? null : prev))}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="px-5 py-2 bg-cyber-darker/90 flex space-x-2 z-10 overflow-x-auto"
        style={{ borderBottom: `1px solid ${accent}20` }}
      >
        {tabMeta.map(({ tab, label, icon }) => {
          const isActive = activeTab === tab;
          const isLocked = isTabDisabled(tab, isCleared);
          const isHovered = hoveredTab === tab && !isActive && !isLocked;

          return (
            <span
              key={tab}
              className="inline-flex"
              title={isLocked ? fragmentLockReason : undefined}
            >
              <button
                type="button"
                onClick={() => {
                  if (isLocked) return;
                  handleTabChange(tab);
                }}
                aria-disabled={isLocked}
                aria-label={isLocked ? `${label} \u2014 ${fragmentLockReason}` : undefined}
                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={
                  isActive
                    ? {
                        background: accent,
                        color: '#0f172a',
                        boxShadow: `0 0 20px ${accent}60`,
                      }
                    : {
                        background: isHovered ? '#1f2937' : 'transparent',
                        color: isHovered ? '#ffffff' : isTabColor(tab, isCleared),
                      }
                }
                onMouseEnter={() => setHoveredTab(tab)}
                onMouseLeave={() => setHoveredTab((prev) => (prev === tab ? null : prev))}
              >
                {icon}
                <span>{label}</span>
              </button>
            </span>
          );
        })}
      </div>

      {/* Main Terminal Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 z-10 text-sm">
        {/* TAB 1: BRIEFING */}
        {activeTab === 'briefing' && (
          <div className="space-y-4 text-gray-200">
            <div
              className="p-4 rounded-lg"
              style={{
                background: 'rgba(14, 18, 27, 0.8)',
                border: `1px solid ${accent}30`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest"
                  style={{ background: `${accent}15`, borderColor: `${accent}50`, color: accent }}
                >
                  {challenge.category}
                </span>
                <span className="px-1.5 py-0.5 rounded border border-cyber-green/50 bg-cyber-green/10 text-cyber-green text-[9px] font-bold tracking-widest">
                  {isLive ? `${netPoints}/${challenge.points} PTS` : `${challenge.points} PTS`}
                </span>
                {!isLive && (
                  <span className="px-1.5 py-0.5 rounded border border-amber-400/50 bg-amber-400/10 text-amber-300 text-[9px] font-bold tracking-widest">
                    OFFLINE
                  </span>
                )}
              </div>
              <div
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: accent }}
              >
                {challenge.briefing.subtitle}
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                {challenge.briefing.title}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {challenge.briefing.storyContext}
              </p>
            </div>

            <div
              className="p-3.5 rounded-lg space-y-1.5"
              style={{
                background: 'rgba(18, 23, 34, 0.88)',
                border: `1px solid ${accent}25`,
              }}
            >
              <div
                className="text-xs font-bold flex items-center space-x-1.5"
                style={{ color: accent }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>PRIMARY INVESTIGATION OBJECTIVE</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {challenge.briefing.objective}
              </p>
            </div>

            {challenge.mlConnection && (
              <div
                className="p-3.5 rounded-lg space-y-1.5"
                style={{
                  background: 'rgba(18, 23, 34, 0.88)',
                  border: `1px solid ${accent}25`,
                }}
              >
                <div
                  className="text-xs font-bold flex items-center space-x-1.5"
                  style={{ color: accent }}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>ML CONNECTION: {challenge.mlConnection.concept.toUpperCase()}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {challenge.mlConnection.text}
                </p>
                {isLive && (
                  <p className="text-[10px] text-gray-500">
                    No machine-learning knowledge is needed to solve this sector.
                  </p>
                )}
              </div>
            )}

            {isLive && !isCleared && !briefingCoversFragment && (
              <div
                className="p-3.5 rounded-lg space-y-1.5"
                style={{
                  background: 'rgba(18, 23, 34, 0.88)',
                  border: `1px solid ${accent}25`,
                }}
              >
                <div
                  className="text-xs font-bold flex items-center space-x-1.5"
                  style={{ color: accent }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ENCRYPTED PAYLOAD AWAITS THE CLEARANCE FLAG</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Dataset Fragment {challenge.datasetFragment.fragmentId} &middot; Records {challenge.datasetFragment.recordRange} &middot; {challenge.datasetFragment.rowCount} rows.
                  Submitting the valid clearance flag in the SUBMIT FLAG tab decrypts and unlocks it.
                </p>
              </div>
            )}

            {/* Tiered hint ladder: each tier costs points */}
            {isLive && challenge.hints.length > 0 && (
              <div
                className="border rounded-lg p-3 space-y-2"
                style={{
                  borderColor: `${accent}25`,
                  background: 'rgba(8, 11, 17, 0.9)',
                }}
              >
                <div
                  className="flex items-center justify-between text-xs font-bold"
                  style={{ color: accent }}
                >
                  <div className="flex items-center space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>FORENSIC HINTS ({hintsRevealed}/{challenge.hints.length})</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-normal">
                    worth {netPoints} pts if solved now
                  </span>
                </div>
                {challenge.hints.slice(0, hintsRevealed).map((h, i) => (
                  <div
                    key={i}
                    className="text-xs text-gray-300 border-t border-gray-800 pt-2 leading-relaxed"
                  >
                    <span className="text-amber-300 font-bold">
                      HINT {i + 1} (-{h.cost} pts):
                    </span>{' '}
                    {h.text}
                  </div>
                ))}
                {nextHint && (
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEnabled) sound.playClick();
                      revealHint(challenge.id);
                    }}
                    className="w-full py-1.5 rounded border text-[11px] font-bold transition-all hover:brightness-125"
                    style={{
                      background: `${accent}12`,
                      borderColor: `${accent}50`,
                      color: accent,
                    }}
                  >
                    REVEAL HINT {hintsRevealed + 1} (-{nextHint.cost} PTS)
                  </button>
                )}
              </div>
            )}

            {!isLive && (
              <div
                className="p-4 rounded-lg border border-dashed text-center space-y-2"
                style={{ borderColor: '#f59e0b80', background: 'rgba(245, 158, 11, 0.06)' }}
              >
                <Lock className="w-6 h-6 text-amber-400 mx-auto" />
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Channel offline
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This sector has not been declassified yet and cannot be solved in this build.
                  Sectors are standalone, so work through the live ones in any order.
                </p>
              </div>
            )}

            {isLive && (
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleTabChange('evidence')}
                className="py-2.5 px-3 font-bold rounded text-xs flex items-center justify-center space-x-2 transition-all"
                style={{
                  background: 'rgba(14, 18, 27, 0.9)',
                  border: `1px solid ${accent}`,
                  color: accent,
                  boxShadow: `0 0 15px ${accent}30`,
                }}
              >
                <span>CTF EVIDENCE DOSSIER</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleTabChange('flag')}
                className="py-2.5 px-3 font-bold rounded text-xs flex items-center justify-center space-x-2 transition-all text-slate-900"
                style={{
                  background: `linear-gradient(to right, ${accent}, ${theme.roadTrimColor})`,
                  boxShadow: `0 0 15px ${accent}40`,
                }}
              >
                <Key className="w-4 h-4" />
                <span>SUBMIT FLAG & DECRYPT</span>
              </button>
            </div>
            )}
          </div>
        )}

        {/* TAB 2: EVIDENCE */}
        {activeTab === 'evidence' && (
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
                    {challenge.evidenceImageCaption ?? 'Click to inspect the recovered evidence image'}
                  </div>
                </div>
              </div>
            )}

            {challenge.attachments && challenge.attachments.length > 0 && (
              <div className="space-y-2">
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: accent }}
                >
                  Downloadable evidence files
                </div>
                {challenge.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    download={att.filename}
                    onClick={() => {
                      if (soundEnabled) sound.playClick();
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg border transition-all hover:brightness-125"
                    style={{ borderColor: `${accent}50`, background: `${accent}10` }}
                  >
                    <Download className="w-5 h-5 flex-shrink-0" style={{ color: accent }} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">{att.label}</div>
                      <div className="text-[10px] text-gray-400 leading-snug">{att.description}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: accent }}>
                        {att.filename}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-400">
              Recovered archive logs and records for this sector:
            </div>

            {challenge.evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="border rounded-lg overflow-hidden"
                style={{ borderColor: `${accent}30`, background: 'rgba(8, 11, 17, 0.9)' }}
              >
                <div
                  className="px-3.5 py-2 flex items-center justify-between"
                  style={{
                    background: 'rgba(14, 18, 27, 0.9)',
                    borderBottom: `1px solid ${accent}25`,
                  }}
                >
                  <div
                    className="text-xs font-bold flex items-center space-x-2"
                    style={{ color: accent }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.roadTrimColor }} />
                    <span>{ev.title}</span>
                  </div>
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
                <div className="p-3 font-mono text-[11px] text-gray-200 overflow-x-auto whitespace-pre leading-relaxed">
                  {ev.content}
                </div>
                {ev.notes && (
                  <div className="px-3 py-1.5 border-t border-gray-800 text-[10px] text-gray-400 italic">
                    ℹ {ev.notes}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-2">
              <button
                onClick={() => handleTabChange('flag')}
                className="w-full py-2.5 font-bold rounded text-xs flex items-center justify-center space-x-2 transition-all"
                style={{
                  background: `linear-gradient(to right, ${accent}, ${theme.roadTrimColor})`,
                  color: '#0f172a',
                  boxShadow: `0 0 25px ${accent}50`,
                }}
              >
                <span>ENTER CLEARANCE FLAG</span>
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SUBMIT FLAG */}
        {activeTab === 'flag' && (
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
                <div
                  className="p-3.5 rounded-lg text-xs text-gray-300 leading-relaxed"
                  style={{
                    background: 'rgba(14, 18, 27, 0.8)',
                    border: `1px solid ${accent}25`,
                  }}
                >
                  {challenge.questionPrompt.text}
                </div>

                <div className="space-y-2">
                  <label
                    className="text-xs font-bold tracking-wider flex items-center justify-between"
                    style={{ color: accent }}
                  >
                    <span>CLEARANCE AUTHORIZATION FLAG:</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      {challenge.questionPrompt.formatHint}
                    </span>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={inputFlag}
                      onChange={(e) => setInputFlag(e.target.value)}
                      placeholder={challenge.questionPrompt.inputPlaceholder}
                      className="w-full px-3.5 py-2.5 rounded text-white font-mono text-xs placeholder-gray-600 outline-none"
                      style={{
                        background: 'rgba(8, 11, 17, 0.9)',
                        border: `1px solid ${accent}60`,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = accent;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = `${accent}60`;
                      }}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-cyber-red/15 border border-cyber-red/60 rounded text-xs text-cyber-red flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex space-x-2 pt-1">
                  <button
                    type="submit"
                    disabled={isVerifying || !inputFlag.trim()}
                    className="flex-1 py-2 font-bold rounded text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                    style={{
                      background: `linear-gradient(to right, ${accent}, ${theme.roadTrimColor})`,
                      color: '#0f172a',
                      boxShadow: `0 0 25px ${accent}50`,
                    }}
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
        {activeTab === 'fragment' && (
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
                  className="px-3 py-1.5 border rounded text-xs font-bold"
                  style={{
                    background: `${accent}20`,
                    borderColor: `${accent}50`,
                    color: accent,
                  }}
                >
                  GO TO FLAG TAB
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <div
        className="px-5 py-2 bg-cyber-darker flex items-center justify-between z-10 text-[10px] text-gray-500"
        style={{ borderTop: `1px solid ${accent}20` }}
      >
        <div>ORANGE_ZONE://{theme.id.toUpperCase()}_NODE</div>
        <div>
          STATUS: {isCleared ? '✔ AUTH_SUCCESS' : '● AWAITING_CLEARANCE'}
        </div>
      </div>
    </div>
  );
};

function isTabDisabled(tab: string, isCleared: boolean): boolean {
  return tab === 'fragment' && !isCleared;
}

function isTabColor(tab: string, isCleared: boolean): string {
  if (isTabDisabled(tab, isCleared)) return '#6b7280';
  if (tab === 'flag' && isCleared) return '#00ff88';
  return '#d1d5db';
}
