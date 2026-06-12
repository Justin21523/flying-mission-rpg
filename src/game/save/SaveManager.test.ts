import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  setSaveStorage, registerSaveProvider, loadSave, saveNow, markDirty, flushOnUnload,
  exportSave, importSave, getSaveSummary, CURRENT_SAVE_VERSION,
} from './SaveManager';
import { createMemorySaveStorage, type SaveStorage } from './SaveStorage';
import { createDefaultSave } from './SaveDefaults';

describe('SaveManager', () => {
  beforeEach(() => { setSaveStorage(createMemorySaveStorage()); });

  it('returns a default save when storage is empty', () => {
    const r = loadSave();
    expect(r.status).toBe('default');
    expect(r.data.schemaVersion).toBe(CURRENT_SAVE_VERSION);
  });

  it('round-trips a saved document', () => {
    const doc = createDefaultSave();
    doc.progress.completedMissionIds = ['m1'];
    saveNow(doc);
    const r = loadSave();
    expect(r.status).toBe('loaded');
    expect(r.data.progress.completedMissionIds).toEqual(['m1']);
  });

  it('recovers (default) from corrupt JSON without crashing', () => {
    const corrupt: SaveStorage = { available: () => true, read: () => '{not json', write: () => true, remove: () => {} };
    setSaveStorage(corrupt);
    const r = loadSave();
    expect(r.status).toBe('recovered');
    expect(r.data.schemaVersion).toBe(CURRENT_SAVE_VERSION);
  });

  it('export → import round-trips and import rejects junk', () => {
    const doc = createDefaultSave();
    doc.stats.totalMissionsCompleted = 3;
    const text = exportSave(doc);
    const ok = importSave(text);
    expect(ok.ok).toBe(true);
    expect(ok.data?.stats.totalMissionsCompleted).toBe(3);
    expect(importSave('garbage').ok).toBe(false);
  });

  it('getSaveSummary reflects the document', () => {
    const doc = createDefaultSave();
    doc.progress.completedMissionIds = ['a', 'b'];
    expect(getSaveSummary(doc).missionsCompleted).toBe(2);
  });
});

describe('SaveManager debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('does not write synchronously on markDirty; writes after the debounce', () => {
    let writes = 0;
    const counting: SaveStorage = { available: () => true, read: () => null, write: () => { writes += 1; return true; }, remove: () => {} };
    setSaveStorage(counting);
    registerSaveProvider(() => createDefaultSave());
    markDirty();
    expect(writes).toBe(0);
    vi.advanceTimersByTime(900);
    expect(writes).toBe(1);
    markDirty();
    flushOnUnload(); // immediate flush cancels the pending timer
    expect(writes).toBe(2);
  });
});
