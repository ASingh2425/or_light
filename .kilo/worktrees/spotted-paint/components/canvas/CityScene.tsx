'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CityEnvironment } from './CityEnvironment';
import { Building3D } from './Building3D';
import { Player3D } from './Player3D';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { useGameStore } from '@/lib/store';

export const CityScene: React.FC = () => {
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 22, 24], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <CityEnvironment />

          {/* Render All 5 Forensic Sector Buildings */}
          {FORENSIC_CHALLENGES.map((challenge) => (
            <Building3D
              key={challenge.id}
              challenge={challenge}
              isCleared={clearedBuildingIds.includes(challenge.id)}
              isActive={activeBuildingId === challenge.id}
            />
          ))}

          {/* Controllable Player Avatar */}
          <Player3D />
        </Suspense>
      </Canvas>
    </div>
  );
};
