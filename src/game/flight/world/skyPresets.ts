import type { SkyPreset } from '../../../types/game/flight';

// Named sky looks — fill sensible sky/fog colours for the world-flight ambience (manual colour fields still
// override per-field). Kept in its own module so the component files stay fast-refresh-clean.
export const SKY_PRESET_COLORS: Record<SkyPreset, { top: string; bottom: string; fog: string }> = {
  clear: { top: '#3f8fe0', bottom: '#dff0ff', fog: '#cfe7ff' },
  cloudy: { top: '#6b86a6', bottom: '#cfd9e6', fog: '#c4cfdc' },
  sunset: { top: '#2c4a73', bottom: '#ffd6a0', fog: '#f0b27a' },
  night: { top: '#0a1430', bottom: '#24304f', fog: '#1a2238' },
  storm: { top: '#2b323d', bottom: '#7f8a99', fog: '#8a96a4' },
};
