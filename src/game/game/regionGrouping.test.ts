import { describe, it, expect } from 'vitest';
import { isLocationUnlocked, locationsByRegion } from './regionGrouping';
import type { WorldLocation } from '../../types/game/world';
import type { Region } from '../../types/game/region';
import type { DialogueCondition } from '../../types/dialogue';

const loc = (id: string, p: Partial<WorldLocation> = {}): WorldLocation => ({
  id, codename: id, name: id, sourceConfidence: 'GameAdaptation', kind: 'city', isBase: false,
  description: '', coordinate: { x: 0, y: 0, z: 0 }, mapPosition: { x: 50, y: 50 }, ...p,
});
const region = (id: string, p: Partial<Region> = {}): Region => ({ id, name: id, color: '#fff', ...p });

describe('isLocationUnlocked', () => {
  const never = () => false;
  it('defaults to unlocked', () => {
    expect(isLocationUnlocked(loc('a'), region('r'), never)).toBe(true);
  });
  it('locked when the location is manually locked (hard override)', () => {
    expect(isLocationUnlocked(loc('a', { unlocked: false }), region('r'), () => true)).toBe(false);
  });
  it('locked when the region is manually locked', () => {
    expect(isLocationUnlocked(loc('a'), region('r', { unlocked: false }), () => true)).toBe(false);
  });
  it('gated by required missions (done-flag conditions)', () => {
    const flags = new Set<string>();
    const evalFn = (c: DialogueCondition) => c.type === 'worldFlagSet' && flags.has(c.flag);
    const l = loc('a', { requiredMissionIds: ['m_x'] });
    expect(isLocationUnlocked(l, undefined, evalFn)).toBe(false);
    flags.add('mission:m_x:done');
    expect(isLocationUnlocked(l, undefined, evalFn)).toBe(true);
  });
  it('gated by the region unlockConditions', () => {
    const r = region('r', { unlockConditions: [{ type: 'worldFlagSet', flag: 'storms_cleared' }] });
    expect(isLocationUnlocked(loc('a'), r, () => false)).toBe(false);
    expect(isLocationUnlocked(loc('a'), r, () => true)).toBe(true);
  });
});

describe('locationsByRegion', () => {
  const regions = [region('r2', { order: 1 }), region('r1', { order: 0 })];
  const locs = [
    loc('b', { regionId: 'r1', order: 1 }),
    loc('a', { regionId: 'r1', order: 0 }),
    loc('c', { regionId: 'r2' }),
    loc('x', {}), // unassigned
    loc('y', { regionId: 'ghost' }), // unknown region → unassigned
  ];
  it('orders regions by order, locations by order, unassigned last', () => {
    const groups = locationsByRegion(locs, regions);
    expect(groups.map((g) => g.region?.id ?? 'none')).toEqual(['r1', 'r2', 'none']);
    expect(groups[0].locations.map((l) => l.id)).toEqual(['a', 'b']);
    expect(groups[2].locations.map((l) => l.id)).toEqual(['x', 'y']);
  });
  it('omits the unassigned bucket when empty', () => {
    const groups = locationsByRegion([loc('a', { regionId: 'r1' })], regions);
    expect(groups.some((g) => g.region === null)).toBe(false);
  });
});
