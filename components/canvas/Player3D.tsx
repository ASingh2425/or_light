'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { pointerState } from '@/lib/inputState';
import { sound } from '@/components/audio/SoundEffects';

// Exponential damping helper (frame-rate independent smoothing)
const smoothFactor = (rate: number, delta: number) => 1 - Math.exp(-rate * delta);

// Velocity axis controller: gentle ramp when accelerating, firm stop when braking
const dampAxis = (current: number, target: number, delta: number) => {
  const rising =
    target !== 0 &&
    Math.abs(target) > Math.abs(current) &&
    Math.sign(target) === Math.sign(current || target);
  const rate = rising ? 3.0 : 5.5;
  let value = current + (target - current) * smoothFactor(rate, delta);
  if (target === 0 && Math.abs(value) < 0.07) value = 0;
  return value;
};

// Camera presets (distance + elevation angle around the car)
const CAM_PRESETS: Record<string, { dist: number; pitch: number }> = {
  chase: { dist: 32, pitch: 0.71 },
  close: { dist: 14, pitch: 0.30 },
  wide: { dist: 48, pitch: 0.95 },
  top: { dist: 42, pitch: 1.40 },
};

export const Player3D: React.FC = () => {
  const meshRef = useRef<THREE.Group>(null);
  const carBodyRef = useRef<THREE.Group>(null);
  const wheelFLRef = useRef<THREE.Group>(null);
  const wheelFRRef = useRef<THREE.Group>(null);
  const wheelBLRef = useRef<THREE.Mesh>(null);
  const wheelBRRef = useRef<THREE.Mesh>(null);
  const exhaustLRef = useRef<THREE.Mesh>(null);
  const exhaustRRef = useRef<THREE.Mesh>(null);
  
  const { camera } = useThree();

  const setPlayerPos = useGameStore((state) => state.setPlayerPos);
  const setPlayerHeading = useGameStore((state) => state.setPlayerHeading);
  const setCarSpeed = useGameStore((state) => state.setCarSpeed);
  const setNitroActive = useGameStore((state) => state.setNitroActive);
  const isNitroActive = useGameStore((state) => state.isNitroActive);
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const isTerminalOpen = useGameStore((state) => state.isTerminalOpen);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const finaleState = useGameStore((state) => state.finaleState);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const cycleCameraMode = useGameStore((state) => state.cycleCameraMode);
  const theme = THEMES[themePreset] || THEMES['deus-ex'];

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const lastTriggeredBuilding = useRef<string | null>(null);
  const isMoving = useRef(false);
  const steerAngle = useRef(0);
  const velocityRef = useRef(new THREE.Vector3(0, 0, 0));
  const lookTargetRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const lastDisplaySpeed = useRef(-1);
  const lastHeadingDeg = useRef(0);
  const prevLocalFwdSpeed = useRef(0);
  const seenTeleportNonce = useRef(0);
  const finaleOrbitRef = useRef({ angle: 0, initialized: false });
  const camBaseRef = useRef(new THREE.Vector3(0, 22, 24));
  const camCtlRef = useRef({
    yaw: 0,
    pitch: CAM_PRESETS.chase.pitch,
    dist: CAM_PRESETS.chase.dist,
    tYaw: 0,
    tPitch: CAM_PRESETS.chase.pitch,
    tDist: CAM_PRESETS.chase.dist,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) return;
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      // Hotkey: Shift or Space toggles Nitro Boost
      if (e.key === 'Shift' || e.code === 'Space') {
        setNitroActive(true);
      }

      // Single-fire toggles (ignore key repeat)
      if (e.repeat) return;
      if (key === 'c') {
        cycleCameraMode();
        if (soundEnabled) sound.playClick();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      if (e.key === 'Shift' || e.code === 'Space') {
        setNitroActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setNitroActive, cycleCameraMode, soundEnabled]);

  // ── Camera angle control: drag to orbit, scroll to zoom ────────────────
  useEffect(() => {
    const isCanvasTarget = (t: EventTarget | null) => t instanceof HTMLCanvasElement;

    const onPointerDown = (e: PointerEvent) => {
      if (!isCanvasTarget(e.target)) return;
      const ctl = camCtlRef.current;
      ctl.dragging = true;
      ctl.lastX = e.clientX;
      ctl.lastY = e.clientY;
      pointerState.dragDistance = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      const ctl = camCtlRef.current;
      if (!ctl.dragging) return;
      const dx = e.clientX - ctl.lastX;
      const dy = e.clientY - ctl.lastY;
      ctl.lastX = e.clientX;
      ctl.lastY = e.clientY;
      pointerState.dragDistance += Math.abs(dx) + Math.abs(dy);
      ctl.tYaw += dx * 0.006;
      ctl.tPitch = THREE.MathUtils.clamp(ctl.tPitch + dy * 0.005, 0.08, 1.45);
    };

    const onPointerUp = () => {
      camCtlRef.current.dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!isCanvasTarget(e.target)) return;
      e.preventDefault();
      const ctl = camCtlRef.current;
      ctl.tDist = THREE.MathUtils.clamp(ctl.tDist + e.deltaY * 0.03, 10, 55);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, []);

  // ── Apply camera preset when the mode changes (smooth glide) ───────────
  useEffect(() => {
    const preset = CAM_PRESETS[cameraMode] || CAM_PRESETS.chase;
    const ctl = camCtlRef.current;
    ctl.tDist = preset.dist;
    ctl.tPitch = preset.pitch;
    ctl.tYaw = 0;
  }, [cameraMode]);

  useFrame((state, rawDelta) => {
    if (!meshRef.current) return;
    const delta = Math.min(rawDelta, 0.05);
    const vel = velocityRef.current;

    // ── External teleport (WARP) — snap mesh + reset momentum ─────────────
    const storeState = useGameStore.getState();
    if (storeState.teleportNonce !== seenTeleportNonce.current) {
      seenTeleportNonce.current = storeState.teleportNonce;
      const [tx, , tz] = storeState.playerPos;
      meshRef.current.position.set(tx, 0.55, tz);
      vel.set(0, 0, 0);
      steerAngle.current = 0;
      prevLocalFwdSpeed.current = 0;
      lastTriggeredBuilding.current = null;
      lookTargetRef.current.set(tx, 1.2, tz);
      camBaseRef.current.set(tx, 22, tz + 24);
      camera.position.copy(camBaseRef.current);
      camera.lookAt(lookTargetRef.current);
      setCarSpeed(0);
      lastDisplaySpeed.current = 0;
      return;
    }

    // ── Input (world-aligned, normalized diagonals) ──────────────────────
    const keys = keysPressed.current;
    let dirX = 0;
    let dirZ = 0;
    if (keys['w'] || keys['arrowup'])    dirZ -= 1;
    if (keys['s'] || keys['arrowdown'])  dirZ += 1;
    if (keys['a'] || keys['arrowleft'])  dirX -= 1;
    if (keys['d'] || keys['arrowright']) dirX += 1;
    if (dirX !== 0 && dirZ !== 0) {
      dirX *= 0.7071;
      dirZ *= 0.7071;
    }

    // Hands off the wheel while the forensic terminal is open or finale runs
    const inputScale = isTerminalOpen || finaleState !== 'idle' ? 0 : 1;
    const maxSpeed = 13.5 * (isNitroActive ? 2.1 : 1.0);
    vel.x = dampAxis(vel.x, dirX * maxSpeed * inputScale, delta);
    vel.z = dampAxis(vel.z, dirZ * maxSpeed * inputScale, delta);

    // ── Position integration with arena clamping ─────────────────────────
    const pos = meshRef.current.position;
    pos.x = THREE.MathUtils.clamp(pos.x + vel.x * delta, -60, 60);
    pos.z = THREE.MathUtils.clamp(pos.z + vel.z * delta, -60, 60);
    pos.y = 0.55;
    if (pos.x === -60 || pos.x === 60) vel.x = 0;
    if (pos.z === -60 || pos.z === 60) vel.z = 0;

    const speed = vel.length();
    isMoving.current = speed > 0.3;

    // Speedometer — only push integer changes to the store
    const displaySpeed = Math.round(speed * 5.5);
    if (displaySpeed !== lastDisplaySpeed.current) {
      lastDisplaySpeed.current = displaySpeed;
      setCarSpeed(displaySpeed);
    }

    // ── Front wheel steering (smoothed) ───────────────────────────────────
    let targetSteer = 0;
    if (inputScale !== 0) {
      if (keys['a'] || keys['arrowleft'])  targetSteer = 0.45;
      if (keys['d'] || keys['arrowright']) targetSteer = -0.45;
    }
    steerAngle.current += (targetSteer - steerAngle.current) * smoothFactor(9, delta);

    if (wheelFLRef.current) wheelFLRef.current.rotation.y = steerAngle.current;
    if (wheelFRRef.current) wheelFRRef.current.rotation.y = steerAngle.current;

    // ── Heading: shortest-arc damping toward velocity (no 180° snap) ─────
    if (speed > 0.3) {
      const targetAngle = Math.atan2(vel.x, vel.z);
      let diff = targetAngle - meshRef.current.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      meshRef.current.rotation.y += diff * smoothFactor(7, delta);
      const headingDeg = Math.round((meshRef.current.rotation.y * 180) / Math.PI);
      if (headingDeg !== lastHeadingDeg.current) {
        lastHeadingDeg.current = headingDeg;
        setPlayerHeading(headingDeg);
      }
    }

    // ── Wheels spin proportional to actual speed ──────────────────────────
    const wheelSpin = isMoving.current ? delta * Math.max(speed, 2) * 1.7 : 0;
    if (wheelBLRef.current) wheelBLRef.current.rotation.x += wheelSpin;
    if (wheelBRRef.current) wheelBRRef.current.rotation.x += wheelSpin;

    // ── Body roll (lean into turns) & pitch (accel squat / brake dive) ───
    if (carBodyRef.current) {
      const rollTarget = THREE.MathUtils.clamp(
        -steerAngle.current * 0.12 * Math.min(speed / 10, 1.4),
        -0.16,
        0.16
      );
      carBodyRef.current.rotation.z +=
        (rollTarget - carBodyRef.current.rotation.z) * smoothFactor(6, delta);

      const rotY = meshRef.current.rotation.y;
      const localFwdSpeed = vel.x * Math.sin(rotY) + vel.z * Math.cos(rotY);
      const accelFwd = (localFwdSpeed - prevLocalFwdSpeed.current) / Math.max(delta, 1e-4);
      prevLocalFwdSpeed.current = localFwdSpeed;
      const pitchTarget = THREE.MathUtils.clamp(-accelFwd * 0.0008, -0.05, 0.05);
      carBodyRef.current.rotation.x +=
        (pitchTarget - carBodyRef.current.rotation.x) * smoothFactor(7, delta);
    }

    // ── Publish position to store (only on real movement) ────────────────
    setPlayerPos([pos.x, pos.y, pos.z]);

    // ── Camera: cinematic orbit over the plaza during finale, else follow ─
    const camBase = camBaseRef.current;
    if (finaleState !== 'idle') {
      const orbit = finaleOrbitRef.current;
      if (!orbit.initialized) {
        orbit.initialized = true;
        orbit.angle = Math.atan2(camBase.x, camBase.z);
      }
      orbit.angle += delta * 0.13;
      const orbitRadius = 46;
      const targetX = Math.sin(orbit.angle) * orbitRadius;
      const targetY = 17 + Math.sin(orbit.angle * 0.6) * 2.5;
      const targetZ = Math.cos(orbit.angle) * orbitRadius;
      const glide = smoothFactor(2.0, delta);
      camBase.x += (targetX - camBase.x) * glide;
      camBase.y += (targetY - camBase.y) * glide;
      camBase.z += (targetZ - camBase.z) * glide;
      lookTargetRef.current.x += (0 - lookTargetRef.current.x) * glide;
      lookTargetRef.current.y += (9 - lookTargetRef.current.y) * glide;
      lookTargetRef.current.z += (0 - lookTargetRef.current.z) * glide;
      camera.position.copy(camBase);
      camera.lookAt(lookTargetRef.current);
    } else {
      finaleOrbitRef.current.initialized = false;

      // Smooth user-controlled orbit parameters (drag / scroll / presets)
      const ctl = camCtlRef.current;
      const orbitRate = smoothFactor(ctl.dragging ? 14 : 5, delta);
      ctl.yaw += (ctl.tYaw - ctl.yaw) * orbitRate;
      ctl.pitch += (ctl.tPitch - ctl.pitch) * orbitRate;
      ctl.dist += (ctl.tDist - ctl.dist) * orbitRate;

      const camK = smoothFactor(5.5, delta);
      let targetX: number;
      let targetY: number;
      let targetZ: number;
      if (isTerminalOpen) {
        targetX = pos.x - 8;
        targetY = 20;
        targetZ = pos.z + 20;
      } else {
        const horiz = Math.cos(ctl.pitch) * ctl.dist;
        targetX = pos.x + Math.sin(ctl.yaw) * horiz;
        targetZ = pos.z + Math.cos(ctl.yaw) * horiz;
        targetY = 1.2 + Math.sin(ctl.pitch) * ctl.dist;
      }
      camBase.x += (targetX - camBase.x) * camK;
      camBase.y += (targetY - camBase.y) * camK;
      camBase.z += (targetZ - camBase.z) * camK;

      const lookK = smoothFactor(7, delta);
      lookTargetRef.current.x += (pos.x - lookTargetRef.current.x) * lookK;
      lookTargetRef.current.y += (1.2 - lookTargetRef.current.y) * lookK;
      lookTargetRef.current.z += (pos.z - lookTargetRef.current.z) * lookK;

      camera.position.copy(camBase);
      // Speed shudder / nitro vibration
      const shakeAmp = isNitroActive && speed > 3 ? 0.16 : speed > 11 ? 0.045 : 0;
      if (shakeAmp > 0) {
        camera.position.x += (Math.random() - 0.5) * shakeAmp;
        camera.position.y += (Math.random() - 0.5) * shakeAmp * 0.7;
      }
      camera.lookAt(lookTargetRef.current);
    }

    // ── Field-of-view: punch out on nitro for a speed rush ────────────────
    const persp = camera as THREE.PerspectiveCamera;
    const targetFov =
      finaleState !== 'idle'
        ? 50
        : isTerminalOpen
          ? 40
          : isNitroActive && speed > 4
            ? 63
            : 45;
    if (Math.abs(persp.fov - targetFov) > 0.04) {
      persp.fov += (targetFov - persp.fov) * smoothFactor(4.5, delta);
      persp.updateProjectionMatrix();
    }

    // ── Building proximity: opens the in-page terminal only (no new tabs) ─
    if (finaleState !== 'idle') {
      lastTriggeredBuilding.current = null;
      return;
    }

    let nearbyBuilding: string | null = null;
    for (const bldg of FORENSIC_CHALLENGES) {
      // SEC-05 is a dead sector: no terminal there, so it never triggers.
      if (bldg.id === 'building-5') continue;
      const dx = pos.x - bldg.coordinates[0];
      const dz = pos.z - bldg.coordinates[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 6.2) {
        nearbyBuilding = bldg.id;
        break;
      }
    }

    if (nearbyBuilding && nearbyBuilding !== lastTriggeredBuilding.current) {
      lastTriggeredBuilding.current = nearbyBuilding;
      if (activeBuildingId !== nearbyBuilding) {
        if (soundEnabled) sound.playEnter();
        setActiveBuilding(nearbyBuilding);
      }
    } else if (!nearbyBuilding && lastTriggeredBuilding.current !== null) {
      lastTriggeredBuilding.current = null;
    }
  });

  // ── Sleek High-Tech Non-Black Color Palette ───────────────────────────────
  const bodyColor      = theme.buildingGlassColor;    // glowing neon visor / glass
  const chassisMetal   = theme.buildingBaseColor;     // deep vibrant titanium structural chassis
  const accentColor    = theme.roadTrimColor;          // trim / headlight LEDs
  const wheelAlloy     = '#475569';                   // sleek titanium slate alloy (NO BLACK)
  const tireColor      = '#334155';                   // titanium graphite cyber-tread (NO BLACK)

  return (
    <group ref={meshRef} position={[0, 0.55, 0]}>
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

        {/* ── FRONT HEADLIGHTS ── */}
        {[-0.34, 0.34].map((hx, i) => (
          <group key={i} position={[hx, 0.2, 1.12]}>
            <mesh>
              <boxGeometry args={[0.2, 0.12, 0.06]} />
              <meshBasicMaterial color={accentColor} />
            </mesh>
            <pointLight
              color={accentColor}
              intensity={isMoving.current ? 4.0 : 2.0}
              distance={10}
            />
          </group>
        ))}

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
        color={isNitroActive ? '#00f0ff' : bodyColor}
        intensity={isMoving.current ? 3.5 : 1.5}
        distance={6}
      />

      {/* Ground Projection Halo */}
      <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.8, 1.4, 1]}>
        <circleGeometry args={[1.2, 28]} />
        <meshBasicMaterial
          color={bodyColor}
          transparent
          opacity={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
