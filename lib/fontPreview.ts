/**
 * TEMPORARY font preview helper (dev-only evaluation tool — not a product
 * feature). Candidates load from Google Fonts on demand and are applied by
 * setting the --app-font CSS variable (see globals.css: body + .font-mono
 * both resolve to it), so the change is instantly visible across the HUD.
 */

export interface FontOption {
  id: string;
  name: string;
  css: string;
  kind: 'system' | 'display' | 'mono';
  note: string;
}

export const DEFAULT_FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const FONT_OPTIONS: FontOption[] = [
  { id: 'system', name: 'System Mono', css: DEFAULT_FONT_STACK, kind: 'system', note: 'Current default — native & instant' },
  { id: 'chakra', name: 'Chakra Petch', css: "'Chakra Petch', sans-serif", kind: 'display', note: 'Angular techy — option A (recommended)' },
  { id: 'orbitron', name: 'Orbitron', css: "'Orbitron', sans-serif", kind: 'display', note: 'Heavy sci-fi — option B' },
  { id: 'rajdhani', name: 'Rajdhani', css: "'Rajdhani', sans-serif", kind: 'display', note: 'Condensed HUD — option C' },
  { id: 'sharetech', name: 'Share Tech Mono', css: "'Share Tech Mono', monospace", kind: 'mono', note: 'Pure terminal — option D' },
  { id: 'jetbrains', name: 'JetBrains Mono', css: "'JetBrains Mono', monospace", kind: 'mono', note: 'Modern coding mono' },
  { id: 'plex', name: 'IBM Plex Mono', css: "'IBM Plex Mono', monospace", kind: 'mono', note: 'Neutral professional mono' },
  { id: 'fira', name: 'Fira Code', css: "'Fira Code', monospace", kind: 'mono', note: 'Ligatures for code blocks' },
];

const GOOGLE_URL =
  'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&family=Fira+Code:wght@400;600&family=IBM+Plex+Mono:wght@400;600&family=JetBrains+Mono:wght@400;700&family=Orbitron:wght@500;700&family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap';

const STORAGE_KEY = 'manu-preview-font';

let linkInjected = false;

/** Inject the Google Fonts stylesheet once (so picks apply without FOUT). */
export const injectFontStyles = () => {
  if (linkInjected || typeof document === 'undefined') return;
  linkInjected = true;
  const pre = document.createElement('link');
  pre.rel = 'preconnect';
  pre.href = 'https://fonts.googleapis.com';
  document.head.appendChild(pre);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_URL;
  document.head.appendChild(link);
};

/** Apply a font option live (CSS var + localStorage). */
export const applyFont = (id: string): string => {
  injectFontStyles();
  const opt = FONT_OPTIONS.find((o) => o.id === id) || FONT_OPTIONS[0];
  document.documentElement.style.setProperty('--app-font', opt.css);
  try {
    localStorage.setItem(STORAGE_KEY, opt.id);
  } catch {
    /* private mode etc. */
  }
  return opt.id;
};

/** Restore the persisted choice on mount. Returns the active option id. */
export const initFontPreview = (): string => {
  let id = 'system';
  try {
    id = localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    /* ignore */
  }
  if (!FONT_OPTIONS.some((o) => o.id === id)) id = 'system';
  if (id !== 'system') applyFont(id);
  else document.documentElement.style.setProperty('--app-font', DEFAULT_FONT_STACK);
  return id;
};
