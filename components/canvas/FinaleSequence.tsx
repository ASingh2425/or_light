'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { FINALE_BEAM_DURATION, FINALE_TOTAL_DURATION } from '@/lib/constants';

const BEAM_COLOR = '#00ff88';
const GLOW_COLOR = '#00f0ff';
const CENTER = new THREE.Vector3(0, 8.5, 0);
const UP = new THREE.Vector3(0, 1, 0);

interface BeamTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const FinaleSequence: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);
  const beginFinaleRedirect = useGameStore((state) => state.beginFinaleRedirect);

  const beamRefs = useRef<Array<THREE.Mesh | null>>([]);
  const beamGlowRefs = useRef<Array<THREE.Mesh | null>>([]);
  const originSparkRefs = useRef<Array<THREE.Mesh | null>>([]);
  const coreSphereRef = useRef<THREE.Mesh>(null);
  const coreWireRef = useRef<THREE.Mesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const shockRingRefs = useRef<Array<THREE.Mesh | null>>([]);
  const haloAGroupRef = useRef<THREE.Group>(null);
  const haloBGroupRef = useRef<THREE.Group>(null);
  const columnGroupRef = useRef<THREE.Group>(null);
  const baseRingRef = useRef<THREE.Mesh>(null);

  // ── Circle ritual pieces (created per finale, disposed on idle unmount) ──
  const haloASegments = useMemo(() =>
    Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2;
      return { key: i, a, x: Math.sin(a) * 9.6, z: Math.cos(a) * 9.6 };
    })
  , []);
  const haloBSegments = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2;
      return { key: i, a, x: Math.sin(a) * 13.2, z: Math.cos(a) * 13.2 };
    })
  , []);
  const dashGeoA = useMemo(() => new THREE.BoxGeometry(1.05, 0.06, 0.2), []);
  const dashGeoB = useMemo(() => new THREE.BoxGeometry(2.3, 0.06, 0.26), []);
  const haloAMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: BEAM_COLOR, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  const haloBMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: GLOW_COLOR, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  const plazaRingMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: BEAM_COLOR, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  const columnMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: BEAM_COLOR, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  const columnCoreMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#eaffff', transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);
  const baseRingMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: GLOW_COLOR, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }), []);

  useEffect(() => () => {
    dashGeoA.dispose();
    dashGeoB.dispose();
    haloAMat.dispose();
    haloBMat.dispose();
    plazaRingMat.dispose();
    columnMat.dispose();
    columnCoreMat.dispose();
    baseRingMat.dispose();
  }, [dashGeoA, dashGeoB, haloAMat, haloBMat, plazaRingMat, columnMat, columnCoreMat, baseRingMat]);

  const elapsedRef = useRef(0);
  const redirectFiredRef = useRef(false);

  // Laser beams: one per building, anchored at the core top, converging on center
  const beams = useMemo<BeamTransform[]>(() =>
    FORENSIC_CHALLENGES.map((challenge) => {
      const start = new THREE.Vector3(challenge.coordinates[0], 7.4, challenge.coordinates[2]);
      const dir = CENTER.clone().sub(start);
      const length = dir.length();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
      const position = start.clone().add(CENTER).multiplyScalar(0.5);
      return { position, quaternion, length };
    })
  , []);

  useFrame((_, rawDelta) => {
    if (finaleState === 'idle') {
      elapsedRef.current = 0;
      redirectFiredRef.current = false;
      return;
    }
    if (finaleState === 'redirecting') return;

    const delta = Math.min(rawDelta, 0.05);
    const t = (elapsedRef.current += delta);
    // Final 0.8s flourish — blooms everything into the flash
    const lateFlare = clamp01((t - (FINALE_TOTAL_DURATION - 0.8)) / 0.8);

    // ── Phase A: beams grow toward center (staggered, eased) ─────────────
    beams.forEach((beam, i) => {
      const progress = easeOutCubic(clamp01((t - i * 0.16) / 1.1));
      const activeLength = Math.max(0.001, progress * beam.length);

      const beamMesh = beamRefs.current[i];
      if (beamMesh) {
        beamMesh.scale.set(1, activeLength, 1);
        const mat = beamMesh.material as THREE.MeshBasicMaterial;
        mat.opacity =
          (progress >= 1 ? 0.55 + 0.15 * Math.sin(t * 5 + i) : 0.95 * (0.4 + 0.6 * progress)) +
          (progress >= 1 ? lateFlare * 0.3 : 0);
      }
      const glowMesh = beamGlowRefs.current[i];
      if (glowMesh) {
        glowMesh.scale.set(1, activeLength, 1);
        const mat = glowMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.16 + 0.07 * Math.sin(t * 3.5 + i * 2);
      }
      const spark = originSparkRefs.current[i];
      if (spark) {
        const s = 1 + 0.3 * Math.sin(t * 8 + i);
        spark.scale.set(s, s, s);
      }
    });

    // ── Phase B: core bloom at the convergence point ─────────────────────
    const coreProgress = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 1.5));
    if (coreSphereRef.current) {
      const s = Math.max(0.001, coreProgress * 4.2 * (1 + lateFlare * 1.5));
      coreSphereRef.current.scale.set(s, s, s);
      const mat = coreSphereRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = coreProgress * (0.55 + 0.12 * Math.sin(t * 6)) + lateFlare * 0.3;
    }
    if (coreWireRef.current) {
      const s = Math.max(0.001, coreProgress * (5.2 + Math.sin(t * 2.2) * 0.4));
      coreWireRef.current.scale.set(s, s, s);
      coreWireRef.current.rotation.y = t * 0.9;
      coreWireRef.current.rotation.x = t * 0.5;
      const mat = coreWireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = coreProgress * 0.75;
    }
    if (flashLightRef.current) {
      flashLightRef.current.intensity = coreProgress * 45;
    }

    // ── Ground shockwave rings ───────────────────────────────────────────
    shockRingRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const localT = t - FINALE_BEAM_DURATION - 0.3 - i * 0.45;
      if (localT <= 0) {
        ring.scale.set(0.001, 0.001, 1);
        return;
      }
      const radius = localT * 30;
      ring.scale.set(radius, radius, 1);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - localT / 3.0);
    });

    // ── Phase D: circle ritual at the plaza (after beams converge) ───────
    const ritualA = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 0.8));
    if (haloAGroupRef.current) {
      haloAGroupRef.current.rotation.y = (t - FINALE_BEAM_DURATION) * 1.5;
      haloAGroupRef.current.scale.set(Math.max(0.001, ritualA), 1, Math.max(0.001, ritualA));
    }
    haloAMat.opacity = ritualA * (0.6 + 0.25 * Math.sin(t * 6));

    const ritualB = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.4) / 0.8));
    if (haloBGroupRef.current) {
      haloBGroupRef.current.rotation.y = -(t - FINALE_BEAM_DURATION - 0.4) * 1.0;
      haloBGroupRef.current.scale.set(Math.max(0.001, ritualB), 1, Math.max(0.001, ritualB));
    }
    haloBMat.opacity = ritualB * (0.5 + 0.2 * Math.sin(t * 5 + 1));

    const ritualRing = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.7) / 0.7));
    plazaRingMat.opacity = ritualRing * (0.45 + 0.2 * Math.sin(t * 7));

    const baseRingP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.5) / 0.6));
    if (baseRingRef.current) {
      baseRingRef.current.rotation.z = t * 0.9;
      const s = Math.max(0.001, baseRingP * (1 + 0.05 * Math.sin(t * 5)));
      baseRingRef.current.scale.set(s, s, s);
    }
    baseRingMat.opacity = baseRingP * (0.6 + 0.25 * Math.sin(t * 8));

    // Rising light column — swells right before the flash
    const columnP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.5) / 1.2));
    if (columnGroupRef.current) {
      columnGroupRef.current.scale.set(
        1 + lateFlare * 2.6,
        Math.max(0.001, columnP),
        1 + lateFlare * 2.6
      );
    }
    columnMat.opacity = columnP * (0.3 + 0.15 * Math.sin(t * 9)) + lateFlare * 0.55;
    columnCoreMat.opacity = columnP * 0.5 + lateFlare * 0.45;

    // ── Late flourish: everything blooms into the flash ───────────────────
    if (flashLightRef.current) {
      flashLightRef.current.intensity += lateFlare * 55;
    }

    // ── Phase C: hand off to the flash + redirect overlay ────────────────
    if (t >= FINALE_TOTAL_DURATION && !redirectFiredRef.current) {
      redirectFiredRef.current = true;
      beginFinaleRedirect();
    }
  });

  if (finaleState === 'idle') return null;

  return (
    <group>
      {/* ── 5 converging laser beams + glow shells ── */}
      {beams.map((beam, i) => (
        <group key={`beam-${i}`}>
          <mesh
            ref={(el) => { beamRefs.current[i] = el; }}
            position={beam.position}
            quaternion={beam.quaternion}
            scale={[1, 0.001, 1]}
          >
            <cylinderGeometry args={[0.14, 0.14, 1, 8]} />
            <meshBasicMaterial
              color={BEAM_COLOR}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            ref={(el) => { beamGlowRefs.current[i] = el; }}
            position={beam.position}
            quaternion={beam.quaternion}
            scale={[1, 0.001, 1]}
          >
            <cylinderGeometry args={[0.42, 0.42, 1, 8]} />
            <meshBasicMaterial
              color={GLOW_COLOR}
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Emission spark at the building end */}
          <mesh
            ref={(el) => { originSparkRefs.current[i] = el; }}
            position={[
              FORENSIC_CHALLENGES[i].coordinates[0],
              7.4,
              FORENSIC_CHALLENGES[i].coordinates[2],
            ]}
          >
            <sphereGeometry args={[0.55, 12, 12]} />
            <meshBasicMaterial
              color={GLOW_COLOR}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* ── Convergence core: solid + wireframe shells ── */}
      <mesh ref={coreSphereRef} position={CENTER} scale={0.001}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreWireRef} position={CENTER} scale={0.001}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color={BEAM_COLOR}
          wireframe
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Ground shockwave rings ── */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`shock-${i}`}
          ref={(el) => { shockRingRefs.current[i] = el; }}
          position={[0, 0.15 + i * 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.001}
        >
          <ringGeometry args={[0.96, 1, 64]} />
          <meshBasicMaterial
            color={i === 1 ? GLOW_COLOR : BEAM_COLOR}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ── Circle ritual: counter-rotating dashed halos on the plaza floor ── */}
      <group ref={haloAGroupRef} position={[0, 0.16, 0]} scale={0.001}>
        {haloASegments.map((s) => (
          <mesh
            key={`halo-a-${s.key}`}
            geometry={dashGeoA}
            material={haloAMat}
            position={[s.x, 0, s.z]}
            rotation={[0, s.a, 0]}
          />
        ))}
      </group>
      <group ref={haloBGroupRef} position={[0, 0.17, 0]} scale={0.001}>
        {haloBSegments.map((s) => (
          <mesh
            key={`halo-b-${s.key}`}
            geometry={dashGeoB}
            material={haloBMat}
            position={[s.x, 0, s.z]}
            rotation={[0, s.a, 0]}
          />
        ))}
      </group>

      {/* Full glowing circle that seals the ritual */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} material={plazaRingMat}>
        <ringGeometry args={[16.5, 16.9, 96]} />
      </mesh>

      {/* Ritual seal on the pedestal */}
      <mesh ref={baseRingRef} position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001} material={baseRingMat}>
        <ringGeometry args={[2.3, 2.6, 64]} />
      </mesh>

      {/* ── Rising light column (graceful hand-off into the flash) ── */}
      <group ref={columnGroupRef} position={[0, 0.6, 0]} scale={[1, 0.001, 1]}>
        <mesh material={columnMat} position={[0, 15, 0]}>
          <cylinderGeometry args={[1.4, 2.1, 30, 24, 1, true]} />
        </mesh>
        <mesh material={columnCoreMat} position={[0, 15, 0]}>
          <cylinderGeometry args={[0.5, 0.75, 30, 12, 1, true]} />
        </mesh>
      </group>

      {/* ── Explosion point light ── */}
      <pointLight ref={flashLightRef} position={CENTER} color="#ccffcc" intensity={0} distance={120} />
    </group>
  );
};
