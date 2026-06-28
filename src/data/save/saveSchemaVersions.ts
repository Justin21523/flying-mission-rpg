import type { SaveData } from '../../types/game/save';
import { createDefaultSave, defaultSettingsSnapshot } from '../../game/save/SaveDefaults';

// Batch 13 — ordered save migrations. Each upgrades one schema version to the next; the runner chains them
// from a save's detected version up to the current SAVE_VERSION. Missing fields are backfilled from defaults.

export interface SaveMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (input: unknown) => unknown;
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}
function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

// v1 (the original interface: { version, savedAtMs, unlockedCharacterIds, completedMissionIds,
// discoveredLocationIds, settings: GameSettings, flightLog, transformWatchLog, collectibleIds,
// missionStats }) → v2 (the structured progress/stats/settingsSnapshot document).
const v1ToV2: SaveMigration = {
  fromVersion: 1,
  toVersion: 2,
  migrate: (input) => {
    const o = asObj(input);
    const base = createDefaultSave();
    const settings = asObj(o.settings);
    const defAudio = defaultSettingsSnapshot().audio;
    const unlockedChars = strArr(o.unlockedCharacterIds);
    const unlockedLocs = strArr(o.discoveredLocationIds);
    return {
      ...base,
      schemaVersion: 2,
      progress: {
        ...base.progress,
        completedMissionIds: strArr(o.completedMissionIds),
        unlockedCharacterIds: unlockedChars.length ? unlockedChars : base.progress.unlockedCharacterIds,
        unlockedLocationIds: unlockedLocs.length ? unlockedLocs : base.progress.unlockedLocationIds,
        watchedTransformationTimelineIds: strArr(o.transformWatchLog),
        collectedItemIds: strArr(o.collectibleIds),
      },
      settingsSnapshot: {
        ...defaultSettingsSnapshot(),
        qualityTier: typeof settings.quality === 'string' ? (settings.quality as string) : 'medium',
        audio: {
          ...defAudio,
          masterVolume: num(settings.masterVolume, defAudio.masterVolume),
          musicVolume: num(settings.musicVolume, defAudio.musicVolume),
          sfxVolume: num(settings.sfxVolume, defAudio.sfxVolume),
        },
        gameplay: {
          flightMode: settings.flightAssist === 'advanced' ? 'advanced' : 'simple',
          transformMode: typeof settings.transformMode === 'string' ? (settings.transformMode as string) : 'interactive',
        },
        accessibility: { ...defaultSettingsSnapshot().accessibility, reduceMotion: !!settings.reduceMotion },
      },
    } satisfies SaveData;
  },
};

// v2 → v3 (Batch E): add progress.rescuedNpcIds (Hub residents rescued by clearing stages).
const v2ToV3: SaveMigration = {
  fromVersion: 2,
  toVersion: 3,
  migrate: (input) => {
    const o = asObj(input);
    const progress = asObj(o.progress);
    return {
      ...createDefaultSave(),
      ...o,
      schemaVersion: 3,
      progress: { ...createDefaultSave().progress, ...progress, rescuedNpcIds: strArr(progress.rescuedNpcIds) },
    } as SaveData;
  },
};

// v3 → v4 (Phase 14): add progress.playedStorySceneIds (Story-Beat Scene once-gating).
const v3ToV4: SaveMigration = {
  fromVersion: 3,
  toVersion: 4,
  migrate: (input) => {
    const o = asObj(input);
    const progress = asObj(o.progress);
    return {
      ...createDefaultSave(),
      ...o,
      schemaVersion: 4,
      progress: { ...createDefaultSave().progress, ...progress, playedStorySceneIds: strArr(progress.playedStorySceneIds) },
    } as SaveData;
  },
};

export const SAVE_MIGRATIONS: SaveMigration[] = [v1ToV2, v2ToV3, v3ToV4];
