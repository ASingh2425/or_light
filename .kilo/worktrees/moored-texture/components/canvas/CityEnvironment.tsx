'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { EVIDENCE_MARKERS } from '@/lib/arenaPositions';

export const CityEnvironment: React.FC = () => {
  const themePreset = useGameStore((state) => state.themePreset);
  const isUvLightActive = useGameStore((state) => state.isUvLightActive);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];
  const setSelectedEvidenceImage = useGameStore((state) => state.setSelectedEvidenceImage);

  const laserScanRef = useRef<THREE.Mesh>(null);
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
    if (laserScanRef.current) {
      laserScanRef.current.position.z = Math.sin(t * 0.5) * 45;
      laserScanRef.current.position.x = Math.cos(t * 0.3) * 15;
    }
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
          <mesh position={[0, 4.8, 0]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[1.6, 0.7, 16, 1, true]} />
            <meshStandardMaterial color={theme.roadTrimColor} emissive={theme.roadTrimColor} emissiveIntensity={0.4} wireframe />
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

        {/* ── 3D INTERACTIVE FORENSIC EVIDENCE BILLBOARD (WITH REAL IMAGE) ── */}
        <group position={[0, 7.5, -6]}>
          <Html center distanceFactor={28} zIndexRange={[50, 0]}>
            <div
              onClick={() => setSelectedEvidenceImage({
                url: '/images/techStack.jpeg',
                title: 'FORENSIC ARCHITECTURE & TECH STACK',
                subtitle: 'Investigation System Telemetry & Pipeline Overview'
              })}
              className="cursor-pointer transition-all duration-300 transform hover:scale-105 select-none p-3 rounded-2xl border-2 backdrop-blur-2xl text-center shadow-2xl min-w-[280px] max-w-[320px]"
              style={{
                background: theme.uiPanelBg,
                borderColor: theme.uiAccentHex,
                boxShadow: `0 0 35px ${theme.uiAccentHex}60`,
              }}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between px-1 pb-1.5 border-b border-white/20 mb-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-white flex items-center">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1.5" />
                  FORENSICS ZONE HQ
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-black">
                  CRIME SCENE #450
                </span>
              </div>

              {/* Forensic Evidence Image Preview */}
              <div className="relative rounded-lg overflow-hidden border border-white/30 group">
                <img
                  src="/images/techStack.jpeg"
                  alt="Forensic Architecture Tech Stack"
                  className="w-full h-36 object-cover filter contrast-125 transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-2">
                  <span className="text-[10px] font-mono text-cyan-300 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-400/40">
                    EVIDENCE INTEL
                  </span>
                  <span className="text-[9px] font-mono text-white bg-fuchsia-600/90 px-1.5 py-0.5 rounded">
                    CLICK TO ZOOM
                  </span>
                </div>
              </div>

              <div className="mt-2 text-left">
                <div className="text-xs font-bold text-white tracking-wide">
                  PRALAYA Protocol Forensic Spec
                </div>
                <div className="text-[10px] text-gray-200 font-mono mt-0.5">
                  Full 450 historical cohort regression architecture
                </div>
              </div>
            </div>
          </Html>
        </group>
      </group>

      {/* ── NUMBERED FORENSIC EVIDENCE MARKERS (CONES & SCAN PADS) ──
           Stationed 9 units in front of each sector from the real challenge
           coordinates (lib/arenaPositions.ts), the same source the minimap
           pins read, so the arena can be rescaled without desyncing them. */}
      {EVIDENCE_MARKERS.map((cone) => (
        <group key={cone.challengeId} position={[cone.x, 0, cone.z]}>
          {/* Ground Evidence Scan Circle */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.8, 24]} />
            <meshBasicMaterial color={theme.roadTrimColor} transparent opacity={0.25} />
          </mesh>
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.7, 1.85, 24]} />
            <meshBasicMaterial color={theme.roadColor} transparent opacity={0.8} />
          </mesh>

          {/* Forensic Evidence Marker Cone (Vibrant Safety Orange & White, NO BLACK) */}
          <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.45, 1.0, 16]} />
            <meshStandardMaterial
              color="#ff6600"
              roughness={0.3}
              metalness={0.2}
              emissive="#ff4400"
              emissiveIntensity={0.25}
            />
          </mesh>
          {/* Reflective white band on cone */}
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.32, 0.28, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Cone Base */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.9, 0.08, 0.9]} />
            <meshStandardMaterial color="#ff7700" roughness={0.4} metalness={0.2} />
          </mesh>

          {/* Vertical Forensic Evidence Tag */}
          <Html position={[0, 1.6, 0]} center distanceFactor={22}>
            <div
              onClick={() => setSelectedEvidenceImage({
                url: cone.imageUrl,
                title: `FORENSIC EVIDENCE TAG #${cone.num}`,
                subtitle: cone.label
              })}
              className="cursor-pointer select-none px-2 py-1 rounded bg-amber-400 text-slate-900 border border-white font-mono text-[9px] font-black shadow-lg hover:scale-110 transition-all flex items-center space-x-1"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block mr-1" />
              <span>[TAG #{cone.num}]</span>
              <span className="text-[8px] opacity-80 underline">VIEW</span>
            </div>
          </Html>

          {/* Evidence point light */}
          <pointLight position={[0, 1.0, 0]} color={theme.roadTrimColor} intensity={1.5} distance={6} />
        </group>
      ))}

      {/* ── EXPANDED WALKWAYS & FORENSIC CHEVRONS DIRECTLY TO DISTANT BUILDINGS ── */}
      {FORENSIC_CHALLENGES.map((bldg) => {
        const [bx, , bz] = bldg.coordinates;
        const length = Math.sqrt(bx * bx + bz * bz);
        const angle = Math.atan2(bx, bz);
        const midX = bx / 2;
        const midZ = bz / 2;

        return (
          <group key={`path-${bldg.id}`}>
            {/* Main Road Surface */}
            <mesh
              position={[midX, 0.05, midZ]}
              rotation={[-Math.PI / 2, 0, -angle]}
            >
              <planeGeometry args={[3.2, length]} />
              <meshBasicMaterial
                color={theme.roadColor}
                transparent
                opacity={0.22}
              />
            </mesh>

            {/* Glowing Neon Guide Curbs (Left & Right) */}
            <mesh
              position={[midX - 1.6 * Math.cos(angle), 0.07, midZ + 1.6 * Math.sin(angle)]}
              rotation={[-Math.PI / 2, 0, -angle]}
            >
              <planeGeometry args={[0.1, length]} />
              <meshBasicMaterial
                color={theme.roadTrimColor}
                transparent
                opacity={0.8}
              />
            </mesh>
            <mesh
              position={[midX + 1.6 * Math.cos(angle), 0.07, midZ - 1.6 * Math.sin(angle)]}
              rotation={[-Math.PI / 2, 0, -angle]}
            >
              <planeGeometry args={[0.1, length]} />
              <meshBasicMaterial
                color={theme.roadTrimColor}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Building Plaza Apron (Landing Zone) */}
            <mesh position={[bx, 0.06, bz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[8.5, 36]} />
              <meshBasicMaterial
                color={theme.roadColor}
                transparent
                opacity={0.16}
              />
            </mesh>
            <mesh position={[bx, 0.07, bz]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8.2, 8.5, 36]} />
              <meshBasicMaterial
                color={theme.roadTrimColor}
                transparent
                opacity={0.7}
              />
            </mesh>

            {/* Crime Scene Caution Stripes around Building Apron */}
            <mesh position={[bx, 0.08, bz]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[9.5, 9.8, 36]} />
              <meshBasicMaterial
                color="#facc15"
                transparent
                opacity={0.5}
              />
            </mesh>

            {/* Glowing UV Forensic Inspection Markings (Revealed only under UV Beam) */}
            {isUvLightActive && (
              <mesh position={[bx, 0.1, bz]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[4.0, 4.4, 32]} />
                <meshBasicMaterial color="#c084fc" transparent opacity={0.95} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* ── CRIME SCENE PERIMETER BARRICADE (OUTER ARENA RING) ── */}
      {perimeterPosts.map((post) => (
        <group key={`barrier-${post.id}`} position={[post.x, 0, post.z]}>
          {/* Barricade post */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 2.4, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Strobe Warning Light on Post */}
          <mesh position={[0, 2.4, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <pointLight position={[0, 2.4, 0]} color="#ef4444" intensity={0.8} distance={8} />
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

      {/* ── SWEEPING FORENSIC SCANNING LASER PLANE ── */}
      <mesh ref={laserScanRef} position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 2.5]} />
        <meshBasicMaterial
          color={theme.roadTrimColor}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

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
