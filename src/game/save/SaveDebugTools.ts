import { getSaveData, useSaveStore } from '../../stores/useSaveStore';
import { createDefaultSave } from './SaveDefaults';
import { captureSettingsSnapshot, applySettingsSnapshot } from './settingsSnapshot';
import {
  saveNow, clearSave, exportSave, importSave, loadSave, getSaveSummary,
  migrateSave, CURRENT_SAVE_VERSION, type SaveImportResult, type SaveSummary, type SaveLoadResult,
} from './SaveManager';
import { getEditorCharacters } from '../../stores/game/editorCharacterStore';
import { getEditorLocations } from '../../stores/game/editorLocationStore';
import { getEditorRoutes } from '../../stores/game/editorRouteStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { useSettingsStore } from '../../stores/game/useSettingsStore';

// Batch 13 — debug save/reset tools surfaced in the Debug UI. Import always validates + migrates (never
// trusts raw JSON). These are dev/test conveniences and never wired into normal gameplay.

export function debugSaveNow(): boolean {
  return saveNow(getSaveData());
}

export function debugReloadFromDisk(): SaveLoadResult {
  const result = loadSave();
  useSaveStore.getState().replaceSave(result.data);
  applySettingsSnapshot(result.data.settingsSnapshot);
  return result;
}

export function debugClearSave(): void {
  clearSave();
  useSaveStore.getState().resetSave();
}

export function debugExportSave(): string {
  return exportSave(getSaveData());
}

export function debugImportSave(raw: string): SaveImportResult {
  const result = importSave(raw);
  if (result.ok && result.data) {
    useSaveStore.getState().replaceSave(result.data);
    applySettingsSnapshot(result.data.settingsSnapshot);
  }
  return result;
}

export function debugResetProgress(): void {
  const cur = getSaveData();
  useSaveStore.getState().replaceSave({ ...cur, progress: createDefaultSave().progress });
}

export function debugUnlockAll(): void {
  const cur = getSaveData();
  useSaveStore.getState().replaceSave({
    ...cur,
    progress: {
      ...cur.progress,
      unlockedCharacterIds: getEditorCharacters().map((c) => c.id),
      unlockedLocationIds: getEditorLocations().map((l) => l.id),
      unlockedRouteIds: getEditorRoutes().map((r) => r.id),
    },
  });
}

export function debugResetSettings(): void {
  useGraphicsSettingsStore.getState().setTier('medium');
  useAudioStore.getState().reset();
  useSettingsStore.getState().reset();
  useSaveStore.getState().setSettingsSnapshot(captureSettingsSnapshot());
}

export function debugRunMigration(raw: string): { fromVersion: number; toVersion: number; ok: boolean } {
  try {
    const m = migrateSave(JSON.parse(raw));
    return { fromVersion: m.fromVersion, toVersion: m.toVersion, ok: m.ok };
  } catch {
    return { fromVersion: 0, toVersion: 0, ok: false };
  }
}

export function debugSaveSummary(): SaveSummary {
  return getSaveSummary(getSaveData());
}

export function debugSchemaVersion(): number {
  return CURRENT_SAVE_VERSION;
}
