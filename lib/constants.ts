// Destination the finale portal hands the player off to once every live sector
// is cleared AND the 4th fragment .csv has been downloaded.
// TODO: swap for the real "next site" URL when provided (placeholder for now).
export const FINAL_REDIRECT_URL = 'https://orange-to-red-slideshow.vercel.app/transition/radio-forensics';

// Finale timeline (seconds) — must match FinaleSequence.tsx
export const FINALE_BEAM_DURATION = 2.2; // rays finish growing
export const FINALE_TOTAL_DURATION = 4.4; // sequence done -> flash + exit panel
// Button press -> navigation. The portal warp animation runs for the whole
// window (never an instant jump); must match .finale-warp in globals.css.
export const FINALE_REDIRECT_DELAY_MS = 2400;

// Delay between the 4th sector unlocking and the automatic finale takeover.
export const FINALE_AUTO_START_DELAY_MS = 1700;

// Wide crane framing used while the finale runs (see Player3D.tsx).
// Kept inside the sky dome (r=135, y<=65) and pulled back far enough to keep
// every building plus the convergence point inside a 62° frustum.
export const FINALE_CAM_RADIUS = 80;
export const FINALE_CAM_HEIGHT = 58;
export const FINALE_CAM_FOV = 62;

// ── Gameplay collision ─────────────────────────────────────────────────────
// Invisible round arena wall on the glowing barricade ring. Posts stand at
// r=78; the car's center stops at 76 so its ~1.15-long nose never reaches
// them. Replaces the old square ±60 clamp (whose diagonal corners reached
// r≈85 and let the car slip outside the barricade).
// Ruin (broken building) collision radii live in lib/ruins.ts; CTF sector
// buildings are drive-through by design (terminal opens at 6.2 instead).
export const ARENA_WALL_RADIUS = 76;
