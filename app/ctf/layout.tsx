import React from 'react';

export default function CTFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#1a2642] text-gray-100 font-mono flex flex-col">
      <header className="px-6 py-4 border-b border-cyan-500/30 bg-[#233253] flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-400 font-bold">
            {'</>'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-widest uppercase">MANU Protocol <span className="text-cyan-400">CTF</span></h1>
            <div className="text-[10px] text-cyan-200/70 tracking-widest">Global Competition Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-cyan-100 hover:text-cyan-400 cursor-pointer transition-colors">SCOREBOARD</span>
          <span className="text-xs font-bold text-cyan-100 hover:text-cyan-400 cursor-pointer transition-colors">CHALLENGES</span>
          <div className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-[#1a2642] text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,255,0.4)]">
            LOGIN
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff12_1px,transparent_1px),linear-gradient(to_bottom,#00ffff12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        {children}
      </main>
      <footer className="px-6 py-4 border-t border-cyan-500/30 bg-[#233253] text-center text-[10px] text-cyan-200/50">
        MANU Protocol Forensics Challenge © 2026. Data structures are strictly confidential.
      </footer>
    </div>
  );
}
