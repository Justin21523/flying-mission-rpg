import { describe, it, expect } from 'vitest';
import { validateDestinationLayout, validateDestinationNpc, validateObjective } from './destinationValidation';
import { SEED_DESTINATION_PARTS } from '../../data/game/destinationLayout';
import type { DestinationPart } from '../../types/game/destination';
import type { NPCDefinition } from '../../types/game/npc';
import type { MissionObjective } from '../../types/game/mission';

const npc = (over: Partial<NPCDefinition> = {}): NPCDefinition => ({
  id: 'n1', codename: 'N', name: 'N', sourceConfidence: 'GameAdaptation', locationId: 'l', role: '', description: '', color: '#fff', ...over,
});

describe('validateDestinationLayout', () => {
  it('passes the seed layout', () => {
    expect(validateDestinationLayout(SEED_DESTINATION_PARTS)).toEqual([]);
  });
  it('fails without a landing zone', () => {
    const parts = SEED_DESTINATION_PARTS.filter((p) => p.kind !== 'landing_zone');
    expect(validateDestinationLayout(parts).some((e) => e.includes('landing_zone'))).toBe(true);
  });
  it('fails on duplicate ids', () => {
    const dup: DestinationPart[] = [...SEED_DESTINATION_PARTS, { ...SEED_DESTINATION_PARTS[0] }];
    expect(validateDestinationLayout(dup).some((e) => e.includes('Duplicate'))).toBe(true);
  });
});

describe('validateDestinationNpc', () => {
  it('passes a valid npc', () => {
    expect(validateDestinationNpc(npc({ position: [0, 0, 0], interactionRadius: 4 }))).toEqual([]);
  });
  it('fails on an unknown dialogue tree', () => {
    const errs = validateDestinationNpc(npc({ dialogueTreeId: 'nope' }), new Set(['dlg_mina_harbor']));
    expect(errs.some((e) => e.includes('unknown dialogue tree'))).toBe(true);
  });
});

describe('validateObjective', () => {
  const partIds = new Set(SEED_DESTINATION_PARTS.map((p) => p.id));
  it('passes the seed parcel objective', () => {
    const o: MissionObjective = { id: 'o', kind: 'carry', description: 'd', targetCount: 1, targetObjectIds: ['dst_parcel'], dropoffZoneId: 'dst_dropoff' };
    expect(validateObjective(o, partIds)).toEqual([]);
  });
  it('fails when carry has no dropoff or unknown target', () => {
    const o: MissionObjective = { id: 'o', kind: 'carry', description: 'd', targetCount: 1, targetObjectIds: ['nope'] };
    const errs = validateObjective(o, partIds);
    expect(errs.some((e) => e.includes('unknown target object'))).toBe(true);
    expect(errs.some((e) => e.includes('dropoffZoneId'))).toBe(true);
  });
  it('fails when repair lacks a miniGameId', () => {
    const o: MissionObjective = { id: 'o', kind: 'activate', description: 'd', targetCount: 1, targetObjectIds: ['dst_beacon'] };
    expect(validateObjective(o, partIds).some((e) => e.includes('miniGameId'))).toBe(true);
  });
});
