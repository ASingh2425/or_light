'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

  // Speed conversion: the car cruises at 14 world units/second (29.4 on the 2.1x
  // nitro boost), so this factor puts the gauge on ~90 km/h flat out and
  // ~189 km/h on full boost against the 200 km/h scale in CarCockpitHUD.
  const KM_PER_UNIT_PER_SEC = 6.43;

  // Push-out radius for the building shells, matching the ~6.4 hexagonal base
  // so the car stops on the apron instead of driving through the walls.
  export const BUILDING_COLLISION_RADIUS = 6.6;

  // Publishing the position allocates a new array and re-renders every
  // subscriber (notably the minimap), so the store sync runs at ~10Hz and is
  // skipped entirely while the car is parked.
  const POS_SYNC_INTERVAL = 0.1;
  const POS_SYNC_EPSILON = 0.05;
  // A store position this far from what we last published is somebody else's
  // write (the minimap WARP button), never our own echo, so the car snaps to it.
  const TELEPORT_EPSILON = 0.1;

  // Arena half-extent: the car is kept inside [-60, 60] on both ground axes.
  const ARENA_HALF_EXTENT = 60;

  // Unboosted cruise rate in world units per second. Nitro scales it, and both
  // the wheel spin ratio and the km/h conversion key off the unboosted value.
  const CAR_CRUISE_RATE = 14;
  const NITRO_BOOST = 2.1;

  // Velocity shaping. The car eases onto the target rate in about a tenth of a
  // second and coasts back to a real stop in under one, so the gauge, wheels and
  // heading read a speed instead of snapping between 0 and top speed.
  const ACCEL_RATE = 16; // per second
  const COAST_RATE = 6;  // per second
  // Below this the car is stopped for real and the gauge settles on 0 rather
  // than creeping; it sits under the km/h rounding step.
  const COAST_EPSILON = 0.08;

  // Terminal proximity radius (6.2 units) squared, so the per-frame proximity
  // test skips the sqrt.
  const BUILDING_PROXIMITY_RADIUS_SQ = 6.2 * 6.2;

  // Ground-plane centres for the per-frame bounds passes, hoisted out of the
  // frame loop so those loops neither allocate an iterator nor walk the full
  // challenge records on every frame.
  const BUILDING_CENTERS: ReadonlyArray<readonly [number, number]> =
    FORENSIC_CHALLENGES.map((b) => [b.coordinates[0], b.coordinates[2]] as const);

  // Relaxation passes for the bounds resolution. Two are enough today (the
  // closest pair of shells is ~48 units apart, and the nearest shell stops 8
  // units short of the arena wall); the cap guards a future layout change.
  const BOUNDS_PASSES = 2;

  // Drops the velocity component pointing into a surface, where the normal runs
  // from the surface out towards the car. Without it the car presses into walls
  // at full speed, cannot slide along them, and the gauge reports top speed
  // while standing still.
  const removeInwardVelocity = (vel: { x: number; z: number }, nx: number, nz: number) => {
    const inward = vel.x * nx + vel.z * nz;
    if (inward < 0) {
      vel.x -= nx * inward;
      vel.z -= nz * inward;
    }
  };

  // Pushes the car out of every building shell and back inside the arena. Both
  // constraints are relaxed together, because a shell push-out can land outside
  // the arena wall (or inside a second shell) and resolving them in separate
  // passes only makes one undo the other on the following frame.
  const resolveBounds = (pos: THREE.Vector3, vel: { x: number; z: number }) => {
    for (let pass = 0; pass < BOUNDS_PASSES; pass++) {
      let corrected = false;

      if (pos.x > ARENA_HALF_EXTENT) {
        removeInwardVelocity(vel, 1, 0);
        pos.x = ARENA_HALF_EXTENT;
        corrected = true;
      } else if (pos.x < -ARENA_HALF_EXTENT) {
        removeInwardVelocity(vel, -1, 0);
        pos.x = -ARENA_HALF_EXTENT;
        corrected = true;
      }
      if (pos.z > ARENA_HALF_EXTENT) {
        removeInwardVelocity(vel, 0, 1);
        pos.z = ARENA_HALF_EXTENT;
        corrected = true;
      } else if (pos.z < -ARENA_HALF_EXTENT) {
        removeInwardVelocity(vel, 0, -1);
        pos.z = -ARENA_HALF_EXTENT;
        corrected = true;
      }

      for (let i = 0; i < BUILDING_CENTERS.length; i++) {
        const center = BUILDING_CENTERS[i];
        const dx = pos.x - center[0];
        const dz = pos.z - center[1];
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < BUILDING_COLLISION_RADIUS) {
          // Sitting exactly on the centre leaves no push-out direction to use.
          const nx = dist < 0.0001 ? 1 : dx / dist;
          const nz = dist < 0.0001 ? 0 : dz / dist;
          pos.x = center[0] + nx * BUILDING_COLLISION_RADIUS;
          pos.z = center[1] + nz * BUILDING_COLLISION_RADIUS;
          removeInwardVelocity(vel, nx, nz);
          corrected = true;
        }
      }

      if (!corrected) break;
    }
  };

  export const Player3D: React.FC = () => {
    const meshRef = useRef<THREE.Group>(null);
    const carBodyRef = useRef<THREE.Group>(null);
    const wheelFLRef = useRef<THREE.Group>(null);
    const wheelFRRef = useRef<THREE.Group>(null);
    const wheelBLRef = useRef<THREE.Mesh>(null);
    const wheelBRRef = useRef<THREE.Mesh>(null);
    const sonarRingRef = useRef<THREE.Mesh>(null);
    const exhaustLRef = useRef<THREE.Mesh>(null);
    const exhaustRRef = useRef<THREE.Mesh>(null);
    
    const { camera } = useThree();

    const setPlayerPos = useGameStore((state) => state.setPlayerPos);
    const setPlayerHeading = useGameStore((state) => state.setPlayerHeading);
    const setCarSpeed = useGameStore((state) => state.setCarSpeed);
    const carSpeed = useGameStore((state) => state.carSpeed);
    const setNitroActive = useGameStore((state) => state.setNitroActive);
    const isNitroActive = useGameStore((state) => state.isNitroActive);
    const isUvLightActive = useGameStore((state) => state.isUvLightActive);
    const isSirenActive = useGameStore((state) => state.isSirenActive);
    const sonarScanTrigger = useGameStore((state) => state.sonarScanTrigger);
    const activeBuildingId = useGameStore((state) => state.activeBuildingId);
    const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
    const isTerminalOpen = useGameStore((state) => state.isTerminalOpen);
    const soundEnabled = useGameStore((state) => state.soundEnabled);
    const themePreset = useGameStore((state) => state.themePreset);
    const theme = THEMES[themePreset] || THEMES['deus-ex'];

    const keysPressed = useRef<{ [key: string]: boolean }>({});
    const lastTriggeredBuilding = useRef<string | null>(null);
    const nearbyBuildingIdRef = useRef<string | null>(null);
    const prevNitroRef = useRef(false);
    const steerAngle = useRef(0);
    const sonarRadius = useRef(0);
    const [sirenState, setSirenState] = useState(false);

    // Last values published to the store: they gate redundant writes and let us
    // tell our own writes apart from an external teleport.
    const lastWrittenPos = useRef<[number, number, number]>([0, 0.55, 0]);
    const lastSpeedVal = useRef(0);
    const lastHeadingVal = useRef(0);
    const posSyncAccum = useRef(0);
    // Car velocity in world units per second. Held in a ref and mutated in place
    // so the frame loop never allocates a vector.
    const velocity = useRef({ x: 0, z: 0 });

    // A light target is an Object3D outside the scene graph, so its world matrix
    // never updates on its own and the beam aims at the world origin instead of
    // down the road. Parented into the car below, it actually aims.
    const uvSpotTarget = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) return;
        if (e.repeat) return;
        const key = e.key.toLowerCase();
        keysPressed.current[key] = true;

        if (key === 'shift' || e.code === 'Space') {
          setNitroActive(true);
          if (soundEnabled) sound.playNitro();
        }
        if (key === 'enter') {
          const nearby = nearbyBuildingIdRef.current;
          if (nearby) {
            if (soundEnabled) sound.playEnter();
            setActiveBuilding(nearby);
          }
        }
        if (key === 'h') {
          useGameStore.getState().toggleUvLight();
        }
        if (key === 'b') {
          useGameStore.getState().toggleSiren();
        }
        if (key === 'e') {
          useGameStore.getState().triggerSonarPulse();
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysPressed.current[key] = false;
        if (key === 'shift' || e.code === 'Space') {
          setNitroActive(false);
        }
      };

      const handleFocus = () => {
        keysPressed.current = {};
        setNitroActive(false);
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          active.blur();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleFocus);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleFocus);
      };
    }, [setNitroActive, setActiveBuilding, soundEnabled]);

  // Flash siren lights and play siren sound when active
  useEffect(() => {
    if (!isSirenActive) {
      setSirenState(false);
      return;
    }
    if (soundEnabled) sound.playSiren();
    const interval = setInterval(() => {
      setSirenState((prev) => !prev);
      if (soundEnabled) sound.playSiren();
    }, 280);
    return () => clearInterval(interval);
  }, [isSirenActive, soundEnabled]);

  // Trigger sonar pulse animation and sound
  useEffect(() => {
    if (sonarScanTrigger > 0) {
      sonarRadius.current = 1.0;
      if (soundEnabled) sound.playSonar();
    }
  }, [sonarScanTrigger, soundEnabled]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const currentPos = meshRef.current.position;
    const vel = velocity.current;

    // The minimap WARP writes playerPos straight into the store, so the car has
    // to honour external writes: anything further than TELEPORT_EPSILON from the
    // last value we published is somebody else's, never our own echo. The camera
    // already lerps toward the car, so it catches up on its own.
    const storePos = useGameStore.getState().playerPos;
    if (
      Math.abs(storePos[0] - lastWrittenPos.current[0]) > TELEPORT_EPSILON ||
      Math.abs(storePos[2] - lastWrittenPos.current[2]) > TELEPORT_EPSILON
    ) {
      const warpX = THREE.MathUtils.clamp(storePos[0], -ARENA_HALF_EXTENT, ARENA_HALF_EXTENT);
      const warpZ = THREE.MathUtils.clamp(storePos[2], -ARENA_HALF_EXTENT, ARENA_HALF_EXTENT);
      currentPos.x = warpX;
      currentPos.z = warpZ;
      currentPos.y = 0.55;
      // A warp drops the car onto the apron; carrying the old velocity across
      // would slide it straight back off the pad.
      vel.x = 0;
      vel.z = 0;
      lastWrittenPos.current = [warpX, currentPos.y, warpZ];
      posSyncAccum.current = 0;
      // Publish back only when the arena clamp actually moved the target, so a
      // warp never writes the store a value it already holds.
      if (storePos[0] !== warpX || storePos[2] !== warpZ) {
        setPlayerPos(lastWrittenPos.current);
      }
    }

    const clampedDelta = Math.min(delta, 0.1);
    const baseRate = CAR_CRUISE_RATE * (isNitroActive ? NITRO_BOOST : 1.0);

    const keys = keysPressed.current;
    let targetVx = 0;
    let targetVz = 0;
    if (keys['w'] || keys['arrowup'])    targetVz -= baseRate;
    if (keys['s'] || keys['arrowdown'])  targetVz += baseRate;
    if (keys['a'] || keys['arrowleft'])  targetVx -= baseRate;
    if (keys['d'] || keys['arrowright']) targetVx += baseRate;

    // Nitro auto-thrust forward if no direction key is pressed
    if (isNitroActive && targetVx === 0 && targetVz === 0) {
      const headingRad = meshRef.current ? meshRef.current.rotation.y : 0;
      targetVx = Math.sin(headingRad) * baseRate;
      targetVz = Math.cos(headingRad) * baseRate;
    }

    if (targetVx !== 0 && targetVz !== 0) {
      targetVx *= 0.7071;
      targetVz *= 0.7071;
    }

    const accelRate = isNitroActive ? 48 : ACCEL_RATE;
    if (targetVx !== 0 || targetVz !== 0) {
      const accel = 1 - Math.exp(-accelRate * clampedDelta);
      vel.x += (targetVx - vel.x) * accel;
      vel.z += (targetVz - vel.z) * accel;
    } else {
      const coast = Math.exp(-COAST_RATE * clampedDelta);
      vel.x *= coast;
      vel.z *= coast;
      if (Math.abs(vel.x) < COAST_EPSILON && Math.abs(vel.z) < COAST_EPSILON) {
        vel.x = 0;
        vel.z = 0;
      }
    }

    // Real velocity in km/h. hypot keeps the diagonal magnitude honest, and the
    // store only sees the value when it actually changes.
    const unitsPerSec = Math.hypot(vel.x, vel.z);
    const currentSpeedVal = Math.round(unitsPerSec * KM_PER_UNIT_PER_SEC);
    if (currentSpeedVal !== lastSpeedVal.current) {
      lastSpeedVal.current = currentSpeedVal;
      setCarSpeed(currentSpeedVal);
    }

    // Steer angle calculation for turning wheels
    let targetSteer = 0;
    if (keys['a'] || keys['arrowleft'])  targetSteer = 0.45;
    if (keys['d'] || keys['arrowright']) targetSteer = -0.45;
    steerAngle.current = THREE.MathUtils.lerp(steerAngle.current, targetSteer, 0.2);

    if (wheelFLRef.current) wheelFLRef.current.rotation.y = steerAngle.current;
    if (wheelFRRef.current) wheelFRRef.current.rotation.y = steerAngle.current;

    // Integrate the frame, then settle the car inside the arena and outside
    // every shell in one go.
    currentPos.x += vel.x * clampedDelta;
    currentPos.z += vel.z * clampedDelta;
    currentPos.y = 0.55;
    resolveBounds(currentPos, vel);

    const newX = currentPos.x;
    const newZ = currentPos.z;

    // Spin wheels in proportion to the speed actually being done
    const wheelSpin =
      delta * (isNitroActive ? 22 : 12) * Math.min(1, unitsPerSec / CAR_CRUISE_RATE);
    if (wheelBLRef.current) wheelBLRef.current.rotation.x += wheelSpin;
    if (wheelBRRef.current) wheelBRRef.current.rotation.x += wheelSpin;

    // Rotate car toward its actual heading of travel, then apply body tilt
    if (unitsPerSec > COAST_EPSILON) {
      const angle = Math.atan2(vel.x, vel.z);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        angle,
        0.14
      );
      const headingVal = Math.round(((meshRef.current.rotation.y * 180) / Math.PI) % 360);
      if (headingVal !== lastHeadingVal.current) {
        lastHeadingVal.current = headingVal;
        setPlayerHeading(headingVal);
      }
    }

    // Body roll during turns
    if (carBodyRef.current) {
      const rollTarget = -steerAngle.current * 0.15;
      carBodyRef.current.rotation.z = THREE.MathUtils.lerp(carBodyRef.current.rotation.z, rollTarget, 0.15);
    }

    // Driving and collision above stay frame-perfect; only this store sync is
    // throttled, so the minimap re-renders ~10x a second instead of 60x.
    posSyncAccum.current += clampedDelta;
    if (
      posSyncAccum.current >= POS_SYNC_INTERVAL &&
      (Math.abs(newX - lastWrittenPos.current[0]) > POS_SYNC_EPSILON ||
        Math.abs(newZ - lastWrittenPos.current[2]) > POS_SYNC_EPSILON)
    ) {
      posSyncAccum.current = 0;
      lastWrittenPos.current = [newX, currentPos.y, newZ];
      setPlayerPos(lastWrittenPos.current);
    }

    // Camera follow with dynamic distance scaling & FOV speed warp
    const camTargetX = isTerminalOpen ? newX - 8 : newX;
    const camTargetY = isTerminalOpen ? 20 : (isNitroActive ? 26 : 22);
    const camTargetZ = isTerminalOpen ? newZ + 20 : (isNitroActive ? newZ + 28 : newZ + 24);

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.08);
    camera.lookAt(newX, 1.2, newZ);

    const persCam = camera as THREE.PerspectiveCamera;
    if (persCam.isPerspectiveCamera) {
      const targetFov = isNitroActive ? 62 : (isTerminalOpen ? 40 : 45);
      if (Math.abs(persCam.fov - targetFov) > 0.2) {
        persCam.fov = THREE.MathUtils.lerp(persCam.fov, targetFov, 0.1);
        persCam.updateProjectionMatrix();
      }
    }

    // Sonar pulse wave expansion
    if (sonarRadius.current > 0 && sonarRingRef.current) {
      sonarRadius.current += delta * 24;
      sonarRingRef.current.scale.set(sonarRadius.current, sonarRadius.current, 1);
      const mat = sonarRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 1 - sonarRadius.current / 30);
      }
      if (sonarRadius.current > 30) {
        sonarRadius.current = 0;
      }
    }

    // Building proximity detection
    let nearbyBuilding: string | null = null;
    for (let i = 0; i < FORENSIC_CHALLENGES.length; i++) {
      const bldg = FORENSIC_CHALLENGES[i];
      const dx = newX - bldg.coordinates[0];
      const dz = newZ - bldg.coordinates[2];
      if (dx * dx + dz * dz < BUILDING_PROXIMITY_RADIUS_SQ) {
        nearbyBuilding = bldg.id;
        break;
      }
    }

    nearbyBuildingIdRef.current = nearbyBuilding;
    lastTriggeredBuilding.current = nearbyBuilding;
  });

  // ── Sleek High-Tech Non-Black Color Palette ───────────────────────────────
  const bodyColor      = theme.buildingGlassColor;    // glowing neon visor / glass
  const chassisMetal   = theme.buildingBaseColor;     // deep vibrant titanium structural chassis
  const accentColor    = theme.roadTrimColor;          // trim / headlight LEDs
  const wheelAlloy     = '#475569';                   // sleek titanium slate alloy (NO BLACK)
  const tireColor      = '#334155';                   // titanium graphite cyber-tread (NO BLACK)
  const uvBeamColor    = '#a855f7';                   // ultraviolet forensic inspection beam

  // One forward light serves the headlights and the siren strobe. While the
  // siren runs it takes over the colour and reaches a little further, which is
  // what makes the roof beacons wash the road without paying for another light.
  const forwardColor = isSirenActive
    ? (sirenState ? '#38bdf8' : '#f59e0b')
    : (isUvLightActive ? uvBeamColor : accentColor);
  const forwardIntensity = isSirenActive ? 5.0 : (carSpeed > 0 ? 4.0 : 2.0);
  const forwardDistance = isSirenActive ? 14 : (isUvLightActive ? 16 : 10);

  return (
    <group ref={meshRef} position={[0, 0.55, 0]}>
      {/* ── EXPANDING FORENSIC SONAR SCAN RING ── */}
      <mesh
        ref={sonarRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.4, 0]}
        scale={[0.01, 0.01, 1]}
      >
        <ringGeometry args={[0.95, 1.05, 48]} />
        <meshBasicMaterial
          color={isUvLightActive ? uvBeamColor : '#00f0ff'}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── MAIN VEHICLE CAR BODY GROUP (Tilts on turns) ── */}
      <group ref={carBodyRef}>
        {/* Chassis / Low aerodynamic body */}
        <mesh castShadow position={[0, 0.18, 0]}>
          <boxGeometry args={[1.15, 0.32, 2.2]} />
          <meshStandardMaterial
            color={chassisMetal}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>

        {/* Cabin / Upper body */}
        <mesh castShadow position={[0, 0.52, -0.05]}>
          <boxGeometry args={[0.9, 0.36, 1.25]} />
          <meshStandardMaterial
            color={chassisMetal}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* Windshield (Glowing Glass Pane) */}
        <mesh position={[0, 0.54, 0.58]}>
          <boxGeometry args={[0.84, 0.3, 0.06]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.0}
            metalness={0.9}
            transparent
            opacity={0.65}
            emissive={bodyColor}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Rear Window */}
        <mesh position={[0, 0.54, -0.68]}>
          <boxGeometry args={[0.84, 0.28, 0.06]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.0}
            metalness={0.9}
            transparent
            opacity={0.55}
            emissive={bodyColor}
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Side Windows */}
        {[-0.455, 0.455].map((sx, i) => (
          <mesh key={i} position={[sx, 0.54, -0.05]}>
            <boxGeometry args={[0.06, 0.26, 1.05]} />
            <meshStandardMaterial
              color={bodyColor}
              transparent
              opacity={0.45}
              emissive={bodyColor}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}

        {/* Neon Side Trim Accent Blades */}
        {[-0.58, 0.58].map((sx, i) => (
          <mesh key={i} position={[sx, 0.15, 0]}>
            <boxGeometry args={[0.05, 0.08, 2.0]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        ))}

        {/* ── FORENSIC EMERGENCY ROOF SIREN BEACONS ── */}
        <group position={[0, 0.74, -0.05]}>
          {/* Siren Bar Mount */}
          <mesh>
            <boxGeometry args={[0.6, 0.06, 0.12]} />
            <meshStandardMaterial color={chassisMetal} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Left Siren: Blue LED */}
          <mesh position={[-0.2, 0.06, 0]}>
            <boxGeometry args={[0.15, 0.08, 0.1]} />
            <meshBasicMaterial color={isSirenActive && sirenState ? '#38bdf8' : '#0284c7'} />
          </mesh>
          {/* Right Siren: Amber/Red LED */}
          <mesh position={[0.2, 0.06, 0]}>
            <boxGeometry args={[0.15, 0.08, 0.1]} />
            <meshBasicMaterial color={isSirenActive && !sirenState ? '#f59e0b' : '#d97706'} />
          </mesh>
          {/* The beacons drive no light of their own: they strobe the shared
              forward light below, which is one light fewer in the scene. */}
        </group>

        {/* ── FRONT HEADLIGHTS & FORENSIC UV LIGHT ──
            Two lens meshes but a single light. The pair sat 0.68 units apart
            with identical settings, so one forward light reads the same while
            halving what that light costs every lit material in the scene. */}
        {[-0.34, 0.34].map((hx, i) => (
          <mesh key={i} position={[hx, 0.2, 1.12]}>
            <boxGeometry args={[0.2, 0.12, 0.06]} />
            <meshBasicMaterial color={forwardColor} />
          </mesh>
        ))}
        <pointLight
          position={[0, 0.2, 1.12]}
          color={forwardColor}
          intensity={forwardIntensity}
          distance={forwardDistance}
        />

        {/* Beam target, parented into the car so its world matrix updates */}
        <primitive object={uvSpotTarget} position={[0, 0, 18]} />

        {/* Forensic UV Forward Spot Beam Projection */}
        {isUvLightActive && (
          <spotLight
            position={[0, 0.4, 1.2]}
            target={uvSpotTarget}
            color={uvBeamColor}
            intensity={6.0}
            distance={25}
            angle={0.7}
            penumbra={0.6}
          />
        )}

        {/* ── REAR BRAKE LIGHTS ── */}
        {[-0.34, 0.34].map((hx, i) => (
          <mesh key={i} position={[hx, 0.2, -1.11]}>
            <boxGeometry args={[0.2, 0.1, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        ))}

        {/* ── NITRO EXHAUST THRUSTER EMITTERS ── */}
        {[-0.25, 0.25].map((ex, i) => (
          <group key={`exhaust-${i}`} position={[ex, 0.12, -1.14]}>
            <mesh ref={i === 0 ? exhaustLRef : exhaustRRef}>
              <cylinderGeometry args={[0.07, 0.09, 0.12, 12]} />
              <meshStandardMaterial color={chassisMetal} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Nitro Flame when boost is active */}
            {isNitroActive && (
              <mesh position={[0, 0, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.14, 0.45, 12]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.9} />
              </mesh>
            )}
          </group>
        ))}

        {isNitroActive && (
          <pointLight position={[0, 0.12, -1.3]} color="#00f0ff" intensity={6.0} distance={10} />
        )}
      </group>

      {/* ── INTERACTIVE 4× WHEELS (NO BLACK, TITANIUM SLATE ALLOY & TREADS) ── */}
      
      {/* Front-Left Steerable Wheel */}
      <group ref={wheelFLRef} position={[-0.66, -0.08, 0.7]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color={tireColor} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.2, 0.03, 8, 16]} />
          <meshBasicMaterial color={wheelAlloy} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.12, 0.02, 6, 14]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
      </group>

      {/* Front-Right Steerable Wheel */}
      <group ref={wheelFRRef} position={[0.66, -0.08, 0.7]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color={tireColor} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.2, 0.03, 8, 16]} />
          <meshBasicMaterial color={wheelAlloy} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.12, 0.02, 6, 14]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
      </group>

      {/* Back-Left Wheel */}
      <mesh ref={wheelBLRef} position={[-0.66, -0.08, -0.74]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color={tireColor} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[-0.66, -0.08, -0.74]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.02, 6, 14]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* Back-Right Wheel */}
      <mesh ref={wheelBRRef} position={[0.66, -0.08, -0.74]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color={tireColor} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.66, -0.08, -0.74]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.02, 6, 14]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* ── UNDERBODY NEON GLOW ── */}
      <pointLight
        position={[0, -0.28, 0]}
        color={isNitroActive ? '#00f0ff' : (isUvLightActive ? uvBeamColor : bodyColor)}
        intensity={carSpeed > 0 ? 3.5 : 1.5}
        distance={6}
      />

      {/* Ground Projection Halo */}
      <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.8, 1.4, 1]}>
        <circleGeometry args={[1.2, 28]} />
        <meshBasicMaterial
          color={isUvLightActive ? uvBeamColor : bodyColor}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
