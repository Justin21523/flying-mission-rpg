import { describe, expect, it } from 'vitest';
import { SEED_SUPPORT_PROFILES } from '../../data/game/support';
import { makeDispatchEntry } from '../../stores/game/supportRuntimeStore';
import { advanceDispatch, stageAt, totalDispatchSeconds } from './SupportDispatchRuntime';

const profile = {
  ...SEED_SUPPORT_PROFILES[0],
  baseDispatchDelaySeconds: 1,
  launchDurationSeconds: 2,
  flightDurationSeconds: 3,
  transformDurationSeconds: 4,
  arrivalDurationSeconds: 5,
  quickModeTotalSeconds: 1,
};

describe('SupportDispatchRuntime', () => {
  it('walks queued, launching, flying, transforming, arriving, active-at-scene', () => {
    expect(stageAt(profile, 0.5)).toBe('queued');
    expect(stageAt(profile, 1.5)).toBe('launching');
    expect(stageAt(profile, 3.5)).toBe('flying');
    expect(stageAt(profile, 7)).toBe('transforming');
    expect(stageAt(profile, 11)).toBe('arriving');
    expect(stageAt(profile, 15)).toBe('active-at-scene');
  });

  it('uses staged duration as the minimum total dispatch time', () => {
    expect(totalDispatchSeconds(profile)).toBe(15);
  });

  it('updates eta and arrival timestamp while advancing', () => {
    const entry = makeDispatchEntry('char_jett', 'quick-simulated', 100);
    const next = advanceDispatch(entry, profile, 15, 200);
    expect(next.status).toBe('active-at-scene');
    expect(next.etaSeconds).toBe(0);
    expect(next.arrivedAtMs).toBe(200);
  });

  it('does not advance paused or cancelled dispatches', () => {
    const paused = { ...makeDispatchEntry('char_jett', 'quick-simulated', 100), paused: true };
    const cancelled = { ...makeDispatchEntry('char_jett', 'quick-simulated', 100), cancelled: true };
    expect(advanceDispatch(paused, profile, 5, 200)).toBe(paused);
    expect(advanceDispatch(cancelled, profile, 5, 200)).toBe(cancelled);
  });
});
