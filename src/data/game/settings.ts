import type { GameSettings } from '../../types/game/settings';

// The single default game-settings document (the "1份遊戲設定" seed). Comfort-first defaults.
export const DEFAULT_SETTINGS: GameSettings = {
  flightAssist: 'simple',
  transformMode: 'full',
  masterVolume: 0.8,
  sfxVolume: 0.9,
  musicVolume: 0.6,
  quality: 'medium',
  reduceMotion: false,
};
