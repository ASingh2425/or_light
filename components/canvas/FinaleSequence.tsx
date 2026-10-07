'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { ACTIVE_CHALLENGES } from '@/lib/challenges';
import { FINALE_BEAM_DURATION, FINALE_TOTAL_DURATION } from '@/lib/constants';

const BEAM_COLOR = '#00ff88';
const GLOW_COLOR = '#00f0ff';
const CENTER = new THREE.Vector3(0, 8.5, 0);
const UP = new THREE.Vector3(0, 1, 0);

const PULSES_PER_RAY = 3;
// Tower roofs top out at y≈9.05 (Building3D), so arcs launch just above them
const AIR_BEAM_Y = 9.4;
const GROUND_RAY_Y = 0.28;
const ARC_APEX = 17;

interface AirRay {
  curve: THREE.QuadraticBezierCurve3;
  start: THREE.Vector3;
  coreGeo: THREE.TubeGeometry;
  glowGeo: THREE.TubeGeometry;
  coreCount: number;
  glowCount: number;
  coreMat: THREE.MeshBasicMaterial;
  glowMat: THREE.MeshBasicMaterial;
}

interface GroundRay {
  start: THREE.Vector3;
  dir: THREE.Vector3;
  length: number;
  quaternion: THREE.Quaternion;
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const makeGroundRay = (from: THREE.Vector3, to: THREE.Vector3): GroundRay => {
  const dir = to.clone().sub(from);
  const length = dir.length();
  const unit = dir.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, unit);
  return { start: from.clone(), dir: unit, length, quaternion };
};

const additiveMat = (color: string) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

export const FinaleSequence: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);
  const beginFinaleRedirect = useGameStore((state) => state.beginFinaleRedirect);

  const airSparkRefs = useRef<Array<THREE.Mesh | null>>([]);
  const airPulseRefs = useRef<Array<THREE.Mesh | null>>([]);
  const groundCoreRefs = useRef<Array<THREE.Mesh | null>>([]);
  const groundGlowRefs = useRef<Array<THREE.Mesh | null>>([]);
  const groundPulseRefs = useRef<Array<THREE.Mesh | null>>([]);
  const coreSphereRef = useRef<THREE.Mesh>(null);
  const coreWireRef = useRef<THREE.Mesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);
  const shockRingRefs = useRef<Array<THREE.Mesh | null>>([]);
  const haloAGroupRef = useRef<THREE.Group>(null);
  const haloBGroupRef = useRef<THREE.Group>(null);
  const columnGroupRef = useRef<THREE.Group>(null);
  const baseRingRef = useRef<THREE.Mesh>(null);
  const portalRingRef = useRef<THREE.Mesh>(null);
  const crossFlareRef = useRef<THREE.Group>(null);

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
  const haloAMat = useMemo(() => additiveMat(BEAM_COLOR), []);
  const haloBMat = useMemo(() => additiveMat(GLOW_COLOR), []);
  const plazaRingMat = useMemo(() => additiveMat(BEAM_COLOR), []);
  const columnMat = useMemo(() => additiveMat(BEAM_COLOR), []);
  const columnCoreMat = useMemo(() => additiveMat('#eaffff'), []);
  const baseRingMat = useMemo(() => additiveMat(GLOW_COLOR), []);
  const portalRingMat = useMemo(() => additiveMat('#ffffff'), []);
  const crossFlareMat = useMemo(() => additiveMat('#dffff2'), []);

  // ── Air rays: arcs that leave every tower roof and meet at the core ─────
  const airRays = useMemo<AirRay[]>(() =>
    ACTIVE_CHALLENGES.map((challenge) => {
      const start = new THREE.Vector3(challenge.coordinates[0], AIR_BEAM_Y, challenge.coordinates[2]);
      const mid = start.clone().add(CENTER).multiplyScalar(0.5);
      mid.y = ARC_APEX;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, CENTER.clone());
      const coreGeo = new THREE.TubeGeometry(curve, 56, 0.3, 8, false);
      const glowGeo = new THREE.TubeGeometry(curve, 56, 0.95, 10, false);
      const coreCount = coreGeo.index?.count ?? 0;
      const glowCount = glowGeo.index?.count ?? 0;
      coreGeo.setDrawRange(0, 0);
      glowGeo.setDrawRange(0, 0);
      return {
        curve,
        start,
        coreGeo,
        glowGeo,
        coreCount,
        glowCount,
        coreMat: additiveMat(BEAM_COLOR),
        glowMat: additiveMat(GLOW_COLOR),
      };
    })
  , []);

  // ── Ground rays: floor-level conduits racing the same convergence ───────
  const groundRays = useMemo<GroundRay[]>(() =>
    ACTIVE_CHALLENGES.map((challenge) =>
      makeGroundRay(
        new THREE.Vector3(challenge.coordinates[0], GROUND_RAY_Y, challenge.coordinates[2]),
        new THREE.Vector3(0, GROUND_RAY_Y, 0)
      )
    )
  , []);

  useEffect(() => () => {
    dashGeoA.dispose();
    dashGeoB.dispose();
    haloAMat.dispose();
    haloBMat.dispose();
    plazaRingMat.dispose();
    columnMat.dispose();
    columnCoreMat.dispose();
    baseRingMat.dispose();
    portalRingMat.dispose();
    crossFlareMat.dispose();
    airRays.forEach((ray) => {
      ray.coreGeo.dispose();
      ray.glowGeo.dispose();
      ray.coreMat.dispose();
      ray.glowMat.dispose();
    });
  }, [dashGeoA, dashGeoB, haloAMat, haloBMat, plazaRingMat, columnMat, columnCoreMat, baseRingMat, portalRingMat, crossFlareMat, airRays]);

  const elapsedRef = useRef(0);
  const redirectFiredRef = useRef(false);

  const placeGroundRay = (
    ray: GroundRay,
    core: THREE.Mesh | null,
    glow: THREE.Mesh | null,
    progress: number
  ) => {
    const activeLength = Math.max(0.001, progress * ray.length);
    const cx = ray.start.x + ray.dir.x * activeLength * 0.5;
    const cy = ray.start.y + ray.dir.y * activeLength * 0.5;
    const cz = ray.start.z + ray.dir.z * activeLength * 0.5;
    if (core) {
      core.position.set(cx, cy, cz);
      core.scale.set(1, activeLength, 1);
    }
    if (glow) {
      glow.position.set(cx, cy, cz);
      glow.scale.set(1, activeLength, 1);
    }
    return activeLength;
  };

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

    // ── Phase A: arcs grow out of every tower toward the core ─────────────
    airRays.forEach((ray, i) => {
      const progress = easeOutCubic(clamp01((t - i * 0.16) / 1.1));
      ray.coreGeo.setDrawRange(0, Math.floor(ray.coreCount * progress));
      ray.glowGeo.setDrawRange(0, Math.floor(ray.glowCount * progress));

      ray.coreMat.opacity =
        (progress >= 1 ? 0.7 + 0.15 * Math.sin(t * 5 + i) : 1.0 * (0.45 + 0.55 * progress)) +
        (progress >= 1 ? lateFlare * 0.3 : 0);
      ray.glowMat.opacity = 0.2 + 0.08 * Math.sin(t * 3.5 + i * 2) + lateFlare * 0.2;

      const spark = airSparkRefs.current[i];
      if (spark) {
        const s = 1 + 0.3 * Math.sin(t * 8 + i);
        spark.scale.set(s, s, s);
        const mat = spark.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.85 + lateFlare * 0.15;
      }

      // Energy packets riding the arc from tower to core
      for (let k = 0; k < PULSES_PER_RAY; k++) {
        const mesh = airPulseRefs.current[i * PULSES_PER_RAY + k];
        if (!mesh) continue;
        const phase = (t * 0.9 + k / PULSES_PER_RAY + i * 0.13) % 1;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (phase > progress) {
          mat.opacity = 0;
          continue;
        }
        const point = ray.curve.getPoint(phase);
        mesh.position.copy(point);
        mat.opacity = 0.35 + 0.55 * Math.abs(Math.sin(t * 9 + k * 1.7));
        const s = 1 + 0.35 * Math.sin(t * 12 + k);
        mesh.scale.set(s, s, s);
      }
    });

    // ── Ground rays: floor conduits racing the same convergence ───────────
    groundRays.forEach((ray, i) => {
      const progress = easeOutCubic(clamp01((t - 0.15 - i * 0.16) / 1.0));
      const activeLength = placeGroundRay(ray, groundCoreRefs.current[i], groundGlowRefs.current[i], progress);

      const core = groundCoreRefs.current[i];
      if (core) {
        const mat = core.material as THREE.MeshBasicMaterial;
        mat.opacity = (progress >= 1 ? 0.5 + 0.12 * Math.sin(t * 4 + i) : 0.9 * progress) + lateFlare * 0.3;
      }
      const glow = groundGlowRefs.current[i];
      if (glow) {
        const mat = glow.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.14 + 0.06 * Math.sin(t * 3 + i * 1.5);
      }

      for (let k = 0; k < PULSES_PER_RAY; k++) {
        const mesh = groundPulseRefs.current[i * PULSES_PER_RAY + k];
        if (!mesh) continue;
        const phase = (t * 0.95 + k / PULSES_PER_RAY + 0.4 + i * 0.11) % 1;
        const along = phase * activeLength;
        mesh.position.set(
          ray.start.x + ray.dir.x * along,
          ray.start.y + ray.dir.y * along,
          ray.start.z + ray.dir.z * along
        );
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = progress <= 0.08 ? 0 : 0.35 + 0.55 * Math.abs(Math.sin(t * 9 + k * 1.7));
        const s = 1 + 0.35 * Math.sin(t * 12 + k);
        mesh.scale.set(s, s, s);
      }
    });

    // ── Phase B: core bloom at the convergence point ─────────────────────
    const coreProgress = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 1.5));
    if (coreSphereRef.current) {
      const s = Math.max(0.001, coreProgress * 6.5 * (1 + lateFlare * 1.5));
      coreSphereRef.current.scale.set(s, s, s);
      const mat = coreSphereRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = coreProgress * (0.55 + 0.12 * Math.sin(t * 6)) + lateFlare * 0.3;
    }
    if (coreWireRef.current) {
      const s = Math.max(0.001, coreProgress * (8 + Math.sin(t * 2.2) * 0.5));
      coreWireRef.current.scale.set(s, s, s);
      coreWireRef.current.rotation.y = t * 0.9;
      coreWireRef.current.rotation.x = t * 0.5;
      const mat = coreWireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = coreProgress * 0.7;
    }
    if (flashLightRef.current) {
      flashLightRef.current.intensity = coreProgress * 60;
    }

    // ── Ground shockwave rings ───────────────────────────────────────────
    shockRingRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const localT = t - FINALE_BEAM_DURATION - 0.3 - i * 0.45;
      if (localT <= 0) {
        ring.scale.set(0.001, 0.001, 1);
        return;
      }
      const radius = localT * 38;
      ring.scale.set(radius, radius, 1);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - localT / 3.0);
    });

    // ── Phase D: circle ritual at the plaza (after rays converge) ────────
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

    // Exit portal ring — opens once the rays have locked onto the core
    const portalP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.15) / 0.9));
    if (portalRingRef.current) {
      portalRingRef.current.rotation.z = t * 0.7;
      const s = Math.max(0.001, portalP * (1 + 0.035 * Math.sin(t * 4)));
      portalRingRef.current.scale.set(s, s, s);
    }
    portalRingMat.opacity = portalP * (0.55 + 0.25 * Math.sin(t * 7)) + lateFlare * 0.4;

    // Star flare at the core: blooms on impact, detonates into the flash
    const bloomP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 0.6));
    if (crossFlareRef.current) {
      const s = Math.max(0.001, bloomP * 7 + lateFlare * 30);
      crossFlareRef.current.scale.set(s, s, s);
      crossFlareRef.current.rotation.z = t * 0.35;
    }
    crossFlareMat.opacity = bloomP * 0.45 + lateFlare * 0.55;

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
      flashLightRef.current.intensity += lateFlare * 70;
    }

    // ── Phase C: hand off to the flash + exit panel ──────────────────────
    if (t >= FINALE_TOTAL_DURATION && !redirectFiredRef.current) {
      redirectFiredRef.current = true;
      beginFinaleRedirect();
    }
  });

  if (finaleState === 'idle') return null;

  return (
    <group>
      {/* ── Air arcs: every live tower pours energy into the core ── */}
      {airRays.map((ray, i) => (
        <group key={`air-${i}`}>
          <mesh geometry={ray.glowGeo} material={ray.glowMat} />
          <mesh geometry={ray.coreGeo} material={ray.coreMat} />
          {/* Emission spark hovering over the tower roof */}
          <mesh
            ref={(el) => { airSparkRefs.current[i] = el; }}
            position={[ray.start.x, ray.start.y + 0.9, ray.start.z]}
          >
            <sphereGeometry args={[1.5, 14, 14]} />
            <meshBasicMaterial
              color={GLOW_COLOR}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {Array.from({ length: PULSES_PER_RAY }).map((_, k) => (
            <mesh
              key={`air-pulse-${i}-${k}`}
              ref={(el) => { airPulseRefs.current[i * PULSES_PER_RAY + k] = el; }}
              position={[ray.start.x, ray.start.y, ray.start.z]}
            >
              <sphereGeometry args={[0.8, 10, 10]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Ground rays: floor-level conduits racing the same convergence ── */}
      {groundRays.map((ray, i) => (
        <group key={`ground-${i}`}>
          <mesh ref={(el) => { groundCoreRefs.current[i] = el; }} quaternion={ray.quaternion} scale={[1, 0.001, 1]}>
            <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
            <meshBasicMaterial
              color={GLOW_COLOR}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh ref={(el) => { groundGlowRefs.current[i] = el; }} quaternion={ray.quaternion} scale={[1, 0.001, 1]}>
            <cylinderGeometry args={[1.6, 1.6, 1, 10]} />
            <meshBasicMaterial
              color={BEAM_COLOR}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {Array.from({ length: PULSES_PER_RAY }).map((_, k) => (
            <mesh
              key={`ground-pulse-${i}-${k}`}
              ref={(el) => { groundPulseRefs.current[i * PULSES_PER_RAY + k] = el; }}
              position={[ray.start.x, ray.start.y, ray.start.z]}
            >
              <sphereGeometry args={[1.0, 10, 10]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
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

      {/* ── Star flare that detonates into the exit flash ── */}
      <group ref={crossFlareRef} position={CENTER} scale={0.001}>
        <mesh material={crossFlareMat} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[1, 0.14]} />
        </mesh>
        <mesh material={crossFlareMat} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.14, 1]} />
        </mesh>
        <mesh material={crossFlareMat} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.7, 0.08]} />
        </mesh>
        <mesh material={crossFlareMat} rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.08, 0.7]} />
        </mesh>
      </group>

      {/* ── Exit portal ring floating above the core ── */}
      <mesh ref={portalRingRef} position={[0, 14.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001} material={portalRingMat}>
        <torusGeometry args={[6.2, 0.32, 10, 64]} />
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
        <mesh material={columnMat} position={[0, 45, 0]}>
          <cylinderGeometry args={[1.8, 3.4, 90, 24, 1, true]} />
        </mesh>
        <mesh material={columnCoreMat} position={[0, 45, 0]}>
          <cylinderGeometry args={[0.55, 1.1, 90, 12, 1, true]} />
        </mesh>
      </group>

      {/* ── Explosion point light ── */}
      <pointLight ref={flashLightRef} position={CENTER} color="#ccffcc" intensity={0} distance={160} />
    </group>
  );
};
