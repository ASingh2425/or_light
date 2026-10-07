'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { FINAL_REDIRECT_URL, FINALE_REDIRECT_DELAY_MS } from '@/lib/constants';

export const FinaleOverlay: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);

  useEffect(() => {
    if (finaleState !== 'redirecting') return;
    const timer = setTimeout(() => {
      window.location.href = FINAL_REDIRECT_URL;
    }, FINALE_REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [finaleState]);

  if (finaleState !== 'redirecting') return null;

  // Blinding flash over the cinematic orbit shot, then navigation fires
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none finale-flash">
      <div className="text-center px-6 finale-redirect-text font-mono">
        <div className="text-2xl md:text-4xl font-black tracking-widest uppercase">
          First Passage Authorized
        </div>
        <div className="mt-3 text-sm md:text-base font-bold tracking-[0.3em] uppercase">
          Redirecting to secure relay…
        </div>
      </div>
    </div>
  );
};
