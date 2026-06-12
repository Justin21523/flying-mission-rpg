import type { QualityPreset } from './quality';
import type { FlightMode } from './flightControl';

// Batch 13 — the versioned save document. This is the aero-rescue main save (progress / stats / settings
// snapshot), NOT the POLI 'world'-mode multi-slot save in stores/saveStore.ts (that stays separate).
// Bumped to v2 this batch; the migration runner upgrades older saves (see data/save/saveSchemaVersions.ts).
export const SAVE_VERSION = 2 as const;

export interface SaveProgress {
  completedMissionIds: string[];
  unlockedCharacterIds: string[];
  unlockedLocationIds: string[];
  unlockedRouteIds: string[];
  watchedTransformationTimelineIds: string[];
  completedObjectiveIds: string[];
  collectedItemIds: string[];
}

export interface SaveStats {
  totalPlayTimeSeconds: number;
  totalFlightsStarted: number;
  totalFlightsCompleted: number;
  totalTransformationsPlayed: number;
  totalTransformationsSkipped: number;
  totalSafeLandings: number;
  totalRoughLandings: number;
  totalMissionsCompleted: number;
  totalSupportCalls: number;
  totalPhaserMiniGamesCompleted: number;
}

// A snapshot of the live settings stores (Batch 12) — the single direction is store → snapshot on save,
// snapshot → store on load. Kept structural so load can apply each piece back precisely.
export interface SaveSettingsSnapshot {
  qualityTier: string;                       // graphicsSettingsStore.tier
  graphicsCustom: Partial<QualityPreset>;    // graphicsSettingsStore.customPreset
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
    ambientVolume: number;
    muteAll: boolean;
    reduceLoud: boolean;
  };
  gameplay: {
    flightMode: FlightMode;
    transformMode: string;                   // useSettingsStore transformMode
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    textScale: number;
  };
}

export interface SaveLastSession {
  lastGamePhase?: string;
  lastMissionId?: string;
  lastCharacterId?: string;
  lastLocationId?: string;
  lastRouteId?: string;
  timestamp: string;
}

export interface SaveData {
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  playerProfile: {
    playerName?: string;
    preferredCharacterId?: string;
  };
  progress: SaveProgress;
  stats: SaveStats;
  settingsSnapshot: SaveSettingsSnapshot;
  lastSession?: SaveLastSession;
  debug?: {
    lastAutoPlaytestResult?: string;
    lastKnownBuildVersion?: string;
  };
}

export type StatKey = keyof SaveStats;
