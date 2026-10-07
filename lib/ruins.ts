/**
 * Decorative world dressing for the post-war theme.
 *
 * Ruins are solid (the car is pushed out of them like a building shell) but are
 * not sectors: no terminal, no beacon, no flag. They sit in the gaps between
 * the sector approach lines so they never block a path to a building.
 */
export interface RuinSite {
  id: 'ruin-tower' | 'ruin-shell' | 'ruin-silo' | 'ruin-quarantine';
  x: number;
  z: number;
  /** Collision radius used by the car's push-out pass. */
  radius: number;
}

export const RUIN_SITES: readonly RuinSite[] = [
  { id: 'ruin-tower', x: -52, z: 2, radius: 5.2 },
  { id: 'ruin-shell', x: 52, z: 4, radius: 5.6 },
  { id: 'ruin-silo', x: 0, z: -50, radius: 5.4 },
  // Former building-5 (SEC-05): blown apart, no terminal, no flag.
  { id: 'ruin-quarantine', x: 0, z: 52, radius: 5.8 },
];

/** The sector whose building is overrun. Its CTF still works normally. */
export const ZOMBIE_SOURCE_ID = 'building-4';

/** Zombies shambling out of the infested sector at any one time. */
export const ZOMBIE_COUNT = 12;
