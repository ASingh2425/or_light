'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RUIN_SITES } from '@/lib/ruins';

/**
 * Four clearly different wrecks for the post-war theme. They are decor only
 * (the car is pushed out of them via lib/ruins.ts) and use plain flat-shaded
 * materials with no shadows and no per-frame work, so they cost almost nothing
 * on an integrated GPU.
 */

function rand(seed: number) {
  const s = Math.sin(seed * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
}

const mat = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0.05, flatShading: true, ...extra });

/** Scattered chunks of debris around a point. */
const Rubble: React.FC<{ n: number; spread: number; seed: number; color: number; maxSize?: number }> = ({
  n, spread, seed, color, maxSize = 1.1,
}) => {
  const m = useMemo(() => mat(color), [color]);
  const g = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const pieces = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const a = rand(seed + i) * Math.PI * 2;
        const r = Math.sqrt(rand(seed + i + 50)) * spread;
        const sz = 0.25 + rand(seed + i + 90) * maxSize;
        return {
          x: Math.cos(a) * r, z: Math.sin(a) * r, sz,
          rx: rand(seed + i + 3) * 3, ry: rand(seed + i + 4) * 3, rz: rand(seed + i + 5) * 3,
          sy: 0.5 + rand(seed + i + 7) * 0.8,
        };
      }),
    [n, spread, seed, maxSize]
  );
  return (
    <group>
      {pieces.map((p, i) => (
        <mesh key={i} geometry={g} material={m} position={[p.x, p.sz * p.sy * 0.4, p.z]}
          rotation={[p.rx, p.ry, p.rz]} scale={[p.sz, p.sz * p.sy, p.sz * (0.7 + p.sy * 0.4)]} />
      ))}
    </group>
  );
};

const Rebar: React.FC<{ pos: [number, number, number]; tilt: [number, number, number]; len: number }> = ({ pos, tilt, len }) => (
  <mesh position={pos} rotation={tilt}>
    <cylinderGeometry args={[0.05, 0.05, len, 5]} />
    <meshStandardMaterial color={0x6b3a22} roughness={0.8} metalness={0.4} flatShading />
  </mesh>
);

// ───────────────────────── 1. Collapsed tower: snapped off, top section fallen ─────────────────────────
const CollapsedTower: React.FC = () => {
  const concrete = useMemo(() => mat(0x7a7d82), []);
  const dark = useMemo(() => mat(0x4a4d52), []);
  const glass = useMemo(() => mat(0x1a2a33, { emissive: 0x0a1a22, emissiveIntensity: 0.3 }), []);
  return (
    <group>
      {/* surviving stump with a jagged broken top */}
      <mesh material={concrete} position={[0, 4.5, 0]}><boxGeometry args={[4.6, 9, 4.6]} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} material={concrete} position={[-1.8 + i * 0.9, 9 + rand(i + 3) * 1.5, (rand(i + 9) - 0.5) * 3]}>
          <boxGeometry args={[0.9, 1 + rand(i + 5) * 2, 1.2 + rand(i + 2)]} />
        </mesh>
      ))}
      {/* window bands (dark glass strips) */}
      {[1.5, 3.5, 5.5, 7.5].map((y) => (
        <mesh key={y} material={glass} position={[0, y, 2.32]}><boxGeometry args={[3.8, 0.9, 0.1]} /></mesh>
      ))}
      {/* the fallen top section, leaning on the rubble */}
      <group position={[3.6, 1.7, 2.2]} rotation={[0.1, -0.5, 1.15]}>
        <mesh material={dark}><boxGeometry args={[4.4, 7.5, 4.4]} /></mesh>
        {[-2.6, -0.9, 0.8, 2.5].map((y) => (
          <mesh key={y} material={glass} position={[0, y, 2.22]}><boxGeometry args={[3.6, 0.8, 0.1]} /></mesh>
        ))}
      </group>
      <Rebar pos={[-1.2, 10.4, 0.6]} tilt={[0.2, 0, 0.3]} len={3.2} />
      <Rebar pos={[0.8, 10.8, -0.4]} tilt={[-0.3, 0, -0.2]} len={3.8} />
      <Rebar pos={[1.6, 10.0, 1.0]} tilt={[0.1, 0, 0.5]} len={2.6} />
      <Rubble n={26} spread={6} seed={11} color={0x666a70} />
    </group>
  );
};

// ───────────────────────── 2. Gutted apartment shell: open floors, burnt out ─────────────────────────
const GuttedShell: React.FC = () => {
  const wall = useMemo(() => mat(0x4b423c), []);
  const slab = useMemo(() => mat(0x38322e), []);
  const soot = useMemo(() => mat(0x1c1917), []);
  const floors = [0, 3.2, 6.4];
  return (
    <group>
      {floors.map((y, i) => (
        <mesh key={y} material={slab} position={[0, y + 0.15, 0]} rotation={[i === 2 ? 0.14 : 0, 0, i === 1 ? -0.06 : 0]}>
          <boxGeometry args={[7, 0.3, 5.2]} />
        </mesh>
      ))}
      {/* corner columns, one of them snapped */}
      {[[-3.3, -2.4], [3.3, -2.4], [-3.3, 2.4]].map(([x, z], i) => (
        <mesh key={i} material={wall} position={[x, 4.7, z]}><boxGeometry args={[0.5, 9.4, 0.5]} /></mesh>
      ))}
      <mesh material={wall} position={[3.3, 2.2, 2.4]}><boxGeometry args={[0.5, 4.4, 0.5]} /></mesh>
      {/* back wall with window holes (built from pieces) */}
      {floors.map((y) => (
        <group key={`bw${y}`} position={[0, y + 1.6, -2.45]}>
          <mesh material={wall} position={[-2.35, 0, 0]}><boxGeometry args={[2.2, 2.9, 0.3]} /></mesh>
          <mesh material={wall} position={[2.35, 0, 0]}><boxGeometry args={[2.2, 2.9, 0.3]} /></mesh>
          <mesh material={wall} position={[0, 1.05, 0]}><boxGeometry args={[2.6, 0.8, 0.3]} /></mesh>
          <mesh material={wall} position={[0, -1.1, 0]}><boxGeometry args={[2.6, 0.7, 0.3]} /></mesh>
        </group>
      ))}
      {/* left side wall only on the bottom two floors */}
      {[0, 3.2].map((y) => (
        <mesh key={`sw${y}`} material={wall} position={[-3.45, y + 1.6, 0]}><boxGeometry args={[0.3, 2.9, 4.4]} /></mesh>
      ))}
      {/* soot stains and a collapsed slab leaning on the open front */}
      <mesh material={soot} position={[0, 7, -2.28]}><boxGeometry args={[3, 2.4, 0.05]} /></mesh>
      <mesh material={slab} position={[2.6, 2.2, 3.4]} rotation={[0.9, 0.2, 0]}><boxGeometry args={[4.6, 0.3, 4.4]} /></mesh>
      {/* embers glowing inside the burnt floors */}
      <mesh position={[0.6, 0.4, 0.5]}><sphereGeometry args={[0.28, 8, 8]} /><meshBasicMaterial color="#ff6a00" /></mesh>
      <mesh position={[-1.2, 3.6, -0.4]}><sphereGeometry args={[0.2, 8, 8]} /><meshBasicMaterial color="#ff9a30" /></mesh>
      <Rubble n={22} spread={6.2} seed={31} color={0x4d4540} maxSize={0.9} />
    </group>
  );
};

// ───────────────────────── 3. Cracked silo + toppled smokestack: rusted industrial wreck ─────────────────────────
const CrackedSilo: React.FC = () => {
  const rust = useMemo(() => mat(0x8a4f2e, { side: THREE.DoubleSide }), []);
  const rustDark = useMemo(() => mat(0x5a331d), []);
  const steel = useMemo(() => mat(0x6b6f73), []);
  return (
    <group>
      {/* silo with a wedge torn out of it (open-ended, partial arc) */}
      <mesh material={rust} position={[-1.2, 3.6, 0]}>
        <cylinderGeometry args={[2.7, 2.9, 7.2, 14, 1, true, 0.7, Math.PI * 1.55]} />
      </mesh>
      <mesh material={rustDark} position={[-1.2, 0.1, 0]}><cylinderGeometry args={[3.0, 3.1, 0.3, 14]} /></mesh>
      {/* ribs and a half-collapsed roof cap */}
      {[1.5, 3.7, 5.9].map((y) => (
        <mesh key={y} position={[-1.2, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.85, 0.07, 6, 18, Math.PI * 1.55]} />
          <meshStandardMaterial color={0x3b2a1f} roughness={1} />
        </mesh>
      ))}
      <mesh material={rustDark} position={[0.6, 7.4, 0.8]} rotation={[0.5, 0, 0.6]}>
        <coneGeometry args={[2.2, 1.1, 10, 1, true, 0, Math.PI]} />
      </mesh>
      {/* toppled smokestack lying across the ground, broken into sections */}
      <mesh material={steel} position={[2.6, 0.85, 3.6]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.85, 1.0, 6.2, 12]} />
      </mesh>
      <mesh material={steel} position={[6.1, 0.8, 6.2]} rotation={[0.1, 0.55, Math.PI / 2 + 0.06]}>
        <cylinderGeometry args={[0.75, 0.85, 3.0, 12]} />
      </mesh>
      <mesh position={[0.1, 0.87, 2.9]} rotation={[0, 0.5, Math.PI / 2]}>
        <cylinderGeometry args={[0.7, 0.7, 0.4, 12]} />
        <meshStandardMaterial color={0xfacc15} roughness={0.7} />
      </mesh>
      {/* tangled pipes */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={steel} position={[-3.9, 0.5 + i * 0.5, 1.8 - i * 0.7]} rotation={[0.2 * i, 0.5 * i, Math.PI / 2 - 0.2 * i]}>
          <cylinderGeometry args={[0.16, 0.16, 3 + i, 6]} />
        </mesh>
      ))}
      <Rubble n={14} spread={6} seed={47} color={0x6a4a38} maxSize={0.7} />
    </group>
  );
};

// ───────────────────────── 4. Quarantine wing: sector monolith blown apart ─────────────────────────
const QuarantineWreck: React.FC = () => {
  const char = useMemo(() => mat(0x2f2b28), []);
  const concrete = useMemo(() => mat(0x5f5c56), []);
  const steel = useMemo(() => mat(0x6b6f73), []);
  const glass = useMemo(() => mat(0x10161b, { emissive: 0x06101a, emissiveIntensity: 0.25 }), []);
  const hazard = useMemo(() => mat(0x8a6a12, { side: THREE.DoubleSide }), []);
  return (
    <group>
      {/* scorched hexagonal sector base */}
      <mesh material={concrete} position={[0, 0.25, 0]}>
        <cylinderGeometry args={[5.6, 6.4, 0.5, 6]} />
      </mesh>
      <mesh material={char} position={[0, 0.55, 0]} rotation={[0, 0.18, 0]}>
        <cylinderGeometry args={[4.4, 5.0, 0.3, 6]} />
      </mesh>

      {/* the monolith core, snapped at the waist and pitched over */}
      <group position={[1.2, 1.4, 0.6]} rotation={[0.32, -0.5, 0.62]}>
        <mesh material={char} position={[0, 2.8, 0]}>
          <cylinderGeometry args={[3.0, 3.5, 5.4, 6]} />
        </mesh>
        {/* jagged fracture teeth where it snapped */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh
              key={i}
              material={concrete}
              position={[Math.cos(a) * 2.3, 5.6 + rand(i + 4) * 0.7, Math.sin(a) * 2.3]}
              rotation={[rand(i) * 0.6, -a, rand(i + 2) * 0.4]}
            >
              <boxGeometry args={[1.1, 1.4 + rand(i + 6) * 1.2, 1.3]} />
            </mesh>
          );
        })}
        {/* dead data strips, most of the glass gone */}
        {[1.4, 3.0, 4.6].map((y) => (
          <mesh key={y} material={glass} position={[0, y, 2.95]}>
            <boxGeometry args={[2.6, 0.7, 0.12]} />
          </mesh>
        ))}
      </group>

      {/* severed stump of the core still bolted to the platform */}
      <mesh material={concrete} position={[-1.6, 1.15, -1.0]} rotation={[0, 0.4, 0]}>
        <cylinderGeometry args={[2.4, 3.0, 1.5, 6]} />
      </mesh>

      {/* hazard ring, half buried and torn open */}
      <mesh material={hazard} position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <ringGeometry args={[5.9, 6.3, 32, 1, 0, Math.PI * 1.15]} />
      </mesh>

      {/* toppled beacon mast */}
      <mesh material={steel} position={[-2.8, 0.75, 3.4]} rotation={[0.2, 0.7, Math.PI / 2 - 0.25]}>
        <cylinderGeometry args={[0.16, 0.22, 5.5, 6]} />
      </mesh>
      <mesh position={[-5.1, 1.0, 4.7]} rotation={[0.4, 0.2, 0.5]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color={0x3f3a33} roughness={1} flatShading />
      </mesh>

      {/* snapped energy pylons */}
      {[0, 1].map((i) => (
        <mesh
          key={i}
          material={steel}
          position={[i === 0 ? 4.4 : -3.7, 1.0, i === 0 ? -3.2 : 4.1]}
          rotation={[0.15 * (i + 1), 0.8 * i, 0.5]}
        >
          <cylinderGeometry args={[0.2, 0.28, 3.2, 6]} />
        </mesh>
      ))}

      <Rebar pos={[1.9, 6.6, 1.2]} tilt={[0.3, 0, 0.4]} len={3.0} />
      <Rebar pos={[0.4, 7.0, -1.4]} tilt={[-0.25, 0, -0.3]} len={3.4} />
      <Rubble n={30} spread={6.6} seed={63} color={0x55524b} />
    </group>
  );
};

const RUIN_VIEWS: Record<string, { node: React.ReactNode; rotY: number }> = {
  'ruin-tower': { node: <CollapsedTower />, rotY: 0.6 },
  'ruin-shell': { node: <GuttedShell />, rotY: -0.5 },
  'ruin-silo': { node: <CrackedSilo />, rotY: 2.3 },
  'ruin-quarantine': { node: <QuarantineWreck />, rotY: -1.1 },
};

export const RuinedBuildings: React.FC = () => (
  <group>
    {RUIN_SITES.map((site) => (
      <group key={site.id} position={[site.x, 0, site.z]} rotation={[0, RUIN_VIEWS[site.id].rotY, 0]}>
        {RUIN_VIEWS[site.id].node}
      </group>
    ))}
  </group>
);
