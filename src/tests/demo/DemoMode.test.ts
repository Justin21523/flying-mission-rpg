import { beforeEach, describe, expect, it } from 'vitest';
import { useDemoModeStore, shouldHideDeveloperDebug } from '../../stores/useDemoModeStore';

describe('DemoMode', () => {
  beforeEach(() => { localStorage.clear(); useDemoModeStore.getState().resetDemoMode(); });

  it('starts in portfolio mode and can hide developer debug', () => {
    expect(useDemoModeStore.getState().enabled).toBe(true);
    expect(shouldHideDeveloperDebug()).toBe(true);
  });

  it('persists display toggles', () => {
    useDemoModeStore.getState().updateDemoMode({ showControlsOverlay: false });
    expect(JSON.parse(localStorage.getItem('aero-rescue-portfolio-demo-mode-v1') ?? '{}').showControlsOverlay).toBe(false);
  });
});
