import { FORENSIC_CHALLENGES } from './challenges';

/**
 * Single source of truth for where a sector's evidence marker belongs on the
 * arena floor.
 *
 * The arena was scaled up 2x (sectors moved out to +-42..52 units) but the
 * markers used to be hardcoded next to each consumer, which stranded every
 * cone and minimap pin ~20 units away from the sector it names. Deriving them
 * from `FORENSIC_CHALLENGES` means a coordinate edit in lib/challenges.ts can
 * never desync the 3D cones and the 2D minimap pins again.
 */

/**
 * Distance a marker sits in front of its building, measured along the line that
 * runs from the arena centre out through the building.
 *
 * 9 units clears the 6.6-unit building collision radius (BUILDING_COLLISION_RADIUS
 * in components/canvas/Player3D.tsx), so a marker cone never spawns inside a
 * monolith or inside the collision shell the car gets pushed out of.
 */
export const EVIDENCE_MARKER_OFFSET = 9;

export interface ArenaXZ {
  x: number;
  z: number;
}

export interface EvidenceMarker extends ArenaXZ {
  /** Matching FORENSIC_CHALLENGES id, e.g. 'building-3'. */
  challengeId: string;
  /** Zero-padded marker number shown on the cone tag and the minimap pin. */
  num: string;
  /** Debris descriptor shown on the cone tag. */
  label: string;
  /** Dossier image opened by the cone tag. */
  imageUrl: string;
}

/** Marker copy per sector, keyed by challenge id so it cannot drift either. */
const EVIDENCE_LABELS: Record<string, string> = {
  'building-1': 'REPO MIRROR (OFFLINE)',
  'building-2': 'ARCHIVIST FEED (OFFLINE)',
  'building-3': 'SEALED FEATURE PLATE',
  'building-4': 'HASH MANIFEST EXPORT',
  'building-5': 'SEALING CERTIFICATE PAIR',
};

function buildMarker(challenge: (typeof FORENSIC_CHALLENGES)[number]): EvidenceMarker {
  const [bx, , bz] = challenge.coordinates;
  const radius = Math.hypot(bx, bz);
  // Step towards the arena centre by EVIDENCE_MARKER_OFFSET. A sector parked
  // within the offset of the centre would give a negative or NaN scale, so
  // clamp to the centre instead of emitting garbage coordinates.
  const scale = radius > EVIDENCE_MARKER_OFFSET ? (radius - EVIDENCE_MARKER_OFFSET) / radius : 0;

  return {
    challengeId: challenge.id,
    num: String(challenge.buildingNumber).padStart(2, '0'),
    label: EVIDENCE_LABELS[challenge.id] ?? `SECTOR 0${challenge.buildingNumber} DEBRIS`,
    x: bx * scale,
    z: bz * scale,
    imageUrl: challenge.evidenceImage ?? `/images/forensic-evidence-${challenge.buildingNumber}.svg`,
  };
}

const MARKERS_BY_ID: ReadonlyMap<string, EvidenceMarker> = new Map(
  FORENSIC_CHALLENGES.map((challenge) => [challenge.id, buildMarker(challenge)] as const)
);

/**
 * Every sector's evidence marker, in FORENSIC_CHALLENGES order. Built once at
 * module load so consumers can map over it during render without allocating.
 */
export const EVIDENCE_MARKERS: readonly EvidenceMarker[] = Array.from(MARKERS_BY_ID.values());

/** Look up the on-screen XZ position of one sector's evidence marker. */
export function getEvidencePosition(challengeId: string): ArenaXZ {
  const marker = MARKERS_BY_ID.get(challengeId);
  if (!marker) {
    throw new Error(`arenaPositions: unknown challenge id "${challengeId}"`);
  }
  return { x: marker.x, z: marker.z };
}
