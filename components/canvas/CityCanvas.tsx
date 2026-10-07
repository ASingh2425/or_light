'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DynamicCityScene = dynamic(
  () => import('./CityScene').then((mod) => mod.CityScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-cyber-darker text-cyber-orange font-mono">
        <div className="w-12 h-12 border-2 border-cyber-orange border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm tracking-widest uppercase animate-pulse">
          Initializing Orange Zone Forensic Grid...
        </div>
      </div>
    ),
  }
);

export const CityCanvas: React.FC = () => {
  return <DynamicCityScene />;
};
