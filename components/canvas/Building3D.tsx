'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingChallenge } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { pointerState } from '@/lib/inputState';
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
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const setNotification = useGameStore((state) => state.setNotification);
  const playerPos = useGameStore((state) => state.playerPos);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];
  
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
    // Ignore clicks that were actually camera-orbit drags
    if (pointerState.dragDistance > 8) return;
    // Locked sectors only open from physical proximity (same radius the
    // drive-up trigger uses) or once the flag has cleared the building.
    if (!isCleared) {
      const dx = playerPos[0] - challenge.coordinates[0];
      const dz = playerPos[2] - challenge.coordinates[2];
      if (Math.sqrt(dx * dx + dz * dz) >= 6.2) {
        setNotification({
          message: `SEC-0${challenge.buildingNumber} locked — drive the car closer to open this terminal.`,
          type: 'info',
        });
        return;
      }
    }
    if (soundEnabled) sound.playEnter();
    setActiveBuilding(challenge.id);
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

      {/* ── Core Beacon Point Light ── */}
      <pointLight position={[0, 5.6, 0]} color={mainColor} intensity={isActive ? 4.5 : 2.5} distance={22} />
    </group>
  );
};
