// Destination the portal redirects to after the 5-flag finale sequence.
// TODO: swap for the real final URL when provided.
export const FINAL_REDIRECT_URL = 'https://www.youtube.com/watch?v=9bZkp7q19f0';

// Finale timeline (seconds) — must match FinaleSequence.tsx
export const FINALE_BEAM_DURATION = 2.2; // lasers finish growing
export const FINALE_TOTAL_DURATION = 4.4; // sequence done -> white flash + redirect
export const FINALE_REDIRECT_DELAY_MS = 1450; // flash visible before navigating
