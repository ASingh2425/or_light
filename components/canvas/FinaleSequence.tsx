'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { ACTIVE_CHALLENGES } from '@/lib/challenges';
import { FINALE_BEAM_DURATION, FINALE_TOTAL_DURATION } from '@/lib/constants';

const BEAM_COLOR = '#00ff88';
const CENTER = new THREE.Vector3(0, 8.5, 0);

const PULSES_PER_RAY = 3;
// Tower roofs top out at y≈9.05 (Building3D), so arcs launch just above them
const AIR_BEAM_Y = 9.4;
const ARC_APEX = 24;

// One vivid hue per ray so the four arcs read as distinct streams
const RAY_COLORS = ['#00ff88', '#00d4ff', '#ff3df0', '#ffd400'];
const GLOW_COLORS = RAY_COLORS.map((c) =>
  new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.55).getStyle()
);

interface AirRay {
  curve: THREE.QuadraticBezierCurve3;
  start: THREE.Vector3;
  coreGeo: THREE.TubeGeometry;
  glowGeo: THREE.TubeGeometry;
  coreCount: number;
  glowCount: number;
  coreMat: THREE.MeshBasicMaterial;
  glowMat: THREE.MeshBasicMaterial;
  color: string;
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const additiveMat = (color: string) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

const FinaleEffects: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);
  const beginFinaleRedirect = useGameStore((state) => state.beginFinaleRedirect);

  const airSparkRefs = useRef<Array<THREE.Mesh | null>>([]);
  const airPulseRefs = useRef<Array<THREE.Mesh | null>>([]);
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
  const haloBSegments = useMemo(() => Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2;
      return { key: i, a, x: Math.sin(a) * 13.2, z: Math.cos(a) * 13.2 };
    })
  , []);
  const dashGeoA = useMemo(() => new THREE.BoxGeometry(1.4, 0.08, 0.24), []);
  const dashGeoB = useMemo(() => new THREE.BoxGeometry(3.0, 0.08, 0.32), []);
  const haloAMat = useMemo(() => additiveMat('#ff3df0'), []);
  const haloBMat = useMemo(() => additiveMat('#00d4ff'), []);
  const plazaRingMat = useMemo(() => additiveMat('#ffd400'), []);
  const columnMat = useMemo(() => additiveMat(BEAM_COLOR), []);
  const columnCoreMat = useMemo(() => additiveMat('#eaffff'), []);
  const baseRingMat = useMemo(() => additiveMat('#00d4ff'), []);
  const portalRingMat = useMemo(() => additiveMat('#ff3df0'), []);
  const crossFlareMat = useMemo(() => additiveMat('#ffffff'), []);

  // ── ONE arc per live tower: colored stream that meets at the core ───────
  const airRays = useMemo<AirRay[]>(() =>
    ACTIVE_CHALLENGES.map((challenge, i) => {
      const start = new THREE.Vector3(challenge.coordinates[0], AIR_BEAM_Y, challenge.coordinates[2]);
      const mid = start.clone().add(CENTER).multiplyScalar(0.5);
      mid.y = ARC_APEX;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, CENTER.clone());
      const coreGeo = new THREE.TubeGeometry(curve, 64, 0.55, 10, false);
      const glowGeo = new THREE.TubeGeometry(curve, 64, 1.9, 12, false);
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
        coreMat: additiveMat(RAY_COLORS[i % RAY_COLORS.length]),
        glowMat: additiveMat(GLOW_COLORS[i % GLOW_COLORS.length]),
        color: RAY_COLORS[i % RAY_COLORS.length],
      };
    })
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
    // Whole scene cycles hue while the rays are locked in
    const hue = (t * 0.12) % 1;

    // ── Phase A: one arc per tower grows toward the core ──────────────────
    airRays.forEach((ray, i) => {
      const progress = easeOutCubic(clamp01((t - i * 0.16) / 1.1));
      ray.coreGeo.setDrawRange(0, Math.floor(ray.coreCount * progress));
      ray.glowGeo.setDrawRange(0, Math.floor(ray.glowCount * progress));

      ray.coreMat.opacity =
        (progress >= 1 ? 0.9 + 0.1 * Math.sin(t * 5 + i) : 1.0 * (0.5 + 0.5 * progress)) +
        (progress >= 1 ? lateFlare * 0.3 : 0);
      ray.glowMat.opacity = 0.32 + 0.1 * Math.sin(t * 3.5 + i * 2) + lateFlare * 0.25;

      const spark = airSparkRefs.current[i];
      if (spark) {
        const s = 1.25 + 0.4 * Math.sin(t * 8 + i);
        spark.scale.set(s, s, s);
        const mat = spark.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.9 + lateFlare * 0.1;
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
        ray.curve.getPoint(phase, mesh.position);
        mat.opacity = 0.45 + 0.55 * Math.abs(Math.sin(t * 9 + k * 1.7));
        const s = 1 + 0.4 * Math.sin(t * 12 + k);
        mesh.scale.set(s, s, s);
      }
    });

    // ── Phase B: core bloom at the convergence point ─────────────────────
    const coreProgress = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 1.5));
    if (coreSphereRef.current) {
      const s = Math.max(0.001, coreProgress * 9 * (1 + lateFlare * 1.6));
      coreSphereRef.current.scale.set(s, s, s);
      const mat = coreSphereRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHSL(hue, 1, 0.75);
      mat.opacity = coreProgress * (0.65 + 0.12 * Math.sin(t * 6)) + lateFlare * 0.35;
    }
    if (coreWireRef.current) {
      const s = Math.max(0.001, coreProgress * (12 + Math.sin(t * 2.2) * 0.7));
      coreWireRef.current.scale.set(s, s, s);
      coreWireRef.current.rotation.y = t * 0.9;
      coreWireRef.current.rotation.x = t * 0.5;
      const mat = coreWireRef.current.material as THREE.MeshBasicMaterial;
      mat.color.setHSL((hue + 0.5) % 1, 1, 0.7);
      mat.opacity = coreProgress * 0.8;
    }
    if (flashLightRef.current) {
      flashLightRef.current.intensity = coreProgress * 90;
      flashLightRef.current.color.setHSL((hue + 0.15) % 1, 1, 0.72);
    }

    // ── Ground shockwave rings ───────────────────────────────────────────
    shockRingRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const localT = t - FINALE_BEAM_DURATION - 0.3 - i * 0.45;
      if (localT <= 0) {
        ring.scale.set(0.001, 0.001, 1);
        return;
      }
      const radius = localT * 44;
      ring.scale.set(radius, radius, 1);
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.color.setHSL((hue + i * 0.25) % 1, 1, 0.6);
      mat.opacity = Math.max(0, 1 - localT / 3.0);
    });

    // ── Phase D: circle ritual at the plaza (after rays converge) ────────
    const ritualA = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 0.8));
    if (haloAGroupRef.current) {
      haloAGroupRef.current.rotation.y = (t - FINALE_BEAM_DURATION) * 1.5;
      haloAGroupRef.current.scale.set(Math.max(0.001, ritualA * 1.3), 1, Math.max(0.001, ritualA * 1.3));
    }
    haloAMat.color.setHSL((hue + 0.33) % 1, 1, 0.6);
    haloAMat.opacity = ritualA * (0.7 + 0.25 * Math.sin(t * 6));

    const ritualB = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.4) / 0.8));
    if (haloBGroupRef.current) {
      haloBGroupRef.current.rotation.y = -(t - FINALE_BEAM_DURATION - 0.4) * 1.0;
      haloBGroupRef.current.scale.set(Math.max(0.001, ritualB * 1.25), 1, Math.max(0.001, ritualB * 1.25));
    }
    haloBMat.color.setHSL((hue + 0.66) % 1, 1, 0.65);
    haloBMat.opacity = ritualB * (0.6 + 0.2 * Math.sin(t * 5 + 1));

    const ritualRing = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.7) / 0.7));
    plazaRingMat.color.setHSL(hue, 1, 0.6);
    plazaRingMat.opacity = ritualRing * (0.55 + 0.2 * Math.sin(t * 7));

    const baseRingP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.5) / 0.6));
    if (baseRingRef.current) {
      baseRingRef.current.rotation.z = t * 0.9;
      const s = Math.max(0.001, baseRingP * 1.4 * (1 + 0.05 * Math.sin(t * 5)));
      baseRingRef.current.scale.set(s, s, s);
    }
    baseRingMat.color.setHSL((hue + 0.5) % 1, 1, 0.65);
    baseRingMat.opacity = baseRingP * (0.7 + 0.25 * Math.sin(t * 8));

    // Exit portal ring — opens once the rays have locked onto the core
    const portalP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.15) / 0.9));
    if (portalRingRef.current) {
      portalRingRef.current.rotation.z = t * 0.7;
      const s = Math.max(0.001, portalP * (1 + 0.035 * Math.sin(t * 4)));
      portalRingRef.current.scale.set(s, s, s);
    }
    portalRingMat.color.setHSL((hue + 0.75) % 1, 1, 0.7);
    portalRingMat.opacity = portalP * (0.7 + 0.25 * Math.sin(t * 7)) + lateFlare * 0.4;

    // Star flare at the core: blooms on impact, detonates into the flash
    const bloomP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION) / 0.6));
    if (crossFlareRef.current) {
      const s = Math.max(0.001, bloomP * 10 + lateFlare * 36);
      crossFlareRef.current.scale.set(s, s, s);
      crossFlareRef.current.rotation.z = t * 0.35;
    }
    crossFlareMat.color.setHSL((hue + 0.1) % 1, 1, 0.85);
    crossFlareMat.opacity = bloomP * 0.55 + lateFlare * 0.6;

    // Rising light column — swells right before the flash
    const columnP = easeOutCubic(clamp01((t - FINALE_BEAM_DURATION - 0.5) / 1.2));
    if (columnGroupRef.current) {
      columnGroupRef.current.scale.set(
        1 + lateFlare * 3.2,
        Math.max(0.001, columnP),
        1 + lateFlare * 3.2
      );
    }
    columnMat.color.setHSL(hue, 1, 0.6);
    columnCoreMat.color.setHSL((hue + 0.5) % 1, 1, 0.78);
    columnMat.opacity = columnP * (0.4 + 0.15 * Math.sin(t * 9)) + lateFlare * 0.6;
    columnCoreMat.opacity = columnP * 0.55 + lateFlare * 0.5;

    // ── Late flourish: everything blooms into the flash ───────────────────
    if (flashLightRef.current) {
      flashLightRef.current.intensity += lateFlare * 90;
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
      {/* ── ONE colored arc per live tower converging on the core ── */}
      {airRays.map((ray, i) => (
        <group key={`air-${i}`}>
          <mesh geometry={ray.glowGeo} material={ray.glowMat} />
          <mesh geometry={ray.coreGeo} material={ray.coreMat} />
          {/* Emission spark hovering over the tower roof */}
          <mesh
            ref={(el) => { airSparkRefs.current[i] = el; }}
            position={[ray.start.x, ray.start.y + 1.1, ray.start.z]}
          >
            <sphereGeometry args={[2.4, 16, 16]} />
            <meshBasicMaterial
              color={ray.color}
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
              <sphereGeometry args={[1.1, 10, 10]} />
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
        <sphereGeometry args={[1, 32, 32]} />
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
          <planeGeometry args={[1, 0.16]} />
        </mesh>
        <mesh material={crossFlareMat} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.16, 1]} />
        </mesh>
        <mesh material={crossFlareMat} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.75, 0.1]} />
        </mesh>
        <mesh material={crossFlareMat} rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.1, 0.75]} />
        </mesh>
      </group>

      {/* ── Exit portal ring floating above the core ── */}
      <mesh ref={portalRingRef} position={[0, 15.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001} material={portalRingMat}>
        <torusGeometry args={[8, 0.5, 12, 72]} />
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
          <ringGeometry args={[0.94, 1, 64]} />
          <meshBasicMaterial
            color={BEAM_COLOR}
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
        <ringGeometry args={[19, 19.6, 96]} />
      </mesh>

      {/* Ritual seal on the pedestal */}
      <mesh ref={baseRingRef} position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.001} material={baseRingMat}>
        <ringGeometry args={[2.3, 2.7, 64]} />
      </mesh>

      {/* ── Rising light column (graceful hand-off into the flash) ── */}
      <group ref={columnGroupRef} position={[0, 0.6, 0]} scale={[1, 0.001, 1]}>
        <mesh material={columnMat} position={[0, 45, 0]}>
          <cylinderGeometry args={[2.4, 4.4, 90, 24, 1, true]} />
        </mesh>
        <mesh material={columnCoreMat} position={[0, 45, 0]}>
          <cylinderGeometry args={[0.7, 1.4, 90, 12, 1, true]} />
        </mesh>
      </group>

      {/* ── Explosion point light ── */}
      <pointLight ref={flashLightRef} position={CENTER} color="#ccffcc" intensity={0} distance={200} />
    </group>
  );
};

export const FinaleSequence: React.FC = () => {
  const finaleState = useGameStore((state) => state.finaleState);
  // Only build the heavy finale geometry (tubes, halos, materials) once the
  // sequence actually starts, instead of allocating it on every page load.
  if (finaleState === 'idle') return null;
  return <FinaleEffects />;
};
