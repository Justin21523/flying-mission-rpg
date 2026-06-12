import { beforeEach, describe, expect, it } from 'vitest';
import { useGroundAbilityStore } from './groundAbilityStore';
import { DEFAULT_CLOUD_RALLY, DEFAULT_RESCUE_SURGE } from '../../game/destination/groundAbilityConfig';

describe('groundAbilityStore', () => {
  beforeEach(() => {
    useGroundAbilityStore.getState().reset();
  });

  it('triggers authored cloud rally duration and cooldown', () => {
    const config = { ...DEFAULT_CLOUD_RALLY, keyCode: 'KeyQ', cooldownSec: 3, energizedDurationSec: 5 };

    expect(useGroundAbilityStore.getState().triggerCloud(config, 10)).toBe(true);
    expect(useGroundAbilityStore.getState().energizedUntil).toBe(15);
    expect(useGroundAbilityStore.getState().triggerCloud(config, 11)).toBe(false);
    expect(useGroundAbilityStore.getState().triggerCloud(config, 13)).toBe(true);
  });

  it('triggers rescue surge with authored dash timing and direction', () => {
    const config = { ...DEFAULT_RESCUE_SURGE, keyCode: 'KeyR', durationSec: 1.5, speed: 42 };

    expect(useGroundAbilityStore.getState().triggerSurge(config, [1, 0, 0], 4)).toBe(true);
    expect(useGroundAbilityStore.getState().surgeUntil).toBe(5.5);
    expect(useGroundAbilityStore.getState().surgeConfig.speed).toBe(42);
    expect(useGroundAbilityStore.getState().surgeDirection).toEqual([1, 0, 0]);
  });
});
