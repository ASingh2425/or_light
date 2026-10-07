'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { ZOMBIE_COUNT, ZOMBIE_SOURCE_ID } from '@/lib/ruins';

/**
 * A horde that keeps pouring out of the infested sector's doorway, shambles
 * into the courtyard, mills about, then trudges back in. Purely decorative and
 * driven by the clock, so there is no per-zombie React state and no allocation
 * in the frame loop. Geometry and materials are shared by every zombie.
 */

function rand(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface ZombieSpec {
  period: number;
  offset: number;
  angle: number;      // walk-out bearing relative to the doorway direction
  dist: number;       // how far from the door it wanders
  sway: number;
  speed: number;
  scale: number;
  tint: number;
}

const DOOR_OFFSET = 4.1;

export const Zombies: React.FC = () => {
  const source = FORENSIC_CHALLENGES.find((c) => c.id === ZOMBIE_SOURCE_ID);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const legL = useRef<(THREE.Mesh | null)[]>([]);
  const legR = useRef<(THREE.Mesh | null)[]>([]);
  const armL = useRef<(THREE.Mesh | null)[]>([]);
  const armR = useRef<(THREE.Mesh | null)[]>([]);
  const doorGlow = useRef<THREE.PointLight>(null);

  const specs = useMemo<ZombieSpec[]>(
    () =>
      Array.from({ length: ZOMBIE_COUNT }, (_, i) => ({
        period: 24 + rand(i + 1) * 14,
        offset: (i / ZOMBIE_COUNT) * 30 + rand(i + 9) * 4,
        angle: (rand(i + 20) - 0.5) * 2.0,
        dist: 6 + rand(i + 40) * 9,
        sway: 0.5 + rand(i + 60) * 0.9,
        speed: 5 + rand(i + 80) * 3,
        scale: 0.9 + rand(i + 100) * 0.35,
        tint: rand(i + 120),
      })),
    []
  );

  const geo = useMemo(
    () => ({
      torso: new THREE.BoxGeometry(0.62, 0.8, 0.36),
      head: new THREE.BoxGeometry(0.42, 0.46, 0.42),
      // Limb geometry is shifted so its origin is the hip/shoulder: rotating
      // the mesh then swings it about the joint instead of its midpoint.
      limb: new THREE.BoxGeometry(0.2, 0.78, 0.2).translate(0, -0.39, 0),
      arm: new THREE.BoxGeometry(0.17, 0.74, 0.17).translate(0, -0.37, 0),
      eye: new THREE.BoxGeometry(0.08, 0.06, 0.04),
    }),
    []
  );
  const mats = useMemo(
    () => ({
      skin: [0x6f8f5c, 0x7c9a68, 0x5f7f55, 0x869f70].map(
        (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true })
      ),
      cloth: [0x2c2a2e, 0x3a2f2a, 0x24303a, 0x33382a].map(
        (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true })
      ),
      eye: new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
    }),
    []
  );

  const dir = useMemo(() => {
    if (!source) return { dx: 0, dz: 1, base: 0, cx: 0, cz: 0 };
    const [bx, , bz] = source.coordinates;
    const len = Math.hypot(bx, bz) || 1;
    const dx = -bx / len; // doorway faces the arena centre
    const dz = -bz / len;
    return { dx, dz, base: Math.atan2(dz, dx), cx: bx, cz: bz };
  }, [source]);

  useFrame((state) => {
    if (!source) return;
    const t = state.clock.getElapsedTime();

    if (doorGlow.current) {
      doorGlow.current.intensity = 2.2 + Math.sin(t * 7) * 0.6 + Math.sin(t * 13.3) * 0.4;
    }

    for (let i = 0; i < specs.length; i++) {
      const g = groupRefs.current[i];
      if (!g) continue;
      const s = specs[i];
      const u = ((t + s.offset) % s.period) / s.period;

      // Door position (start/end of every trip).
      const doorX = dir.cx + dir.dx * DOOR_OFFSET;
      const doorZ = dir.cz + dir.dz * DOOR_OFFSET;

      const bearing = dir.base + s.angle;
      const tx = doorX + Math.cos(bearing) * s.dist;
      const tz = doorZ + Math.sin(bearing) * s.dist;

      let x = doorX, z = doorZ, y = 0, heading = bearing, walking = 0;

      if (u < 0.1) {
        // Claw out of the doorway: rise from below the floor.
        const k = u / 0.1;
        y = -1.9 + k * 1.9;
        heading = dir.base + s.angle * 0.3;
        walking = 0.35;
      } else if (u < 0.5) {
        // Shamble out to the courtyard with a lurching sideways drift.
        const k = (u - 0.1) / 0.4;
        const e = k * k * (3 - 2 * k);
        x = doorX + (tx - doorX) * e;
        z = doorZ + (tz - doorZ) * e;
        const lat = Math.sin(k * Math.PI * 3 * s.sway) * 0.7 * (1 - k);
        x += -Math.sin(bearing) * lat;
        z += Math.cos(bearing) * lat;
        heading = bearing;
        walking = 1;
      } else if (u < 0.78) {
        // Mill about: slow wandering circle around the target.
        const k = (u - 0.5) / 0.28;
        const a0 = i * 1.3;
        const a = a0 + k * Math.PI * 2 * (i % 2 ? 1 : -1);
        const r = 1.1 + s.sway;
        // One full loop that starts and ends exactly on the target point, so
        // there is no teleport between the walk-out and the walk-back.
        x = tx + (Math.cos(a) - Math.cos(a0)) * r;
        z = tz + (Math.sin(a) - Math.sin(a0)) * r;
        heading = a + (i % 2 ? Math.PI / 2 : -Math.PI / 2);
        walking = 0.6;
      } else if (u < 0.94) {
        // Drag back towards the building.
        const k = (u - 0.78) / 0.16;
        const e = k * k * (3 - 2 * k);
        x = tx + (doorX - tx) * e;
        z = tz + (doorZ - tz) * e;
        heading = Math.atan2(doorZ - tz, doorX - tx);
        walking = 1;
      } else {
        // Slip back inside.
        const k = (u - 0.94) / 0.06;
        y = -k * 1.9;
        heading = Math.atan2(-dir.dz, -dir.dx);
        walking = 0.3;
      }
      g.visible = y > -1.85;
      g.position.set(x, y, z);
      g.rotation.y = -heading + Math.PI / 2;
      g.scale.setScalar(s.scale);
      // Stagger, lean and bob.
      const ph = t * s.speed + i * 1.7;
      g.rotation.z = Math.sin(ph * 0.5) * 0.08 * walking;
      g.rotation.x = 0.12 * walking;
      const swing = Math.sin(ph) * 0.7 * walking;
      const l = legL.current[i], r = legR.current[i], al = armL.current[i], ar = armR.current[i];
      if (l) l.rotation.x = swing;
      if (r) r.rotation.x = -swing;
      if (al) al.rotation.x = -1.35 + Math.sin(ph + 1) * 0.18;
      if (ar) ar.rotation.x = -1.2 + Math.sin(ph + 2) * 0.18;
    }
  });

  if (!source) return null;

  const [bx, , bz] = source.coordinates;
  const doorX = bx + dir.dx * DOOR_OFFSET;
  const doorZ = bz + dir.dz * DOOR_OFFSET;

  return (
    <group>
      {/* Breach glow in the doorway the horde pours out of. */}
      <pointLight ref={doorGlow} position={[doorX, 1.4, doorZ]} color="#7dff4a" intensity={2.5} distance={14} />
      <mesh position={[doorX, 0.04, doorZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 3.4, 24]} />
        <meshBasicMaterial color="#4cff2a" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>

      {specs.map((s, i) => {
        const skin = mats.skin[Math.floor(s.tint * 4) % 4];
        const cloth = mats.cloth[Math.floor(rand(i + 7) * 4) % 4];
        return (
          <group key={i} ref={(el) => { groupRefs.current[i] = el; }} visible={false}>
            {/* legs (pivot at hip) */}
            <mesh ref={(el) => { legL.current[i] = el; }} geometry={geo.limb} material={cloth} position={[-0.15, 0.8, 0]} />
            <mesh ref={(el) => { legR.current[i] = el; }} geometry={geo.limb} material={cloth} position={[0.15, 0.8, 0]} />
            {/* torso */}
            <mesh geometry={geo.torso} material={cloth} position={[0, 1.18, 0]} />
            {/* arms stretched forward */}
            <mesh ref={(el) => { armL.current[i] = el; }} geometry={geo.arm} material={skin} position={[-0.4, 1.55, 0]} />
            <mesh ref={(el) => { armR.current[i] = el; }} geometry={geo.arm} material={skin} position={[0.4, 1.55, 0]} />
            {/* head */}
            <mesh geometry={geo.head} material={skin} position={[0.02, 1.8, 0.02]} rotation={[0, 0, 0.18]} />
            <mesh geometry={geo.eye} material={mats.eye} position={[-0.09, 1.84, 0.23]} />
            <mesh geometry={geo.eye} material={mats.eye} position={[0.11, 1.84, 0.23]} />
          </group>
        );
      })}
    </group>
  );
};
