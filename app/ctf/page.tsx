'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, Terminal, Lock, ChevronRight, FileText, Database, CheckCircle2, Loader2 } from 'lucide-react';
import { ACTIVE_CHALLENGES } from '@/lib/challenges';

function CTFContent() {
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challenge');
  const [activeChallenge, setActiveChallenge] = useState<string | null>(challengeId || 'building-1');
  const [flag, setFlag] = useState('');
  const [status, setStatus] = useState<{type: 'idle' | 'checking' | 'success' | 'error', msg: string}>({type: 'idle', msg: ''});

  const currentChallenge = ACTIVE_CHALLENGES.find(c => c.id === activeChallenge) || ACTIVE_CHALLENGES[0];

  // Verified server-side against the stored SHA-256 hash (same path as the
  // in-arena terminal), so every live sector works — not just ones with a
  // hardcoded defaultFlag.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = flag.trim();
    if (!candidate) return;
    setStatus({ type: 'checking', msg: 'Verifying clearance token…' });
    try {
      const res = await fetch('/api/verify-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId: currentChallenge.id, flag: candidate }),
      });
      const data = await res.json();
      setStatus(
        data.success
          ? { type: 'success', msg: data.message || 'Flag accepted! Points awarded.' }
          : { type: 'error', msg: data.message || 'Incorrect flag. Try again.' }
      );
    } catch {
      setStatus({ type: 'error', msg: 'Verification service unreachable. Try again.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
      
      {/* Sidebar Navigation */}
      <div className="md:col-span-4 lg:col-span-3 space-y-4">
        <div className="bg-[#2a3b5c] border border-gray-800 rounded-lg p-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">
            Categories
          </div>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 text-sm font-bold bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-400 rounded-r">
              Forensics (Orange Zone)
            </button>
            <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors">
              Cryptography
            </button>
            <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors">
              Pwn / Exploitation
            </button>
            <button className="w-full text-left px-3 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors">
              Web Security
            </button>
          </div>
        </div>

        <div className="bg-[#2a3b5c] border border-gray-800 rounded-lg p-4 space-y-2">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-2">
            Challenges
          </div>
          {ACTIVE_CHALLENGES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveChallenge(c.id); setStatus({type: 'idle', msg: ''}); setFlag(''); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-all border ${
                activeChallenge === c.id
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.15)]'
                  : 'bg-[#334770] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              }`}
            >
              <span className="truncate pr-2 font-bold">{c.name}</span>
              <span className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">100pt</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-8 lg:col-span-9 space-y-6">
        {/* Header */}
        <div className="bg-[#2a3b5c] border border-gray-800 rounded-xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShieldAlert className="w-48 h-48 text-cyan-500" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold tracking-widest uppercase rounded border border-cyan-500/30">
              Forensics
            </div>
            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold tracking-widest uppercase rounded border border-green-500/30">
              100 Points
            </div>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            {currentChallenge.name}
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            {currentChallenge.briefing.storyContext}
          </p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#1a2642]/60 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4" /> Description
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {currentChallenge.briefing.objective}
              </p>
            </div>
            <div className="flex-1 bg-[#1a2642]/60 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Database className="w-4 h-4" /> Target Node
              </div>
              <p className="text-sm text-gray-300 mb-3">
                This challenge must be solved inside the 3D forensics arena. Recover the flag from the evidence logs.
              </p>
              <a href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-orange-500 hover:bg-orange-400 px-3 py-1.5 rounded transition-all">
                LAUNCH 3D ARENA <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Flag Submission */}
        <div className="bg-[#2a3b5c] border border-gray-800 rounded-xl p-6 lg:p-8">
          <div className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider mb-4">
            <Lock className="w-4 h-4 text-gray-400" /> Submit Flag
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Terminal className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                placeholder="MANU{...}"
                className="w-full bg-[#1a2642] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={status.type === 'checking' || !flag.trim()}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status.type === 'checking' ? 'VERIFYING…' : 'SUBMIT'}
            </button>
          </form>

          {status.type !== 'idle' && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 border ${
              status.type === 'success'
                ? 'bg-green-500/10 border-green-500/50 text-green-400'
                : status.type === 'checking'
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : status.type === 'checking' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
              <span className="text-sm font-bold">{status.msg}</span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default function CTFPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px] text-cyan-400 font-mono text-sm">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        LOADING FORENSIC CTF CHALLENGES...
      </div>
    }>
      <CTFContent />
    </Suspense>
  );
}
