import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '../../stores/useSettingsStore';

describe('SettingsStore', () => {
  beforeEach(() => { localStorage.clear(); useSettingsStore.getState().resetSettings(); });

  it('persists demo graphics and gameplay settings to localStorage', () => {
    useSettingsStore.getState().updateSettings({ vfxIntensity: 'low', screenShake: 'off', guidedHints: false });
    const raw = localStorage.getItem('aero-rescue-demo-settings-v1') ?? '{}';
    expect(raw).toContain('"vfxIntensity":"low"');
    expect(raw).toContain('"screenShake":"off"');
    expect(raw).toContain('"guidedHints":false');
  });
});
