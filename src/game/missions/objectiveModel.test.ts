import { describe, it, expect } from 'vitest';
import { ObjectiveModel } from './objectiveModel';
import type { MissionObjective } from '../../types/game/mission';

const OBJECTIVES: MissionObjective[] = [
  { id: 'o_carry', kind: 'carry', description: 'carry', targetCount: 1, targetObjectIds: ['item1'], dropoffZoneId: 'zone1' },
  { id: 'o_find', kind: 'find', description: 'find', targetCount: 1, targetObjectIds: ['lost1'] },
  { id: 'o_fix', kind: 'activate', description: 'fix', targetCount: 1, targetObjectIds: ['dev1'], miniGameId: 'repair_wiring' },
];
const VALID = new Set(['item1', 'lost1', 'dev1', 'zone1']);

function makeStarted() {
  const m = new ObjectiveModel(OBJECTIVES, VALID);
  m.startAll();
  return m;
}

describe('ObjectiveModel', () => {
  it('carry: pickup attaches, dropoff completes', () => {
    const m = makeStarted();
    const pick = m.tryPickup('item1');
    expect(pick.attached).toBe(true);
    expect(m.carryingObjectId).toBe('item1');
    const drop = m.tryDropoff('zone1');
    expect(drop.completed).toBe(true);
    expect(m.get('o_carry')).toBe('completed');
  });

  it('carry: cannot pick up a second item while carrying', () => {
    const m = new ObjectiveModel(
      [{ id: 'o2', kind: 'carry', description: '', targetCount: 1, targetObjectIds: ['item1', 'item2'], dropoffZoneId: 'zone1' }],
      new Set(['item1', 'item2', 'zone1']),
    );
    m.startAll();
    expect(m.tryPickup('item1').attached).toBe(true);
    expect(m.tryPickup('item2').attached).toBe(false);
  });

  it('find: picking up the lost item completes', () => {
    const m = makeStarted();
    const r = m.tryPickup('lost1');
    expect(r.completed).toBe(true);
    expect(m.get('o_find')).toBe('completed');
  });

  it('repair: completes only on mini-game success; cancel keeps it active', () => {
    const m = makeStarted();
    expect(m.miniGameResult('repair_wiring', false).completed).toBe(false);
    expect(m.get('o_fix')).toBe('active');
    expect(m.miniGameResult('repair_wiring', true).completed).toBe(true);
    expect(m.get('o_fix')).toBe('completed');
  });

  it('invalid target objects keep the objective inactive (never starts)', () => {
    const m = new ObjectiveModel(OBJECTIVES, new Set(['item1', 'zone1'])); // lost1/dev1 missing
    m.startAll();
    expect(m.get('o_find')).toBe('inactive');
    expect(m.get('o_fix')).toBe('inactive');
    expect(m.get('o_carry')).toBe('active');
  });

  it('allRequiredDone needs every valid objective completed', () => {
    const m = makeStarted();
    m.tryPickup('item1');
    m.tryDropoff('zone1');
    expect(m.allRequiredDone()).toBe(false);
    m.tryPickup('lost1');
    m.miniGameResult('repair_wiring', true);
    expect(m.allRequiredDone()).toBe(true);
  });
});
