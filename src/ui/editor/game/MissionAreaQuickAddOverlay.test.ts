import { describe, expect, it } from 'vitest';
import { DESTINATION_PART_KINDS } from '../../../types/game/destination';
import { makeMissionAreaPart } from './missionAreaQuickAdd';

describe('makeMissionAreaPart', () => {
  it('creates enabled destination parts at the requested position', () => {
    const part = makeMissionAreaPart('repair_device', [3, 0.5, -2]);
    expect(part.id).toMatch(/^dst_/);
    expect(part.kind).toBe('repair_device');
    expect(part.position).toEqual([3, 0.5, -2]);
    expect(part.enabled).toBe(true);
    expect(part.radius).toBeGreaterThan(0);
  });

  it('supports every quick-add preset kind as a valid destination part kind', () => {
    const allowed = new Set(DESTINATION_PART_KINDS);
    for (const kind of ['building', 'carry_item', 'lost_item', 'repair_device', 'dropoff_zone', 'safe_zone'] as const) {
      const part = makeMissionAreaPart(kind, [0, 0, 0]);
      expect(allowed.has(part.kind)).toBe(true);
      expect(part.size.length).toBe(3);
    }
  });
});
