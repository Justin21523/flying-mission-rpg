import type { TransformationPolishPreset } from '../../types/game/transformationPolish';

// Batch 12 — seed transformation polish presets for the lead characters (speed / rescue / engineer). Theme
// colors echo each character's `color` in characters.ts; the director falls back to character.color for any
// character without a preset.

export const SEED_TRANSFORMATION_POLISH: TransformationPolishPreset[] = [
  {
    id: 'xfpolish_jett',
    characterId: 'char_jett',
    themeColor: '#e8442c',
    secondaryColor: '#ffd23f',
    particleStyle: 'speed',
    energyRingColor: '#ff7a4d',
    backdropPulseIntensity: 1.2,
    quickModePolishLevel: 'flashy',
  },
  {
    id: 'xfpolish_paul',
    characterId: 'char_paul',
    themeColor: '#2b4c8c',
    secondaryColor: '#9fd0ff',
    particleStyle: 'rescue',
    energyRingColor: '#7fd0ff',
    backdropPulseIntensity: 0.8,
    quickModePolishLevel: 'standard',
  },
  {
    id: 'xfpolish_donnie',
    characterId: 'char_donnie',
    themeColor: '#f5b21e',
    secondaryColor: '#7a5a1e',
    particleStyle: 'engineer',
    energyRingColor: '#ffd23f',
    backdropPulseIntensity: 1,
    quickModePolishLevel: 'standard',
  },
];
