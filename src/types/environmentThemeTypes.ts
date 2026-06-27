export type EnvironmentThemeDefinition = {
  id: string;
  name: string;
  themeType:
    | 'sunny-harbor'
    | 'downtown-traffic'
    | 'factory-core'
    | 'mountain-tunnel'
    | 'skyport'
    | 'night-city'
    | 'storm-coast'
    | 'custom';
  sky: {
    preset: 'day' | 'sunset' | 'night' | 'storm' | 'indoor' | 'custom';
    color?: string;
  };
  lighting: {
    ambientIntensity: number;
    directionalIntensity: number;
    accentLightColor?: string;
    hazardLightColor?: string;
  };
  fog?: {
    enabled: boolean;
    color: string;
    density: number;
    heightFog?: boolean;
  };
  weather?: {
    type: 'none' | 'rain' | 'wind' | 'dust' | 'smoke' | 'storm';
    intensity: number;
  };
  ground: {
    materialPresetId: string;
    gridVisible?: boolean;
    hazardOverlay?: boolean;
  };
  propSetIds: string[];
  hazardPresetIds: string[];
  ambientVfxPresetIds?: string[];
  editorMeta?: {
    notes?: string;
  };
};

export interface EnvironmentPropSetDefinition {
  id: string;
  name: string;
  propIds: string[];
  colorPalette?: string[];
  editorMeta?: { notes?: string };
}

export interface EnvironmentHazardPresetDefinition {
  id: string;
  name: string;
  hazardType:
    | 'traffic'
    | 'electric'
    | 'smoke'
    | 'dust'
    | 'wind'
    | 'storm'
    | 'blocked-path'
    | 'energy-barrier'
    | 'damage-field'
    | 'visibility'
    | 'push-field'
    | 'none';
  intensity: number;
  damagePerSecond?: number;
  editorMeta?: { notes?: string };
}

export interface AmbientVfxPresetDefinition {
  id: string;
  name: string;
  vfxType:
    | 'spark'
    | 'smoke'
    | 'rain'
    | 'wind-lines'
    | 'dust'
    | 'light-beam'
    | 'neon-flicker'
    | 'water-splash'
    | 'rail-sparks'
    | 'wind-gust'
    | 'core-pulse'
    | 'motile-specks'
    | 'signal-pulse'
    | 'spark-burst'
    | 'dust-motes'
    | 'rain-streaks';
  intensity: number;
  color?: string;
}
