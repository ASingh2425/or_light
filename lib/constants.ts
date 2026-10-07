// Destination the finale portal hands the player off to once every live sector
// is cleared AND the 4th fragment .csv has been downloaded.
// TODO: swap for the real "next site" URL when provided (placeholder for now).
export const FINAL_REDIRECT_URL = 'https://example.com';

// Finale timeline (seconds) — must match FinaleSequence.tsx
export const FINALE_BEAM_DURATION = 2.2; // rays finish growing
export const FINALE_TOTAL_DURATION = 4.4; // sequence done -> flash + exit panel
export const FINALE_REDIRECT_DELAY_MS = 600; // button press -> navigation (manual only)

// Delay between the 4th sector unlocking and the automatic finale takeover.
export const FINALE_AUTO_START_DELAY_MS = 1700;

// Wide crane framing used while the finale runs (see Player3D.tsx).
// Kept inside the sky dome (r=135, y<=65) and pulled back far enough to keep
// every building plus the convergence point inside a 62° frustum.
export const FINALE_CAM_RADIUS = 80;
export const FINALE_CAM_HEIGHT = 58;
export const FINALE_CAM_FOV = 62;
