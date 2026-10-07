import { ThemePreset } from './types';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  tagline: string;
  // Page / body background — should match the 3D sky so no jarring black border
  pageBg: string;
  // Semi-transparent panel bg for UI cards (inline style)
  uiPanelBg: string;
  // Raw hex of the primary accent color for inline styles / gradients
  uiAccentHex: string;
  skyColor: string;
  skyHorizonColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientLightColor: string;
  ambientLightIntensity: number;
  dirLightColor: string;
  dirLightIntensity: number;
  spotLightColor: string;
  spotLightIntensity: number;
  groundColor: string;
  groundGridPrimary: string;
  groundGridSecondary: string;
  roadColor: string;
  roadTrimColor: string;
  particleColor: string;
  buildingBaseColor: string;
  buildingGlassColor: string;
  buildingBeaconColor: string;
  buildingClearedColor: string;
  playerVisorColor: string;
  playerRingColor: string;
  playerProjectorColor: string;
  
  // UI colors
  uiBorderClass: string;
  uiGlowClass: string;
  uiTextAccentClass: string;
  uiBgBadgeClass: string;
  uiButtonClass: string;
  uiActiveTabClass: string;
}

export const THEMES: Record<ThemePreset, ThemeConfig> = {
  'cyberpunk-neon': {
    id: 'cyberpunk-neon',
    name: 'Neon Amber & Orange Dawn',
    tagline: 'Vibrant Safety Orange, Golden Amber & Electric Cyan Laser Grid',
    pageBg: '#3b1700',
    uiPanelBg: 'rgba(59, 23, 0, 0.88)',
    uiAccentHex: '#ff6600',
    skyColor: '#4a1e03',
    skyHorizonColor: '#401800',
    fogColor: '#481c02',
    fogNear: 80,
    fogFar: 320,
    ambientLightColor: '#ffaa66',
    ambientLightIntensity: 2.2,
    dirLightColor: '#00f0ff',
    dirLightIntensity: 2.5,
    spotLightColor: '#ff6600',
    spotLightIntensity: 6.5,
    groundColor: '#5c2404',
    groundGridPrimary: '#ff6600',
    groundGridSecondary: '#00e5ff',
    roadColor: '#00f0ff',
    roadTrimColor: '#ff6600',
    particleColor: '#ff9900',
    buildingBaseColor: '#4a1c02',
    buildingGlassColor: '#ff8800',
    buildingBeaconColor: '#ff6600',
    buildingClearedColor: '#00ff88',
    playerVisorColor: '#00f0ff',
    playerRingColor: '#ff6600',
    playerProjectorColor: '#00f0ff',
    uiBorderClass: 'border-orange-500',
    uiGlowClass: 'shadow-[0_0_25px_rgba(255,102,0,0.5)]',
    uiTextAccentClass: 'text-orange-400',
    uiBgBadgeClass: 'bg-orange-500/20 border-orange-400/50 text-orange-300',
    uiButtonClass: 'bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-slate-900 font-extrabold',
    uiActiveTabClass: 'bg-orange-500 text-slate-900 font-extrabold shadow-[0_0_20px_rgba(255,102,0,0.6)]',
  },
  'deus-ex': {
    id: 'deus-ex',
    name: 'Solaris Gold & Azure',
    tagline: 'Radiant Golden Dawn with Deep Royal Indigo Skies',
    pageBg: '#25447f',
    uiPanelBg: 'rgba(37, 68, 127, 0.88)',
    uiAccentHex: '#f5b838',
    skyColor: '#31569e',
    skyHorizonColor: '#2b4f91',
    fogColor: '#2f5296',
    fogNear: 110,
    fogFar: 450,
    ambientLightColor: '#bfd2ff',
    ambientLightIntensity: 2.2,
    dirLightColor: '#ffd778',
    dirLightIntensity: 2.5,
    spotLightColor: '#ffaa00',
    spotLightIntensity: 6.0,
    groundColor: '#3a62aa',
    groundGridPrimary: '#f5b838',
    groundGridSecondary: '#6289d6',
    roadColor: '#f5b838',
    roadTrimColor: '#ffd980',
    particleColor: '#ffd778',
    buildingBaseColor: '#2b4d8a',
    buildingGlassColor: '#f5b838',
    buildingBeaconColor: '#ffd980',
    buildingClearedColor: '#00ff88',
    playerVisorColor: '#ffd980',
    playerRingColor: '#f5b838',
    playerProjectorColor: '#f5b838',
    uiBorderClass: 'border-amber-400',
    uiGlowClass: 'shadow-[0_0_25px_rgba(245,184,56,0.5)]',
    uiTextAccentClass: 'text-amber-400',
    uiBgBadgeClass: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
    uiButtonClass: 'bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-amber-950 font-extrabold',
    uiActiveTabClass: 'bg-amber-400 text-amber-950 font-extrabold shadow-[0_0_20px_rgba(245,184,56,0.6)]',
  },
  'blade-runner': {
    id: 'blade-runner',
    name: 'Vibrant Amber Sunset',
    tagline: 'Warm Crimson Twilight with Luminous Neon Orange Roads',
    pageBg: '#6b2716',
    uiPanelBg: 'rgba(107, 39, 22, 0.88)',
    uiAccentHex: '#ff6600',
    skyColor: '#802f1a',
    skyHorizonColor: '#782d1a',
    fogColor: '#7d2e1b',
    fogNear: 110,
    fogFar: 450,
    ambientLightColor: '#f7aa88',
    ambientLightIntensity: 2.2,
    dirLightColor: '#ff7700',
    dirLightIntensity: 2.6,
    spotLightColor: '#ff4400',
    spotLightIntensity: 6.5,
    groundColor: '#96371f',
    groundGridPrimary: '#ff6600',
    groundGridSecondary: '#c7593c',
    roadColor: '#ff6600',
    roadTrimColor: '#ffaa00',
    particleColor: '#ffbb44',
    buildingBaseColor: '#782c19',
    buildingGlassColor: '#ff6600',
    buildingBeaconColor: '#ffaa00',
    buildingClearedColor: '#00ff88',
    playerVisorColor: '#ff6600',
    playerRingColor: '#ffaa00',
    playerProjectorColor: '#ff6600',
    uiBorderClass: 'border-orange-500',
    uiGlowClass: 'shadow-[0_0_25px_rgba(255,102,0,0.5)]',
    uiTextAccentClass: 'text-orange-400',
    uiBgBadgeClass: 'bg-orange-500/20 border-orange-400/50 text-orange-300',
    uiButtonClass: 'bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-amber-950 font-extrabold',
    uiActiveTabClass: 'bg-orange-500 text-amber-950 font-extrabold shadow-[0_0_20px_rgba(255,102,0,0.6)]',
  }
};
