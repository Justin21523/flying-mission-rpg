import { describe, it, expect } from 'vitest';
import { validateMission } from './missionValidation';
import type { MissionPools } from './missionPools';
import type { MissionDefinition } from '../../types/game/mission';
import type { DestinationPart, DestinationPartKind } from '../../types/game/destination';

const part = (id: string, kind: DestinationPartKind, label: string): DestinationPart => ({
  id, kind, label, position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, size: [1, 1, 1], color: '#fff', enabled: true,
});

function pools(): MissionPools {
  const partsByKind = {} as Record<DestinationPartKind, DestinationPart[]>;
  for (const p of [part('carry1', 'carry_item', 'Parcel'), part('drop1', 'dropoff_zone', 'Dropoff'), part('dev1', 'repair_device', 'Beacon')]) (partsByKind[p.kind] ??= []).push(p);
  return {
    locations: [{ id: 'loc1', name: 'Harbor' }] as unknown as MissionPools['locations'],
    npcs: [{ id: 'npc1', name: 'Ana' }] as unknown as MissionPools['npcs'],
    routes: [{ id: 'route1', toLocationId: 'loc1' }] as unknown as MissionPools['routes'],
    characters: [{ id: 'char_jett', missionSuitability: ['delivery'] }] as unknown as MissionPools['characters'],
    partsByKind,
    miniGameIds: ['repair_wiring'],
  };
}

const base = (over: Partial<MissionDefinition>): MissionDefinition => ({
  id: 'm', name: 'Test', sourceConfidence: 'GameAdaptation', type: 'delivery', locationId: 'loc1',
  difficulty: 'normal', weather: 'clear', recommendedCharacterIds: ['char_jett'], summary: 's',
  objectives: [{ id: 'o', kind: 'carry', description: 'd', targetCount: 1, targetObjectIds: ['carry1'], dropoffZoneId: 'drop1' }],
  ...over,
});

describe('validateMission', () => {
  it('passes a well-formed mission', () => {
    expect(validateMission(base({}), pools())).toEqual([]);
  });

  it('flags an unknown location', () => {
    expect(validateMission(base({ locationId: 'nope' }), pools()).some((e) => e.includes('locationId'))).toBe(true);
  });

  it('flags a carry objective missing its dropoff', () => {
    const m = base({ objectives: [{ id: 'o', kind: 'carry', description: 'd', targetCount: 1, targetObjectIds: ['carry1'] }] });
    expect(validateMission(m, pools()).some((e) => e.includes('dropoff'))).toBe(true);
  });

  it('flags a repair objective with a bad mini-game', () => {
    const m = base({ type: 'repair', objectives: [{ id: 'o', kind: 'activate', description: 'd', targetCount: 1, targetObjectIds: ['dev1'], miniGameId: 'nope' }] });
    expect(validateMission(m, pools()).some((e) => e.includes('miniGameId'))).toBe(true);
  });
});
