'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';

/**
 * Building → plaza energy conduits.
 *
 * There are NO static roads on the arena floor: a conduit only exists for a
 * building whose flag has been accepted. On clearance it draws itself in from
 * the building edge toward the central pedestal, then keeps a steady flow of
 * data pulses travelling inward. During the finale the pulses surge so every
 * cleared lane visibly drains into the plaza right before the circle ritual.
 */

const LANE_Y = 0.12;
const BUILDING_ANCHOR = 7.6; // distance from building center
const PLAZA_ANCHOR = 8.6; // distance from plaza center
const PULSES_PER_PATH = 4;
const PULSE_SPEED_IDLE = 0.22; // laps / second
const PULSE_SPEED_FINALE = 1.5; // laps / second during the exit sequence

interface ConduitPath {
  id: string;
  sx: number;
  sz: number;
  dx: number; // normalized, building → center
  dz: number;
  length: number;
  rotZ: number; // plane Euler z so local +Y follows (dx, dz)
}

const makeRibbonTexture = (): THREE.Texture | null => {
  if (typeof document === 'undefined') return null;
  const w = 32;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1); // 0 = building end, 1 = plaza end
    const along = 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * v), 0.6);
    for (let x = 0; x < w; x++) {
      const nx = x / (w - 1);
      const edge = Math.pow(Math.sin(Math.PI * nx), 1.6);
      const a = Math.round(255 * Math.min(1, edge * along));
      const i = (y * w + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

const makeGlowTexture = (): THREE.Texture | null => {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

export const FloorConnections: React.FC = () => {
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const paths = useMemo<ConduitPath[]>(() =>
    FORENSIC_CHALLENGES.map((ch) => {
      const [bx, , bz] = ch.coordinates;
      const dist = Math.hypot(bx, bz);
      const dx = -bx / dist;
      const dz = -bz / dist;
      const sx = bx + dx * BUILDING_ANCHOR;
      const sz = bz + dz * BUILDING_ANCHOR;
      const length = dist - BUILDING_ANCHOR - PLAZA_ANCHOR;
      return {
        id: ch.id,
        sx,
        sz,
        dx,
        dz,
        length,
        rotZ: Math.atan2(-dx, -dz),
      };
    })
  , []);

  const ribbonTex = useMemo(makeRibbonTexture, []);
  const glowTex = useMemo(makeGlowTexture, []);

  const ribbonRefs = useRef<Array<THREE.Mesh | null>>([]);
  const coreRefs = useRef<Array<THREE.Mesh | null>>([]);
  const startNodeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const endNodeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);

  // Draw-in progress per path (1 = fully drawn). Starts hidden; grows once
  // the building's flag is accepted.
  const progressRef = useRef<Record<string, number>>(
    Object.fromEntries(FORENSIC_CHALLENGES.map((c) => [c.id, 0]))
  );

  useFrame((state, rawDelta) => {
    const t = state.clock.getElapsedTime();
    const delta = Math.min(rawDelta, 0.05);
    const cleared = useGameStore.getState().clearedBuildingIds;
    const finaleActive = useGameStore.getState().finaleState !== 'idle';

    paths.forEach((path, i) => {
      const target = cleared.includes(path.id) ? 1 : 0;
      const pRef = progressRef.current;
      const current = pRef[path.id] ?? 0;
      const p = target === current ? current : current + (target - current) * (1 - Math.exp(-delta * 4.2));
      pRef[path.id] = p > 0.999 && target === 1 ? 1 : p;

      const drawn = Math.max(0.001, p * path.length);
      const midX = path.sx + path.dx * drawn * 0.5;
      const midZ = path.sz + path.dz * drawn * 0.5;

      const flow = finaleActive ? 1 : 0;
      const ribbon = ribbonRefs.current[i];
      if (ribbon) {
        ribbon.scale.set(1, drawn, 1);
        ribbon.position.set(midX, LANE_Y, midZ);
        const mat = ribbon.material as THREE.MeshBasicMaterial;
        const idle = 0.4 + 0.1 * Math.sin(t * 2.2 + i * 1.7);
        mat.opacity = p * (idle + flow * (0.35 + 0.2 * Math.sin(t * 9)));
      }
      const core = coreRefs.current[i];
      if (core) {
        core.scale.set(1, drawn, 1);
        core.position.set(midX, LANE_Y + 0.02, midZ);
        const mat = core.material as THREE.MeshBasicMaterial;
        const idle = 0.7 + 0.15 * Math.sin(t * 3 + i);
        mat.opacity = p * (idle + flow * (0.3 + 0.25 * Math.sin(t * 11 + i)));
      }

      // Building-side anchor node
      const startNode = startNodeRefs.current[i];
      if (startNode) {
        const mat = startNode.material as THREE.MeshBasicMaterial;
        mat.opacity = p * (0.5 + 0.18 * Math.sin(t * 3.4 + i * 2));
        const s = p * (1 + 0.08 * Math.sin(t * 4 + i));
        startNode.scale.set(s, s, s);
      }

      // Plaza-side landing node (only once the conduit reaches the pedestal)
      const endNode = endNodeRefs.current[i];
      if (endNode) {
        const ex = -path.dx * PLAZA_ANCHOR;
        const ez = -path.dz * PLAZA_ANCHOR;
        endNode.position.set(ex, LANE_Y + 0.01, ez);
        const reach = Math.max(0, (p - 0.85) / 0.15);
        const mat = endNode.material as THREE.MeshBasicMaterial;
        mat.opacity = reach * (0.55 + 0.2 * Math.sin(t * 5 + i));
      }

      // Travelling data pulses (building → center)
      const speed = finaleActive ? PULSE_SPEED_FINALE : PULSE_SPEED_IDLE;
      for (let k = 0; k < PULSES_PER_PATH; k++) {
        const idx = i * PULSES_PER_PATH + k;
        const pulse = pulseRefs.current[idx];
        if (!pulse) continue;
        if (p < 0.35) {
          (pulse.material as THREE.MeshBasicMaterial).opacity = 0;
          continue;
        }
        const phase = (t * speed + k / PULSES_PER_PATH + i * 0.19) % 1;
        const d = phase * drawn;
        pulse.position.set(path.sx + path.dx * d, LANE_Y + 0.05, path.sz + path.dz * d);
        const mat = pulse.material as THREE.MeshBasicMaterial;
        mat.opacity = p * Math.sin(Math.PI * phase) * (finaleActive ? 1 : 0.85);
        const s = (finaleActive ? 1.35 : 1) * (0.75 + 0.3 * Math.sin(phase * Math.PI));
        pulse.scale.set(s, s, s);
      }
    });
  });

  useEffectCleanup(ribbonTex, glowTex);

  return (
    <group>
      {paths.map((path, i) => (
        <group key={`conduit-${path.id}`}>
          {/* Soft outer ribbon */}
          <mesh
            ref={(el) => { ribbonRefs.current[i] = el; }}
            position={[path.sx, LANE_Y, path.sz]}
            rotation={[-Math.PI / 2, 0, path.rotZ]}
            scale={[1, 0.001, 1]}
          >
            <planeGeometry args={[1.9, 1]} />
            <meshBasicMaterial
              color={theme.roadTrimColor}
              map={ribbonTex ?? undefined}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Bright core filament */}
          <mesh
            ref={(el) => { coreRefs.current[i] = el; }}
            position={[path.sx, LANE_Y + 0.02, path.sz]}
            rotation={[-Math.PI / 2, 0, path.rotZ]}
            scale={[1, 0.001, 1]}
          >
            <planeGeometry args={[0.34, 1]} />
            <meshBasicMaterial
              color={theme.roadColor}
              map={ribbonTex ?? undefined}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Building-side anchor node */}
          <mesh
            ref={(el) => { startNodeRefs.current[i] = el; }}
            position={[path.sx, LANE_Y + 0.03, path.sz]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={0.001}
          >
            <circleGeometry args={[2.1, 32]} />
            <meshBasicMaterial
              color={theme.buildingClearedColor}
              map={glowTex ?? undefined}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Plaza-side landing node (on the pedestal rim) */}
          <mesh
            ref={(el) => { endNodeRefs.current[i] = el; }}
            position={[0, LANE_Y + 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={0.001}
          >
            <circleGeometry args={[1.5, 28]} />
            <meshBasicMaterial
              color={theme.buildingClearedColor}
              map={glowTex ?? undefined}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Travelling pulses */}
          {Array.from({ length: PULSES_PER_PATH }, (_, k) => (
            <mesh
              key={`pulse-${path.id}-${k}`}
              ref={(el) => { pulseRefs.current[i * PULSES_PER_PATH + k] = el; }}
              position={[path.sx, LANE_Y + 0.05, path.sz]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={0.001}
            >
              <circleGeometry args={[0.95, 20]} />
              <meshBasicMaterial
                color={theme.buildingClearedColor}
                map={glowTex ?? undefined}
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

// Texture disposal without violating hook ordering rules
function useEffectCleanup(...textures: Array<THREE.Texture | null>) {
  React.useEffect(() => () => {
    textures.forEach((tex) => tex?.dispose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
