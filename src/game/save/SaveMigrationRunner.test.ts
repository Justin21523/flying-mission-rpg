import { describe, it, expect } from 'vitest';
import { migrateSave, detectSaveVersion } from './SaveMigrationRunner';
import { validateSave } from './SaveValidation';
import { createDefaultSave } from './SaveDefaults';
import { CURRENT_SAVE_VERSION } from './SaveManager';

const v1Save = {
  version: 1,
  savedAtMs: 123,
  unlockedCharacterIds: ['char_jett'],
  completedMissionIds: ['m1'],
  discoveredLocationIds: ['loc_harbor'],
  settings: { quality: 'high', masterVolume: 0.5, sfxVolume: 0.3, musicVolume: 0.2, flightAssist: 'advanced', transformMode: 'quick', reduceMotion: true },
  flightLog: [],
  transformWatchLog: ['xf_jett'],
  collectibleIds: ['c1'],
  missionStats: {},
};

describe('migrateSave', () => {
  it('migrates a v1 save up to the current version and it validates', () => {
    const m = migrateSave(v1Save);
    expect(m.fromVersion).toBe(1);
    expect(m.toVersion).toBe(CURRENT_SAVE_VERSION);
    expect(m.ok).toBe(true);
    const v = validateSave(m.data);
    expect(v.ok).toBe(true);
    const data = v.data!;
    expect(data.progress.completedMissionIds).toEqual(['m1']);
    expect(data.progress.watchedTransformationTimelineIds).toEqual(['xf_jett']);
    expect(data.settingsSnapshot.qualityTier).toBe('high');
    expect(data.settingsSnapshot.gameplay.flightMode).toBe('advanced');
    expect(data.settingsSnapshot.accessibility.reduceMotion).toBe(true);
  });

  it('does not re-migrate a save already at the current version', () => {
    const m = migrateSave(createDefaultSave());
    expect(m.ranMigrations).toEqual([]);
    expect(m.ok).toBe(true);
  });

  it('flags an undetectable version', () => {
    const m = migrateSave({ foo: 'bar' });
    expect(m.unknown).toBe(true);
    expect(m.ok).toBe(false);
  });

  it('backfills missing fields from defaults during migration', () => {
    const m = migrateSave({ version: 1 }); // almost-empty v1
    const v = validateSave(m.data);
    expect(v.ok).toBe(true);
    expect(v.data!.stats.totalPlayTimeSeconds).toBe(0);
    expect(v.data!.progress.unlockedCharacterIds.length).toBeGreaterThan(0);
  });

  it('detectSaveVersion reads v1 `version` and v2 `schemaVersion`', () => {
    expect(detectSaveVersion({ version: 1 })).toBe(1);
    expect(detectSaveVersion({ schemaVersion: 2 })).toBe(2);
    expect(detectSaveVersion(null)).toBe(0);
  });
});
