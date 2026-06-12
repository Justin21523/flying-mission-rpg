import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressTracker } from './ProgressTracker';
import { StatsTracker } from './StatsTracker';
import { UnlockManager } from './UnlockManager';
import { useSaveStore } from '../../stores/useSaveStore';
import { createDefaultSave } from '../save/SaveDefaults';

beforeEach(() => { useSaveStore.getState().replaceSave(createDefaultSave()); });

describe('ProgressTracker', () => {
  it('records ids and dedupes', () => {
    ProgressTracker.markMissionCompleted('m1');
    ProgressTracker.markMissionCompleted('m1');
    ProgressTracker.markObjectiveCompleted('o1');
    const save = useSaveStore.getState().save;
    expect(save.progress.completedMissionIds).toEqual(['m1']);
    expect(save.progress.completedObjectiveIds).toEqual(['o1']);
  });
});

describe('StatsTracker', () => {
  it('accumulates stats', () => {
    StatsTracker.flightStarted();
    StatsTracker.flightStarted();
    StatsTracker.addPlayTime(10);
    StatsTracker.safeLanding();
    const stats = useSaveStore.getState().save.stats;
    expect(stats.totalFlightsStarted).toBe(2);
    expect(stats.totalPlayTimeSeconds).toBe(10);
    expect(stats.totalSafeLandings).toBe(1);
  });
});

describe('UnlockManager', () => {
  it('reports starter characters as unlocked', () => {
    expect(UnlockManager.isCharacterUnlocked('char_jett')).toBe(true);
    expect(UnlockManager.isCharacterUnlocked('char_nonexistent')).toBe(false);
  });
  it('unlockNextLocation returns a location-kind result', () => {
    const r = UnlockManager.unlockNextLocation();
    expect(r.kind).toBe('location');
  });
});
