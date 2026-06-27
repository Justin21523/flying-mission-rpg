import { describe, expect, it, beforeEach } from 'vitest';
import { useEditorVersionStore, snapshotDoc, listVersions, getVersion } from './editorVersionStore';

describe('editorVersionStore', () => {
  beforeEach(() => useEditorVersionStore.getState().reset());

  it('snapshots and lists per-document, newest first, with a deep-cloned payload', () => {
    const payload = { effects: [{ id: 'a' }] };
    const id1 = snapshotDoc('transformation', 'xf_1', payload, 'v1', false);
    payload.effects[0].id = 'mutated'; // mutate source after snapshot
    snapshotDoc('transformation', 'xf_1', { effects: [] }, 'v2', false);
    snapshotDoc('transformation', 'xf_2', { effects: [] }, 'other', false);

    const list = listVersions('transformation', 'xf_1');
    expect(list.map((v) => v.label)).toEqual(['v2', 'v1']); // newest first
    expect(getVersion(id1)!.payload).toEqual({ effects: [{ id: 'a' }] }); // unaffected by later mutation
    expect(listVersions('transformation', 'xf_2')).toHaveLength(1);
  });

  it('trims auto-checkpoints past the cap but keeps every manual snapshot', () => {
    for (let i = 0; i < 30; i++) snapshotDoc('transformation', 'xf_1', { i }, `auto-${i}`, true);
    snapshotDoc('transformation', 'xf_1', { manual: true }, 'keep-me', false);

    const list = listVersions('transformation', 'xf_1');
    const autos = list.filter((v) => v.auto);
    const manuals = list.filter((v) => !v.auto);
    expect(autos.length).toBeLessThanOrEqual(25);
    expect(manuals).toHaveLength(1);
    expect(manuals[0].label).toBe('keep-me');
  });
});
