'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingChallenge } from '@/lib/types';
import { useGameStore, isBuildingUnlocked } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

interface Building3DProps {
  challenge: BuildingChallenge;
  isCleared: boolean;
  isActive: boolean;
}

export const Building3D: React.FC<Building3DProps> = ({
  challenge,
  isCleared,
  isActive,
}) => {
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const setSelectedEvidenceImage = useGameStore((state) => state.setSelectedEvidenceImage);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const isUnlocked = isBuildingUnlocked(challenge.id, clearedBuildingIds);
  
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const dataRingsRef = useRef<THREE.Group>(null);
  const outerPillarsRef = useRef<THREE.Group>(null);

  const [x, y, z] = challenge.coordinates;

  const mainColor = useMemo(() => {
    if (isCleared) return new THREE.Color(theme.buildingClearedColor);
    if (isActive) return new THREE.Color(theme.roadTrimColor);
    return new THREE.Color(theme.buildingGlassColor);
  }, [isCleared, isActive, theme]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      const scale = 1 + Math.sin(t * 2) * 0.06;
      ringRef.current.scale.set(scale, scale, 1);
    }
    if (coreRef.current) {
      coreRef.current.position.y = 5.6 + Math.sin(t * 1.5) * 0.5;
      coreRef.current.rotation.y = t * 0.6;
      coreRef.current.rotation.x = Math.sin(t * 0.8) * 0.2;
    }
    if (dataRingsRef.current) {
      dataRingsRef.current.rotation.y = -t * 0.7;
      dataRingsRef.current.position.y = 5.6 + Math.cos(t * 1.2) * 0.4;
    }
    if (outerPillarsRef.current) {
      outerPillarsRef.current.rotation.y = t * 0.2;
    }
  });

  const handleClick = () => {
    if (soundEnabled) sound.playEnter();
    setActiveBuilding(challenge.id);
  };

  const handleEvidenceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (soundEnabled) sound.playClick();
    if (challenge.evidenceImage) {
      setSelectedEvidenceImage({
        url: challenge.evidenceImage,
        title: `SECTOR 0${challenge.buildingNumber} EVIDENCE DOSSIER`,
        subtitle: challenge.name,
      });
    } else {
      setActiveBuilding(challenge.id);
    }
  };

  return (
    <group ref={meshRef} position={[x, y, z]}>
      {/* ── Outer Sub-Base Platform (Large Hexagonal Foundation) ── */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[5.6, 6.4, 0.5, 6]} />
        <meshStandardMaterial
          color={theme.buildingBaseColor}
          roughness={0.25}
          metalness={0.5}
        />
      </mesh>

      {/* ── Inner Stepped Pedestal ── */}
      <mesh position={[0, 0.65, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 5.0, 0.4, 6]} />
        <meshStandardMaterial
          color={theme.roadTrimColor}
          emissive={theme.roadTrimColor}
          emissiveIntensity={0.25}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* ── Pulsing Interaction Ground Ring (Scaled Up) ── */}
      <mesh
        ref={ringRef}
        position={[0, 0.88, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[4.2, 4.9, 32]} />
        <meshBasicMaterial
          color={mainColor}
          transparent
          opacity={isCleared ? 0.75 : 0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Massive Forensics Monolith Core ── */}
      <mesh position={[0, 3.6, 0]} castShadow receiveShadow onClick={handleClick}>
        <cylinderGeometry args={[3.2, 3.8, 5.5, 6]} />
        <meshStandardMaterial
          color={theme.buildingBaseColor}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>

      {/* ── Glowing Accent Vertical Strips On Core ── */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const sx = Math.cos(angle) * 3.4;
        const sz = Math.sin(angle) * 3.4;
        return (
          <mesh key={`strip-${i}`} position={[sx, 3.6, sz]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.16, 5.2, 0.1]} />
            <meshBasicMaterial color={mainColor} />
          </mesh>
        );
      })}

      {/* ── Outer Cylindrical Hologram Data Shield ── */}
      <mesh position={[0, 4.8, 0]} onClick={handleClick}>
        <cylinderGeometry args={[3.9, 3.9, 8.5, 16]} />
        <meshStandardMaterial
          color={mainColor}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.18}
          emissive={mainColor}
          emissiveIntensity={0.3}
          wireframe={!isCleared}
        />
      </mesh>

      {/* ── Floating Holographic Forensic Core (Octahedron) ── */}
      <mesh ref={coreRef} position={[0, 5.6, 0]} onClick={handleClick}>
        <octahedronGeometry args={[1.7, 1]} />
        <meshStandardMaterial
          color={mainColor}
          wireframe={!isCleared}
          emissive={mainColor}
          emissiveIntensity={isCleared ? 1.2 : 0.8}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* ── Orbiting Planetary Data Shards & Holographic Rings ── */}
      <group ref={dataRingsRef} position={[0, 5.6, 0]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.8, 0.06, 8, 36]} />
          <meshBasicMaterial color={theme.buildingBeaconColor} />
        </mesh>
        <mesh rotation={[-Math.PI / 3, 0, Math.PI / 4]}>
          <torusGeometry args={[3.4, 0.04, 8, 36]} />
          <meshBasicMaterial color={mainColor} />
        </mesh>
        
        {/* Floating Data Memory Crystals */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const sx = Math.cos(angle) * 3.9;
          const sz = Math.sin(angle) * 3.9;
          return (
            <mesh key={`shard-${i}`} position={[sx, Math.sin(i * 1.5) * 0.8, sz]} rotation={[i, i * 0.7, 0]}>
              <boxGeometry args={[0.55, 0.55, 0.55]} />
              <meshStandardMaterial
                color={theme.buildingBeaconColor}
                emissive={theme.buildingBeaconColor}
                emissiveIntensity={0.9}
              />
            </mesh>
          );
        })}
      </group>

      {/* ── Four Surrounding Energy Pylons ── */}
      <group ref={outerPillarsRef}>
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
          const px = Math.cos(angle) * 4.9;
          const pz = Math.sin(angle) * 4.9;
          return (
            <group key={`pylon-${i}`} position={[px, 0, pz]}>
              <mesh position={[0, 1.8, 0]}>
                <cylinderGeometry args={[0.22, 0.28, 3.6, 8]} />
                <meshStandardMaterial color={theme.buildingBaseColor} metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[0, 3.8, 0]}>
                <sphereGeometry args={[0.3, 12, 12]} />
                <meshBasicMaterial color={mainColor} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ── Forensic Crime Scene Yellow Caution Ring ── */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.8, 7.1, 32]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Skyward Forensic Laser Beam ── */}
      <mesh position={[0, 24, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 46, 12]} />
        <meshBasicMaterial 
          color={mainColor} 
          transparent 
          opacity={0.38} 
          blending={THREE.AdditiveBlending} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* ── Core Beacon Point Light ── */}
      <pointLight position={[0, 5.6, 0]} color={mainColor} intensity={isActive ? 4.5 : 2.5} distance={22} />

      {/* ── FORENSIC NODE CARD ──
           One <Html> portal per building rather than two. The beacon label and
           the evidence kiosk were separate stacked portals doing overlapping
           jobs, and every mounted <Html> rewrites its own DOM transform each
           frame. Both actions are kept as two hit areas in the single card. */}
      <Html
        position={[0, 11.2, 0]}
        center
        distanceFactor={32}
        zIndexRange={[100, 0]}
      >
        <div
          className="select-none rounded-xl border backdrop-blur-xl text-center shadow-2xl min-w-[210px] overflow-hidden"
          style={{
            background: isCleared ? 'rgba(0,255,136,0.22)' : theme.uiPanelBg,
            borderColor: isCleared ? '#00ff88' : theme.uiAccentHex,
            boxShadow: isCleared ? '0 0 25px rgba(0,255,136,0.6)' : `0 0 25px ${theme.uiAccentHex}50`,
            color: isCleared ? '#00ff88' : '#ffffff',
          }}
        >
          {/* Beacon hit area — open this sector terminal */}
          <button
            type="button"
            onClick={handleClick}
            className="block w-full cursor-pointer transition-all duration-300 transform hover:scale-110 px-4 py-2.5"
          >
            <div className="flex items-center justify-center space-x-1.5 text-xs font-bold tracking-wider uppercase font-mono">
              {isCleared ? (
                <span className="flex items-center font-bold text-cyber-green">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyber-green mr-1.5 animate-pulse" />
                  ✔ [DECRYPTED]
                </span>
              ) : isUnlocked ? (
                <span className="flex items-center" style={{ color: theme.uiAccentHex }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 animate-ping" style={{ backgroundColor: theme.roadTrimColor }} />
                  DATA NODE 0{challenge.buildingNumber}
                </span>
              ) : (
                <span className="flex items-center text-amber-400 font-bold">
                  🔒 [LOCKED]
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-white truncate max-w-[220px] mt-1 tracking-wide">
              {challenge.name}
            </div>
            <div className="text-[10px] font-mono mt-1 opacity-80" style={{ color: isUnlocked ? theme.uiAccentHex : '#f59e0b' }}>
              {isCleared
                ? 'Fragment Recovered & Unlocked'
                : isUnlocked
                ? 'Click or Press [ENTER] to Inspect'
                : `Complete Sector 0${challenge.buildingNumber - 1} First`}
            </div>
          </button>

          {/* Evidence hit area — open this sector dossier */}
          {challenge.evidenceImage && (
            <button
              type="button"
              onClick={handleEvidenceClick}
              className="block w-full cursor-pointer transition-all duration-300 border-t border-white/20 px-2 py-2 hover:bg-white/5"
            >
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-amber-400 mb-1 pb-1 border-b border-amber-400/30">
                <span>EVIDENCE STATION 0{challenge.buildingNumber}</span>
                <span className="bg-amber-400 text-slate-900 px-1 rounded text-[8px] font-black">IMG</span>
              </div>
              <div className="relative rounded overflow-hidden border border-white/20">
                <img
                  src={challenge.evidenceImage}
                  alt={challenge.name}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent flex items-end p-1">
                  <span className="text-[8px] font-mono text-cyan-300 font-bold">
                    CLICK TO EXAMINE
                  </span>
                </div>
              </div>
              <div className="text-[10px] font-bold text-white mt-1 truncate">
                {challenge.sectorTag}
              </div>
            </button>
          )}
        </div>
      </Html>
    </group>
  );
};
