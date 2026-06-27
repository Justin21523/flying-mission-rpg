import { describe, it, expect } from 'vitest';
import { defenseProgress, shouldSpawnNextWave, timedRescueState, scanProgress, escortProgress, holdZoneState, surviveState, hackProgress } from './missionObjectiveControllers';

describe('defense-waves', () => {
  it('not done until all spawned and cleared', () => {
    expect(defenseProgress(1, 3, true).done).toBe(false); // only 1/3 spawned
    expect(defenseProgress(3, 3, false).done).toBe(false); // spawned all but not cleared
    expect(defenseProgress(3, 3, true).done).toBe(true);
  });
  it('spawns first wave immediately, then on clear or interval', () => {
    expect(shouldSpawnNextWave(0, 3, false, 0, 8)).toBe(true); // first wave now
    expect(shouldSpawnNextWave(1, 3, false, 2, 8)).toBe(false); // not cleared, interval not elapsed
    expect(shouldSpawnNextWave(1, 3, true, 2, 8)).toBe(true); // prior cleared
    expect(shouldSpawnNextWave(1, 3, false, 9, 8)).toBe(true); // interval elapsed
    expect(shouldSpawnNextWave(3, 3, true, 99, 8)).toBe(false); // all spawned
  });
});

describe('timed-rescue', () => {
  it('done when all reached in time', () => {
    const s = timedRescueState(3, 3, 10, 40);
    expect(s.done).toBe(true);
    expect(s.expired).toBe(false);
  });
  it('expires (→ reset) when time runs out before all reached', () => {
    const s = timedRescueState(1, 3, 41, 40);
    expect(s.done).toBe(false);
    expect(s.expired).toBe(true);
  });
});

describe('scan-targets', () => {
  it('done at the required count', () => {
    expect(scanProgress(2, 3).done).toBe(false);
    expect(scanProgress(3, 3).done).toBe(true);
    expect(scanProgress(5, 3).current).toBe(3); // clamped
  });
});

// Wave 3 — new mission objective controllers.
describe('escort-npc', () => {
  it('done when the escort reaches the destination radius', () => {
    expect(escortProgress(10, 4).done).toBe(false);
    expect(escortProgress(3, 4).done).toBe(true);
  });
});

describe('hold-zone', () => {
  it('done once held for the target duration', () => {
    expect(holdZoneState(3, 5, true).done).toBe(false);
    expect(holdZoneState(5, 5, true).done).toBe(true);
    expect(holdZoneState(2.4, 5, true).current).toBe(2); // floored
  });
});

describe('survive-timer', () => {
  it('done after surviving the full duration', () => {
    expect(surviveState(9, 20).done).toBe(false);
    expect(surviveState(20, 20).done).toBe(true);
  });
});

describe('hack-terminals', () => {
  it('done when every terminal is hacked', () => {
    expect(hackProgress(1, 3).done).toBe(false);
    expect(hackProgress(3, 3).done).toBe(true);
    expect(hackProgress(4, 3).current).toBe(3); // clamped
  });
});
