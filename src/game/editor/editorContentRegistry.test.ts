import { describe, expect, it } from 'vitest';
import { EDITOR_CONTENT_DOMAINS } from './editorContentRegistry';

import { UNDO_DOMAIN_IDS } from '../../stores/editorUndoStore';

describe('editorContentRegistry', () => {
  it('has unique domain ids', () => {
    const ids = EDITOR_CONTENT_DOMAINS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('registers the Phase-6 combat/boss/zone/stage domains', () => {
    const ids = new Set(EDITOR_CONTENT_DOMAINS.map((d) => d.id));
    for (const id of ['combatSkill', 'combatEnemy', 'bossDef', 'missionZone', 'zoneSegment', 'cinematicEffect', 'statusRule', 'stageDef', 'fusion']) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it('every undo domain id resolves to a registered domain', () => {
    const ids = new Set(EDITOR_CONTENT_DOMAINS.map((d) => d.id));
    for (const id of UNDO_DOMAIN_IDS) expect(ids.has(id)).toBe(true);
  });

  it('a factory domain serialize → deserialize round-trips its items', () => {
    const d = EDITOR_CONTENT_DOMAINS.find((x) => x.id === 'combatSkill')!;
    const snap = d.serialize() as { items: unknown[] };
    expect(() => d.deserialize(snap)).not.toThrow();
    expect((d.serialize() as { items: unknown[] }).items).toEqual(snap.items); // items preserved (seeded flag may flip true)
  });
});
