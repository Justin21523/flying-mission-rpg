import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DEMO_PERFORMANCE_BUDGET } from '../../game/performance/PerformanceBudget';
import { getVfxPerformanceBudget } from '../../game/vfx/VfxPerformanceBudget';
import { useSettingsStore } from '../../stores/useSettingsStore';

describe('PerformanceBudget', () => {
  beforeEach(() => { localStorage.clear(); useSettingsStore.getState().resetSettings(); });

  it('defines stable demo runtime caps', () => {
    expect(DEFAULT_DEMO_PERFORMANCE_BUDGET.maxActiveEnemies).toBeGreaterThan(0);
    expect(DEFAULT_DEMO_PERFORMANCE_BUDGET.targetFps).toBe(60);
  });

  it('changes VFX budget with intensity setting', () => {
    useSettingsStore.getState().updateSettings({ vfxIntensity: 'low' });
    const low = getVfxPerformanceBudget();
    useSettingsStore.getState().updateSettings({ vfxIntensity: 'cinematic' });
    const cinematic = getVfxPerformanceBudget();
    expect(cinematic.maxActiveParticles).toBeGreaterThan(low.maxActiveParticles);
  });
});
