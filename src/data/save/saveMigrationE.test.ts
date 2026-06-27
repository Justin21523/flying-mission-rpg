import { describe, it, expect } from 'vitest';
import { SAVE_MIGRATIONS } from './saveSchemaVersions';
import type { SaveData } from '../../types/game/save';

// Batch E — v2 → v3 backfills progress.rescuedNpcIds without losing existing progress.
describe('save migration v2 → v3', () => {
  const v2v3 = SAVE_MIGRATIONS.find((m) => m.fromVersion === 2 && m.toVersion === 3)!;
  it('adds rescuedNpcIds: [] and keeps existing progress', () => {
    const v2 = { schemaVersion: 2, progress: { completedMissionIds: ['m1'], unlockedCharacterIds: ['c1'] } };
    const out = v2v3.migrate(v2) as SaveData;
    expect(out.schemaVersion).toBe(3);
    expect(out.progress.rescuedNpcIds).toEqual([]);
    expect(out.progress.completedMissionIds).toEqual(['m1']);
  });
  it('preserves an existing rescuedNpcIds list', () => {
    const out = v2v3.migrate({ schemaVersion: 2, progress: { rescuedNpcIds: ['npc_hub_skipper'] } }) as SaveData;
    expect(out.progress.rescuedNpcIds).toEqual(['npc_hub_skipper']);
  });
});
