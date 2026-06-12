import { SAVE_VERSION, type SaveData, type SaveSettingsSnapshot } from '../../types/game/save';

// Batch 13 — static factory for a fresh save. No store reads here (deterministic + test-friendly); the
// SaveManager snapshots the live settings on top when the player actually changes them.

export function defaultSettingsSnapshot(): SaveSettingsSnapshot {
  return {
    qualityTier: 'medium',
    graphicsCustom: {},
    audio: { masterVolume: 0.8, musicVolume: 0.6, sfxVolume: 0.4, voiceVolume: 0.9, ambientVolume: 0.6, muteAll: false, reduceLoud: false },
    gameplay: { flightMode: 'simple', transformMode: 'interactive' },
    accessibility: { reduceMotion: false, highContrast: false, textScale: 1 },
  };
}

// First three characters/locations are unlocked from the start (UnlockManager extends this on progress).
export const STARTER_CHARACTER_IDS = ['char_jett', 'char_donnie', 'char_paul'];
export const STARTER_LOCATION_IDS = ['loc_harbor', 'loc_city', 'loc_forest'];

export function createDefaultSave(now: Date = new Date()): SaveData {
  const iso = now.toISOString();
  return {
    schemaVersion: SAVE_VERSION,
    createdAt: iso,
    updatedAt: iso,
    playerProfile: {},
    progress: {
      completedMissionIds: [],
      unlockedCharacterIds: [...STARTER_CHARACTER_IDS],
      unlockedLocationIds: [...STARTER_LOCATION_IDS],
      unlockedRouteIds: [],
      watchedTransformationTimelineIds: [],
      completedObjectiveIds: [],
      collectedItemIds: [],
    },
    stats: {
      totalPlayTimeSeconds: 0,
      totalFlightsStarted: 0,
      totalFlightsCompleted: 0,
      totalTransformationsPlayed: 0,
      totalTransformationsSkipped: 0,
      totalSafeLandings: 0,
      totalRoughLandings: 0,
      totalMissionsCompleted: 0,
      totalSupportCalls: 0,
      totalPhaserMiniGamesCompleted: 0,
    },
    settingsSnapshot: defaultSettingsSnapshot(),
  };
}
