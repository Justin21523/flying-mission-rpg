import { z } from 'zod';
import type { SaveData } from '../../types/game/save';

// Batch 13 — zod validation of a (post-migration) save document. Used by importSave + loadSave; on failure
// the caller falls back to a default save and surfaces a debug message (never crashes the game).

const strArr = z.array(z.string());

const SettingsSnapshotSchema = z.object({
  qualityTier: z.string(),
  graphicsCustom: z.record(z.string(), z.unknown()),
  audio: z.object({
    masterVolume: z.number(), musicVolume: z.number(), sfxVolume: z.number(),
    voiceVolume: z.number(), ambientVolume: z.number(), muteAll: z.boolean(), reduceLoud: z.boolean(),
  }),
  gameplay: z.object({ flightMode: z.enum(['simple', 'advanced']), transformMode: z.string() }),
  accessibility: z.object({ reduceMotion: z.boolean(), highContrast: z.boolean(), textScale: z.number() }),
});

export const SaveDataSchema = z.object({
  schemaVersion: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  playerProfile: z.object({ playerName: z.string().optional(), preferredCharacterId: z.string().optional() }),
  progress: z.object({
    completedMissionIds: strArr,
    unlockedCharacterIds: strArr,
    unlockedLocationIds: strArr,
    unlockedRouteIds: strArr,
    watchedTransformationTimelineIds: strArr,
    completedObjectiveIds: strArr,
    collectedItemIds: strArr,
  }),
  stats: z.object({
    totalPlayTimeSeconds: z.number(),
    totalFlightsStarted: z.number(),
    totalFlightsCompleted: z.number(),
    totalTransformationsPlayed: z.number(),
    totalTransformationsSkipped: z.number(),
    totalSafeLandings: z.number(),
    totalRoughLandings: z.number(),
    totalMissionsCompleted: z.number(),
    totalSupportCalls: z.number(),
    totalPhaserMiniGamesCompleted: z.number(),
  }),
  settingsSnapshot: SettingsSnapshotSchema,
  lastSession: z.object({
    lastGamePhase: z.string().optional(),
    lastMissionId: z.string().optional(),
    lastCharacterId: z.string().optional(),
    lastLocationId: z.string().optional(),
    lastRouteId: z.string().optional(),
    timestamp: z.string(),
  }).optional(),
  debug: z.object({
    lastAutoPlaytestResult: z.string().optional(),
    lastKnownBuildVersion: z.string().optional(),
  }).optional(),
});

export interface SaveValidationResult {
  ok: boolean;
  errors: string[];
  data?: SaveData;
}

export function validateSave(input: unknown): SaveValidationResult {
  const res = SaveDataSchema.safeParse(input);
  if (res.success) return { ok: true, errors: [], data: res.data as SaveData };
  return { ok: false, errors: res.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) };
}
