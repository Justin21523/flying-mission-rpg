import { describe, it, expect } from 'vitest';
import { MISSION_TEMPLATES } from './missionTemplates';
import { MISSION_OBJECTIVE_KINDS } from '../../types/game/mission';

describe('MISSION_TEMPLATES', () => {
  it('has the post-13 added variety', () => {
    const ids = MISSION_TEMPLATES.map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['tpl_double_delivery', 'tpl_search_and_carry', 'tpl_repair_and_find']));
    expect(MISSION_TEMPLATES.length).toBeGreaterThanOrEqual(6);
  });
  it('every template is structurally valid (kinds, count ranges, weights)', () => {
    for (const t of MISSION_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.weight).toBeGreaterThan(0);
      expect(t.objectives.length).toBeGreaterThan(0);
      expect(t.namePatterns.length).toBeGreaterThan(0);
      for (const o of t.objectives) {
        expect(MISSION_OBJECTIVE_KINDS).toContain(o.kind);
        expect(o.countRange[0]).toBeLessThanOrEqual(o.countRange[1]);
        expect(o.countRange[0]).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
