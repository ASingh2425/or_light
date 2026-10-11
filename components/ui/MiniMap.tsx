'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigation, Maximize2, Minimize2, Radio, Zap } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { ACTIVE_CHALLENGES, FORENSIC_CHALLENGES } from '@/lib/challenges';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

// World coordinate bounds: [-60, 60] (2x scale)
const ARENA_BOUND = 60;

const mapCoordIn = (val: number, size: number) => {
  const norm = (val + ARENA_BOUND) / (ARENA_BOUND * 2);
  return Math.max(4, Math.min(size - 4, norm * size));
};

// Convert heading angle to 8-point compass
const getCompassDir = (deg: number) => {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 337.5 || d < 22.5) return 'N';
  if (d >= 22.5 && d < 67.5) return 'NE';
  if (d >= 67.5 && d < 112.5) return 'E';
  if (d >= 112.5 && d < 157.5) return 'SE';
  if (d >= 157.5 && d < 202.5) return 'S';
  if (d >= 202.5 && d < 247.5) return 'SW';
  if (d >= 247.5 && d < 292.5) return 'W';
  return 'NW';
};

export const MiniMap: React.FC = () => {
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const activeWaypointId = useGameStore((state) => state.activeWaypointId);
  const setActiveWaypoint = useGameStore((state) => state.setActiveWaypoint);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const requestTeleport = useGameStore((state) => state.requestTeleport);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const [isExpanded, setIsExpanded] = useState(false);

  const accent = theme.uiAccentHex;

  // Radar display dimensions (standard vs expanded tactical view)
  const radarSize = isExpanded ? 280 : 160;

  // ── Refs driven imperatively by telemetry (avoids 60Hz React re-renders) ──
  const blipRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const compassRef = useRef<HTMLSpanElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const radarSizeRef = useRef(radarSize);
  radarSizeRef.current = radarSize;

  const paint = useCallback(() => {
    const s = useGameStore.getState();
    const size = radarSizeRef.current;
    const px = mapCoordIn(s.playerPos[0], size);
    const py = mapCoordIn(s.playerPos[2], size);

    if (blipRef.current) {
      blipRef.current.style.left = `${px}px`;
      blipRef.current.style.top = `${py}px`;
      blipRef.current.style.transform = `rotate(${s.playerHeading}deg)`;
    }
    if (compassRef.current) {
      compassRef.current.textContent = `${getCompassDir(s.playerHeading)} ${s.playerHeading}°`;
    }
    if (speedRef.current) {
      speedRef.current.textContent = `SPD: ${s.carSpeed} km/h`;
    }

    const wb = FORENSIC_CHALLENGES.find((b) => b.id === (s.activeWaypointId || 'building-1'));
    if (wb) {
      if (lineRef.current) {
        lineRef.current.setAttribute('x1', String(px));
        lineRef.current.setAttribute('y1', String(py));
        lineRef.current.setAttribute('x2', String(mapCoordIn(wb.coordinates[0], size)));
        lineRef.current.setAttribute('y2', String(mapCoordIn(wb.coordinates[2], size)));
      }
      if (distRef.current) {
        const d = Math.round(
          Math.hypot(s.playerPos[0] - wb.coordinates[0], s.playerPos[2] - wb.coordinates[2])
        );
        distRef.current.textContent = `${d}m`;
      }
    }
  }, []);

  // Subscribe to the store once and paint imperatively (no component re-render)
  useEffect(() => {
    paint();
    return useGameStore.subscribe(paint);
  }, [paint]);

  // Repaint when layout-relevant, rarely-changing values change
  useEffect(() => {
    paint();
  }, [radarSize, activeWaypointId, paint]);

  // Find active waypoint building info
  const waypointBuilding = FORENSIC_CHALLENGES.find((b) => b.id === (activeWaypointId || 'building-1'));

  // Teleport car directly to building apron
  const handleTeleport = (bldgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const b = FORENSIC_CHALLENGES.find((x) => x.id === bldgId);
    if (b) {
      if (soundEnabled) sound.playEnter();
      // Position car slightly in front of building
      const [bx, , bz] = b.coordinates;
      requestTeleport([bx * 0.85, 0.55, bz * 0.85]);
      setActiveBuilding(bldgId);
      setActiveWaypoint(bldgId);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-30 font-mono select-none">
      <div
        className="p-3 rounded-2xl border-2 transition-all duration-300"
        style={{
          background: theme.uiPanelBg,
          borderColor: `${accent}70`,
          boxShadow: `0 0 30px ${accent}30`,
        }}
      >
        {/* Header HUD */}
        <div
          className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2 border-b border-white/20 pb-1.5"
          style={{ color: accent }}
        >
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span className="text-white font-extrabold">TACTICAL FORENSICS MAP</span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              ref={compassRef}
              className="text-cyan-300 font-mono text-[9px] bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/40"
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:text-cyan-300 p-0.5 rounded transition-all"
              title={isExpanded ? 'Minimize Map' : 'Expand Tactical View'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Map Canvas Box */}
        <div
          className="relative rounded-xl overflow-hidden border transition-all duration-300"
          style={{
            width: `${radarSize}px`,
            height: `${radarSize}px`,
            background: `${theme.pageBg}`,
            borderColor: `${accent}40`,
          }}
        >
          {/* Radar Background Grid & Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[85%] h-[85%] rounded-full border border-dashed" style={{ borderColor: `${accent}25` }} />
            <div className="w-[55%] h-[55%] rounded-full border" style={{ borderColor: `${accent}30` }} />
            <div className="w-[25%] h-[25%] rounded-full border border-dotted" style={{ borderColor: `${accent}35` }} />
            <div className="w-full h-[1px] absolute" style={{ background: `${accent}25` }} />
            <div className="h-full w-[1px] absolute" style={{ background: `${accent}25` }} />
          </div>

          {/* SVG Navigation Guide Line (From Player to Waypoint) */}
          {waypointBuilding && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                ref={lineRef}
                stroke="#00f0ff"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* Building Markers */}
          {ACTIVE_CHALLENGES.map((bldg) => {
            const bx = mapCoordIn(bldg.coordinates[0], radarSize);
            const by = mapCoordIn(bldg.coordinates[2], radarSize);
            const isDone = clearedBuildingIds.includes(bldg.id);
            const isActive = activeBuildingId === bldg.id;
            const isTarget = activeWaypointId === bldg.id;

            return (
              <div
                key={bldg.id}
                onClick={() => {
                  if (soundEnabled) sound.playClick();
                  setActiveWaypoint(bldg.id);
                }}
                className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isTarget ? 'ring-2 ring-cyan-300 ring-offset-1 scale-125' : 'hover:scale-115'
                }`}
                style={{
                  left: `${bx}px`,
                  top: `${by}px`,
                  background: isDone ? '#00ff88' : isActive ? accent : `${bldg.color}`,
                  border: `2px solid ${isDone ? '#ffffff' : '#ffffff'}`,
                }}
                title={`Sector ${bldg.buildingNumber}: ${bldg.name} (Click to Set GPS)`}
              >
                <span className="text-[9px] font-black text-white">{bldg.buildingNumber}</span>
              </div>
            );
          })}

          {/* Player Car Blip (With Direction Needle) — position/rotation set imperatively */}
          <div
            ref={blipRef}
            className="absolute w-4 h-4 -ml-2 -mt-2 pointer-events-none z-10 transition-transform duration-75"
          >
            <div className="w-full h-full rounded-full border-2 border-white shadow-[0_0_12px_#00f0ff] flex items-center justify-center bg-cyan-400">
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-slate-900 -mt-1" />
            </div>
          </div>
        </div>

        {/* Waypoint Telemetry Bar & Controls */}
        <div className="mt-2 flex items-center justify-between text-[10px]">
          {waypointBuilding ? (
            <div className="flex items-center space-x-1.5 truncate max-w-[170px]">
              <Navigation className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-bounce" />
              <div className="truncate">
                <span className="font-bold text-white">SEC-0{waypointBuilding.buildingNumber}:</span>{' '}
                <span ref={distRef} className="text-cyan-300 font-mono font-bold" />
              </div>
            </div>
          ) : (
            <span className="text-gray-300 text-[9px]">Select building to track</span>
          )}

          {/* Teleport / Warp to Waypoint button */}
          {waypointBuilding && (
            <button
              onClick={(e) => handleTeleport(waypointBuilding.id, e)}
              className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-extrabold text-[9px] flex items-center space-x-1 shadow transition-all"
              title="Fast travel to this building's forensic perimeter"
            >
              <Zap className="w-2.5 h-2.5" />
              <span>WARP</span>
            </button>
          )}
        </div>

        {/* Telemetry Footer (speed only — toolbar options removed) */}
        <div className="mt-2 pt-1.5 border-t border-white/20 flex items-center justify-end text-[9px] text-gray-200">
          <div ref={speedRef} className="text-[9px] font-mono text-cyan-300 font-bold" />
        </div>
      </div>
    </div>
  );
};
