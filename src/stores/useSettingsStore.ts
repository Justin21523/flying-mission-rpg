import { create } from 'zustand';

export type VfxIntensity = 'low' | 'medium' | 'high' | 'cinematic';
export type ScreenShakeLevel = 'off' | 'low' | 'medium' | 'high';
export type DamageNumberMode = 'off' | 'minimal' | 'full';
export type DensityLevel = 'off' | 'low' | 'medium' | 'high';

export type DemoSettingsState = {
  renderScale: number;
  shadows: boolean;
  postprocessing: boolean;
  vfxIntensity: VfxIntensity;
  screenShake: ScreenShakeLevel;
  hitStop: boolean;
  damageNumbers: DamageNumberMode;
  particleDensity: DensityLevel;
  physicsDebris: DensityLevel;
  fogQuality: DensityLevel;
  cameraEffects: boolean;
  guidedHints: boolean;
  autoTargetAssist: boolean;
  objectiveMarkers: boolean;
  simplifiedControls: boolean;
  cameraSensitivity: number;
  reduceFlashing: boolean;
  largerUiText: boolean;
  highContrastObjectiveMarker: boolean;
};

type SettingsStore = DemoSettingsState & {
  updateSettings: (patch: Partial<DemoSettingsState>) => void;
  resetSettings: () => void;
};

const STORAGE_KEY = 'aero-rescue-demo-settings-v1';

export const DEFAULT_DEMO_SETTINGS: DemoSettingsState = {
  renderScale: 1,
  shadows: true,
  postprocessing: true,
  vfxIntensity: 'high',
  screenShake: 'low',
  hitStop: true,
  damageNumbers: 'minimal',
  particleDensity: 'high',
  physicsDebris: 'low',
  fogQuality: 'medium',
  cameraEffects: true,
  guidedHints: true,
  autoTargetAssist: true,
  objectiveMarkers: true,
  simplifiedControls: false,
  cameraSensitivity: 1,
  reduceFlashing: false,
  largerUiText: false,
  highContrastObjectiveMarker: false,
};

function load(): DemoSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_DEMO_SETTINGS, ...(JSON.parse(raw) as Partial<DemoSettingsState>) } : DEFAULT_DEMO_SETTINGS;
  } catch {
    return DEFAULT_DEMO_SETTINGS;
  }
}

function persist(state: DemoSettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function pickState(state: SettingsStore): DemoSettingsState {
  return {
    renderScale: state.renderScale,
    shadows: state.shadows,
    postprocessing: state.postprocessing,
    vfxIntensity: state.vfxIntensity,
    screenShake: state.screenShake,
    hitStop: state.hitStop,
    damageNumbers: state.damageNumbers,
    particleDensity: state.particleDensity,
    physicsDebris: state.physicsDebris,
    fogQuality: state.fogQuality,
    cameraEffects: state.cameraEffects,
    guidedHints: state.guidedHints,
    autoTargetAssist: state.autoTargetAssist,
    objectiveMarkers: state.objectiveMarkers,
    simplifiedControls: state.simplifiedControls,
    cameraSensitivity: state.cameraSensitivity,
    reduceFlashing: state.reduceFlashing,
    largerUiText: state.largerUiText,
    highContrastObjectiveMarker: state.highContrastObjectiveMarker,
  };
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...load(),
  updateSettings: (patch) => {
    const next = { ...pickState(get()), ...patch };
    persist(next);
    set(next);
  },
  resetSettings: () => {
    persist(DEFAULT_DEMO_SETTINGS);
    set(DEFAULT_DEMO_SETTINGS);
  },
}));
