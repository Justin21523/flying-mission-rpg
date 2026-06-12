import { SAVE_VERSION, type SaveData } from '../../types/game/save';
import { localStorageSaveStorage, type SaveStorage } from './SaveStorage';
import { serializeSave, deserializeSave } from './SaveSerializer';
import { validateSave } from './SaveValidation';
import { migrateSave } from './SaveMigrationRunner';
import { createDefaultSave } from './SaveDefaults';

// Batch 13 — orchestrates load/save/migrate/validate/export/import for the aero-rescue main save. Stateful
// only for: the storage backend, the registered data provider (useSaveStore), the debounce timer, and the
// last status (for the Runtime Health panel). Never throws; corrupt/missing → a fresh default save.

const STORAGE_KEY = 'aero-rescue-save-v2';
const DEBOUNCE_MS = 800;

export type SaveLoadStatus = 'loaded' | 'migrated' | 'default' | 'recovered';
export interface SaveLoadResult { data: SaveData; status: SaveLoadStatus; message?: string }

let storage: SaveStorage = localStorageSaveStorage;
let provider: (() => SaveData) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastSaveOk = true;
let lastSaveAt: string | null = null;
let lastError: string | null = null;

/** Tests can inject an in-memory storage. */
export function setSaveStorage(s: SaveStorage): void { storage = s; }
/** useSaveStore registers how to read the current document for debounced/unload saves. */
export function registerSaveProvider(fn: () => SaveData): void { provider = fn; }

export function createDefaultSaveDoc(): SaveData { return createDefaultSave(); }

export function loadSave(): SaveLoadResult {
  const raw = storage.read(STORAGE_KEY);
  if (raw == null) return { data: createDefaultSave(), status: 'default' };
  const parsed = deserializeSave(raw);
  if (parsed == null) return { data: createDefaultSave(), status: 'recovered', message: 'Save was corrupt JSON — started fresh.' };
  const migrated = migrateSave(parsed);
  const validation = validateSave(migrated.data);
  if (!validation.ok || !validation.data) {
    return { data: createDefaultSave(), status: 'recovered', message: `Save failed validation — started fresh. ${validation.errors[0] ?? ''}` };
  }
  return { data: validation.data, status: migrated.ranMigrations.length > 0 ? 'migrated' : 'loaded' };
}

export function saveNow(data?: SaveData): boolean {
  const doc = data ?? provider?.();
  if (!doc) return false;
  doc.updatedAt = new Date().toISOString();
  doc.schemaVersion = SAVE_VERSION;
  const ok = storage.write(STORAGE_KEY, serializeSave(doc));
  lastSaveOk = ok;
  lastSaveAt = ok ? doc.updatedAt : lastSaveAt;
  lastError = ok ? null : 'localStorage write failed (quota / unavailable).';
  return ok;
}

export function saveDebounced(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { timer = null; saveNow(); }, DEBOUNCE_MS);
}

/** Mark the document dirty and schedule a debounced write (the common path for store mutations). */
export function markDirty(): void { saveDebounced(); }

/** Flush any pending debounced save immediately (call on beforeunload). */
export function flushOnUnload(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  saveNow();
}

export function clearSave(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  storage.remove(STORAGE_KEY);
}

export function exportSave(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

export interface SaveImportResult { ok: boolean; data?: SaveData; errors: string[] }
export function importSave(raw: string): SaveImportResult {
  const parsed = deserializeSave(raw);
  if (parsed == null) return { ok: false, errors: ['Not valid JSON.'] };
  const migrated = migrateSave(parsed);
  if (migrated.unknown) return { ok: false, errors: ['Could not detect a save version.'] };
  const validation = validateSave(migrated.data);
  if (!validation.ok || !validation.data) return { ok: false, errors: validation.errors };
  return { ok: true, data: validation.data, errors: [] };
}

export interface SaveSummary {
  schemaVersion: number;
  updatedAt: string;
  missionsCompleted: number;
  charactersUnlocked: number;
  playTimeSeconds: number;
}
export function getSaveSummary(data: SaveData): SaveSummary {
  return {
    schemaVersion: data.schemaVersion,
    updatedAt: data.updatedAt,
    missionsCompleted: data.progress.completedMissionIds.length,
    charactersUnlocked: data.progress.unlockedCharacterIds.length,
    playTimeSeconds: Math.round(data.stats.totalPlayTimeSeconds),
  };
}

export interface SaveHealth { lastSaveOk: boolean; lastSaveAt: string | null; lastError: string | null; storageAvailable: boolean }
export function getSaveHealth(): SaveHealth {
  return { lastSaveOk, lastSaveAt, lastError, storageAvailable: storage.available() };
}

export { validateSave, migrateSave };
export const CURRENT_SAVE_VERSION = SAVE_VERSION;
