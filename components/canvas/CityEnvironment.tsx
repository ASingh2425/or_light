'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';

export const CityEnvironment: React.FC = () => {
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const centralRadarRef = useRef<THREE.Group>(null);
  const forensicRingsRef = useRef<THREE.Group>(null);

  // Perimeter background skyline (radius 105) for balanced 2x arena
  const backgroundMonoliths = useMemo(() => {
    const list = [];
    const radius = 105;
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = radius + (Math.sin(i * 3.7) * 10);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const height = 25 + (Math.sin(i * 2.1) * 0.5 + 0.5) * 35;
      const width = 5.0 + (Math.cos(i * 1.8) * 0.5 + 0.5) * 4.0;
      list.push({ x, z, height, width, id: i });
    }
    return list;
  }, []);

  // Floating ambient forensic dust particles spread across 200x200 area
  const particlePoints = useMemo(() => {
    const count = 400;
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      coords[i] = (Math.random() - 0.5) * 200;
      coords[i + 1] = 1.0 + Math.random() * 24;
      coords[i + 2] = (Math.random() - 0.5) * 200;
    }
    return coords;
  }, []);

  // Perimeter Crime Scene Barricade Posts around the arena
  const perimeterPosts = useMemo(() => {
    const posts = [];
    const radius = 78;
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      posts.push({ x, z, id: i });
    }
    return posts;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (centralRadarRef.current) {
      centralRadarRef.current.rotation.y = t * 0.4;
    }
    if (forensicRingsRef.current) {
      forensicRingsRef.current.rotation.y = -t * 0.25;
    }
  });

  return (
    <>
      {/* Sky & Soft Volumetric Fog (Vibrant tones, strictly non-black) */}
      <color attach="background" args={[theme.skyColor]} />
      <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />

      {/* Cinematic Forensics Studio Lighting */}
      <ambientLight intensity={theme.ambientLightIntensity * 1.6} color={theme.ambientLightColor} />
      <directionalLight
        position={[50, 75, 50]}
        intensity={theme.dirLightIntensity * 1.2}
        color={theme.dirLightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={220}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
      />
      <directionalLight
        position={[-50, 50, -50]}
        intensity={1.2}
        color={theme.spotLightColor}
      />

      {/* Central Forensic Spotlight */}
      <spotLight
        position={[0, 40, 0]}
        intensity={theme.spotLightIntensity * 1.2}
        color={theme.spotLightColor}
        angle={1.1}
        penumbra={0.8}
        distance={110}
      />
      <pointLight position={[0, 20, 0]} intensity={3.5} color={theme.roadColor} distance={90} />

      {/* Horizon Sky Panorama Dome (Scale: radius 135, height 80) */}
      <mesh position={[0, 25, 0]}>
        <cylinderGeometry args={[135, 135, 80, 40, 1, true]} />
        <meshBasicMaterial
          color={theme.skyHorizonColor}
          side={THREE.BackSide}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* ── BALANCED FORENSIC ARENA FLOOR (300 x 300) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color={theme.groundColor}
          roughness={0.35}
          metalness={0.65}
        />
      </mesh>

      {/* Forensic Plaza Center Radial Halo */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshBasicMaterial
          color={theme.roadColor}
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Concentric Forensic Scan Rings in Plaza Center */}
      <group position={[0, 0.04, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[12, 12.2, 64]} />
          <meshBasicMaterial color={theme.roadColor} transparent opacity={0.65} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[26, 26.25, 64]} />
          <meshBasicMaterial color={theme.roadTrimColor} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[48, 48.3, 64]} />
          <meshBasicMaterial color={theme.roadColor} transparent opacity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[75, 75.4, 64]} />
          <meshBasicMaterial color={theme.roadTrimColor} transparent opacity={0.25} />
        </mesh>
      </group>

      {/* ── CENTRAL FORENSIC COMMAND HUB & EVIDENCE BILLBOARD ── */}
      <group position={[0, 0, 0]}>
        {/* Central pedestal platform */}
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <cylinderGeometry args={[7.0, 7.8, 0.6, 8]} />
          <meshStandardMaterial
            color={theme.buildingBaseColor}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <mesh position={[0, 0.65, 0]} receiveShadow>
          <cylinderGeometry args={[5.2, 5.8, 0.4, 8]} />
          <meshStandardMaterial
            color={theme.roadTrimColor}
            emissive={theme.roadTrimColor}
            emissiveIntensity={0.3}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>

        {/* Central Forensic Radar Mast */}
        <group ref={centralRadarRef} position={[0, 1.0, 0]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.3, 0.45, 4.5, 8]} />
            <meshStandardMaterial color={theme.buildingBaseColor} roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 5.3, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshBasicMaterial color={theme.roadColor} />
          </mesh>
        </group>

        {/* Holographic Forensic Crime Scene Rings */}
        <group ref={forensicRingsRef} position={[0, 4.5, 0]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[3.2, 0.05, 8, 32]} />
            <meshBasicMaterial color={theme.roadColor} />
          </mesh>
          <mesh rotation={[-Math.PI / 4, 0, 0]}>
            <torusGeometry args={[3.8, 0.04, 8, 32]} />
            <meshBasicMaterial color={theme.roadTrimColor} />
          </mesh>
        </group>
      </group>

      {/* Building-to-center energy conduits live in <FloorConnections/> and
          appear only after each building's flag is accepted. */}

      {/* ── CRIME SCENE PERIMETER BARRICADE (OUTER ARENA RING) ── */}
      {perimeterPosts.map((post) => (
        <group key={`barrier-${post.id}`} position={[post.x, 0, post.z]}>
          {/* Barricade post */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 2.4, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Strobe Warning Light on Post — emissive glow only, no real
              light (a pointLight per post made every material in the scene
              evaluate 24 extra lights per fragment) */}
          <mesh position={[0, 2.4, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <sphereGeometry args={[0.45, 10, 10]} />
            <meshBasicMaterial
              color="#ef4444"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* Floating Holographic Crime Scene Perimeter Tape at North & South */}
      {[
        { x: 0, z: 98, rot: 0, text: '⚠️ CRITICAL FORENSIC INVESTIGATION ZONE — PRALAYA SECTOR LOCKDOWN ⚠️' },
        { x: 0, z: -98, rot: Math.PI, text: '⚠️ CIVIC EVIDENCE RESTRICTED BOUNDARY — AUTHORIZED PERSONNEL ONLY ⚠️' },
      ].map((banner, idx) => (
        <group key={`banner-${idx}`} position={[banner.x, 2.5, banner.z]} rotation={[0, banner.rot, 0]}>
          <mesh>
            <planeGeometry args={[42, 1.4]} />
            <meshBasicMaterial color="#eab308" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <Html center distanceFactor={35} position={[0, 0, 0.05]}>
            <div className="select-none font-mono text-[11px] font-black text-slate-900 tracking-widest whitespace-nowrap bg-amber-400 px-4 py-1 rounded shadow-lg border border-red-600">
              {banner.text}
            </div>
          </Html>
        </group>
      ))}

      {/* Floating Soft Forensic Bokeh Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePoints, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.35}
          color={theme.particleColor}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ── FAR PERIMETER BACKGROUND MONOLITHS (Pushed to radius 140) ── */}
      {backgroundMonoliths.map((b) => (
        <group key={b.id} position={[b.x, b.height / 2, b.z]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[b.width, b.height, b.width]} />
            <meshStandardMaterial
              color={theme.buildingBaseColor}
              roughness={0.3}
              metalness={0.7}
            />
          </mesh>
          {/* Luminous Glass Facade */}
          <mesh position={[0, 0, b.width / 2 + 0.05]}>
            <planeGeometry args={[b.width * 0.85, b.height * 0.9]} />
            <meshStandardMaterial
              color={theme.buildingGlassColor}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.35}
              emissive={theme.buildingGlassColor}
              emissiveIntensity={0.3}
            />
          </mesh>
          {/* Monolith Top Sensor Antenna */}
          <mesh position={[0, b.height / 2 + 1.5, 0]}>
            <cylinderGeometry args={[0.1, 0.2, 3.0, 6]} />
            <meshBasicMaterial color={theme.roadTrimColor} />
          </mesh>
        </group>
      ))}
    </>
  );
};
