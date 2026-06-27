import { describe, it, expect, beforeEach } from 'vitest';
import { themeToOverride, themeToAmbience, applyEnvironmentTheme } from './applyEnvironmentTheme';
import { useEnvironmentThemeStore } from '../../stores/useEnvironmentEditorStore';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import type { EnvironmentThemeDefinition } from '../../types/environmentThemeTypes';

const dayTheme: EnvironmentThemeDefinition = {
  id: 'env_test_day', name: 'Test Day', themeType: 'sunny-harbor',
  sky: { preset: 'day' }, lighting: { ambientIntensity: 0.9, directionalIntensity: 1.2 },
  fog: { enabled: true, color: '#a8c4dd', density: 0.04 }, ground: { materialPresetId: 'asphalt' },
  propSetIds: [], hazardPresetIds: [],
};
const nightTheme: EnvironmentThemeDefinition = {
  id: 'env_test_night', name: 'Test Night', themeType: 'night-city',
  sky: { preset: 'night', color: '#101a2e' }, lighting: { ambientIntensity: 0.3, directionalIntensity: 0.5 },
  ground: { materialPresetId: 'wet' }, propSetIds: [], hazardPresetIds: [],
};

describe('themeToOverride', () => {
  it('maps a day theme to a locked daytime sky with fog + lighting', () => {
    const o = themeToOverride(dayTheme);
    expect(o.backgroundMode).toBe('sky');
    expect(o.lockTimeOfDay).toBe('day');
    expect(o.fogEnabled).toBe(true);
    expect(o.fogColor).toBe('#a8c4dd');
    expect(o.ambientIntensity).toBe(0.9);
    expect(o.directionalIntensity).toBe(1.2);
  });

  it('maps a night theme to a gradient using the theme color', () => {
    const o = themeToOverride(nightTheme);
    expect(o.backgroundMode).toBe('gradient');
    expect(o.lockTimeOfDay).toBe('night');
    expect(o.gradientBottom).toBe('#101a2e');
  });
});

describe('themeToAmbience', () => {
  it('derives gradient + light props (denser fog → nearer far plane)', () => {
    const a = themeToAmbience(dayTheme);
    expect(a.top).toBeTruthy();
    expect(a.ambient).toBe(0.9);
    expect(a.sun).toBe(1.2);
    expect(a.fogFar).toBeGreaterThan(0);
  });
});

describe('applyEnvironmentTheme', () => {
  beforeEach(() => {
    useEnvironmentThemeStore.getState().importState({ items: [dayTheme, nightTheme] });
    useEditorEnvironmentStore.getState().reset();
  });

  it('writes the resolved override onto the given area (restorable via resetArea)', () => {
    const area = applyEnvironmentTheme('env_test_night', 'aero_destination');
    expect(area).toBe('aero_destination');
    expect(useEditorEnvironmentStore.getState().overrides['aero_destination']?.backgroundMode).toBe('gradient');
    useEditorEnvironmentStore.getState().resetArea('aero_destination');
    expect(useEditorEnvironmentStore.getState().overrides['aero_destination']).toBeUndefined();
  });

  it('no-ops for an unknown theme id', () => {
    expect(applyEnvironmentTheme('nope', 'aero_destination')).toBeNull();
  });
});
