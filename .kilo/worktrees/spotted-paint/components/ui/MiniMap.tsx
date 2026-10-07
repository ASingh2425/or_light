'use client';

import React, { useCallback, useState } from 'react';
import { Compass, Navigation, ZoomIn, ZoomOut, Layers, Maximize2, Minimize2, Radio, Zap } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { FORENSIC_CHALLENGES } from '@/lib/challenges';
import { EVIDENCE_MARKERS } from '@/lib/arenaPositions';
import { THEMES } from '@/lib/themes';
import { sound } from '@/components/audio/SoundEffects';

// Inset (px) that keeps every blip and pin off the radar border.
const RADAR_PAD = 4;

// World XZ -> radar pixels. Every radar layer (evidence pins, building markers,
// GPS guide line and the player blip) goes through this one helper, so they all
// share a single coordinate space at any zoom level.
function mapCoord(val: number, arenaBound: number, radarSize: number): number {
  const norm = (val + arenaBound) / (arenaBound * 2);
  return Math.max(RADAR_PAD, Math.min(radarSize - RADAR_PAD, norm * radarSize));
}

interface RadarMarkersProps {
  radarSize: number;
  arenaBound: number;
  accent: string;
  showRangeRings: boolean;
  showEvidenceTags: boolean;
  clearedBuildingIds: string[];
  activeBuildingId: string | null;
  activeWaypointId: string | null;
  onSelectWaypoint: (bldgId: string) => void;
}

/**
 * Everything on the radar that does NOT follow the car: the range rings, the
 * numbered evidence pins and the five sector markers.
 *
 * The store republishes playerPos about 10x/second, which re-renders this
 * component's parent on every tick. Memoising this layer keeps those ticks from
 * re-creating a dozen style objects and reconciling a dozen absolutely
 * positioned elements per second for data that has not changed.
 */
const RadarMarkers = React.memo(function RadarMarkers({
  radarSize,
  arenaBound,
  accent,
  showRangeRings,
  showEvidenceTags,
  clearedBuildingIds,
  activeBuildingId,
  activeWaypointId,
  onSelectWaypoint,
}: RadarMarkersProps) {
  return (
    <>
      {/* Radar Background Grid & Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {showRangeRings && (
          <>
            <div className="w-[85%] h-[85%] rounded-full border border-dashed" style={{ borderColor: `${accent}25` }} />
            <div className="w-[55%] h-[55%] rounded-full border" style={{ borderColor: `${accent}30` }} />
            <div className="w-[25%] h-[25%] rounded-full border border-dotted" style={{ borderColor: `${accent}35` }} />
          </>
        )}
        <div className="w-full h-[1px] absolute" style={{ background: `${accent}25` }} />
        <div className="h-full w-[1px] absolute" style={{ background: `${accent}25` }} />
      </div>

      {/* Numbered Evidence Marker Pins
          (positions derived from the sector coordinates — same source as the
          3D evidence cones, see lib/arenaPositions.ts) */}
      {showEvidenceTags &&
        EVIDENCE_MARKERS.map((ev) => (
          <div
            key={`ev-${ev.challengeId}`}
            className="absolute w-2.5 h-2.5 -ml-1 -mt-1 rounded-sm bg-amber-400 border border-white flex items-center justify-center shadow pointer-events-none"
            style={{
              left: `${mapCoord(ev.x, arenaBound, radarSize)}px`,
              top: `${mapCoord(ev.z, arenaBound, radarSize)}px`,
            }}
          >
            <span className="text-[6px] font-black text-slate-900 leading-none">{ev.num}</span>
          </div>
        ))}

      {/* Building Markers */}
      {FORENSIC_CHALLENGES.map((bldg) => {
        const bx = mapCoord(bldg.coordinates[0], arenaBound, radarSize);
        const by = mapCoord(bldg.coordinates[2], arenaBound, radarSize);
        const isDone = clearedBuildingIds.includes(bldg.id);
        const isActive = activeBuildingId === bldg.id;
        const isTarget = activeWaypointId === bldg.id;

        return (
          <div
            key={bldg.id}
            onClick={() => onSelectWaypoint(bldg.id)}
            className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 shadow-lg ${
              isTarget ? 'ring-2 ring-cyan-300 ring-offset-1 scale-125' : 'hover:scale-115'
            }`}
            style={{
              left: `${bx}px`,
              top: `${by}px`,
              background: isDone ? '#00ff88' : isActive ? accent : `${bldg.color}`,
              border: '2px solid #ffffff',
            }}
            title={`Sector ${bldg.buildingNumber}: ${bldg.name} (Click to Set GPS)`}
          >
            <span className="text-[9px] font-black text-white">{bldg.buildingNumber}</span>
          </div>
        );
      })}
    </>
  );
});

export const MiniMap: React.FC = () => {
  const playerPos = useGameStore((state) => state.playerPos);
  const playerHeading = useGameStore((state) => state.playerHeading);
  const carSpeed = useGameStore((state) => state.carSpeed);
  const clearedBuildingIds = useGameStore((state) => state.clearedBuildingIds);
  const activeBuildingId = useGameStore((state) => state.activeBuildingId);
  const activeWaypointId = useGameStore((state) => state.activeWaypointId);
  const setActiveWaypoint = useGameStore((state) => state.setActiveWaypoint);
  const setActiveBuilding = useGameStore((state) => state.setActiveBuilding);
  const setPlayerPos = useGameStore((state) => state.setPlayerPos);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const themePreset = useGameStore((state) => state.themePreset);
  const theme = THEMES[themePreset] || THEMES['cyberpunk-neon'];

  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);
  const [showRangeRings, setShowRangeRings] = useState(true);
  const [showEvidenceTags, setShowEvidenceTags] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const accent = theme.uiAccentHex;

  // Radar display dimensions (standard vs expanded tactical view)
  const radarSize = isExpanded ? 280 : 160;
  // World coordinate bounds: [-60, 60] (2x scale)
  const arenaBound = 60 / zoomLevel;

  const playerRadarX = mapCoord(playerPos[0], arenaBound, radarSize);
  const playerRadarY = mapCoord(playerPos[2], arenaBound, radarSize);

  // Find active waypoint building info
  const waypointBuilding = FORENSIC_CHALLENGES.find((b) => b.id === (activeWaypointId || 'building-1'));
  const waypointDist = waypointBuilding
    ? Math.round(
        Math.hypot(
          playerPos[0] - waypointBuilding.coordinates[0],
          playerPos[2] - waypointBuilding.coordinates[2]
        )
      )
    : 0;

  const handleSelectWaypoint = useCallback(
    (bldgId: string) => {
      if (soundEnabled) sound.playClick();
      setActiveWaypoint(bldgId);
    },
    [soundEnabled, setActiveWaypoint]
  );

  // Teleport car directly to building apron.
  // This only writes the store: Player3D treats an external playerPos write as a
  // teleport, and nothing here keeps a local copy of the position, so the blip
  // always reads the single source of truth back out of the store.
  const handleTeleport = (bldgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const b = FORENSIC_CHALLENGES.find((x) => x.id === bldgId);
    if (b) {
      if (soundEnabled) sound.playEnter();
      const [bx, , bz] = b.coordinates;
      // Offset outward from the arena centre so the car lands on the apron
      // outside the building's hexagonal base (radius ~6.4), not inside it.
      const dist = Math.hypot(bx, bz) || 1;
      const offset = 7.5;
      setPlayerPos([bx + (bx / dist) * offset, 0.55, bz + (bz / dist) * offset]);
      setActiveBuilding(bldgId);
      setActiveWaypoint(bldgId);
    }
  };

  // Convert heading angle to 8-point compass
  const getCompassDir = (deg: number) => {
    const d = (deg % 360 + 360) % 360;
    if (d >= 337.5 || d < 22.5) return 'N';
    if (d >= 22.5 && d < 67.5) return 'NE';
    if (d >= 67.5 && d < 112.5) return 'E';
    if (d >= 112.5 && d < 157.5) return 'SE';
    if (d >= 157.5 && d < 202.5) return 'S';
    if (d >= 202.5 && d < 247.5) return 'SW';
    if (d >= 247.5 && d < 292.5) return 'W';
    return 'NW';
  };

  return (
    <div className="fixed bottom-5 left-5 z-30 font-mono select-none">
      <div
        className="p-3 rounded-2xl backdrop-blur-2xl border-2 transition-all duration-300"
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
            <span className="text-cyan-300 font-mono text-[9px] bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/40">
              {getCompassDir(playerHeading)} {playerHeading}°
            </span>
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
          {/* SVG Navigation Guide Line (From Player to Waypoint) */}
          {waypointBuilding && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1={playerRadarX}
                y1={playerRadarY}
                x2={mapCoord(waypointBuilding.coordinates[0], arenaBound, radarSize)}
                y2={mapCoord(waypointBuilding.coordinates[2], arenaBound, radarSize)}
                stroke="#00f0ff"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
            </svg>
          )}

          <RadarMarkers
            radarSize={radarSize}
            arenaBound={arenaBound}
            accent={accent}
            showRangeRings={showRangeRings}
            showEvidenceTags={showEvidenceTags}
            clearedBuildingIds={clearedBuildingIds}
            activeBuildingId={activeBuildingId}
            activeWaypointId={activeWaypointId}
            onSelectWaypoint={handleSelectWaypoint}
          />

          {/* Player Car Blip (With Direction Needle) */}
          <div
            className="absolute w-4 h-4 -ml-2 -mt-2 pointer-events-none z-10 transition-transform duration-75"
            style={{
              left: `${playerRadarX}px`,
              top: `${playerRadarY}px`,
              transform: `rotate(${playerHeading}deg)`,
            }}
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
                <span className="text-cyan-300 font-mono font-bold">{waypointDist}m</span>
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

        {/* Tactical Toolbar (Zoom & Layer toggles) */}
        <div className="mt-2 pt-1.5 border-t border-white/20 flex items-center justify-between text-[9px] text-gray-200">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel((z) => (z === 2 ? 1 : z === 1.5 ? 2 : 1.5))}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center space-x-0.5"
              title="Toggle Zoom Level"
            >
              <ZoomIn className="w-3 h-3" />
              <span>{zoomLevel}x</span>
            </button>
            <button
              onClick={() => setShowEvidenceTags(!showEvidenceTags)}
              className={`p-1 rounded flex items-center space-x-0.5 ${
                showEvidenceTags ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'bg-white/10 text-gray-400'
              }`}
              title="Toggle Evidence Marker Pins"
            >
              <Layers className="w-3 h-3" />
              <span>EV</span>
            </button>
            <button
              onClick={() => setShowRangeRings(!showRangeRings)}
              className={`p-1 rounded flex items-center space-x-0.5 ${
                showRangeRings ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-white/10 text-gray-400'
              }`}
              title="Toggle Range Rings"
            >
              <Compass className="w-3 h-3" />
              <span>RNG</span>
            </button>
          </div>

          <div className="text-[9px] font-mono text-cyan-300 font-bold">
            SPD: {carSpeed} km/h
          </div>
        </div>
      </div>
    </div>
  );
};
