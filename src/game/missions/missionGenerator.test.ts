import { describe, it, expect } from 'vitest';
import { generateMissions } from './missionGenerator';
import { validateMission } from './missionValidation';
import { MISSION_TEMPLATES } from '../../data/game/missionTemplates';
import type { MissionPools } from './missionPools';
import type { DestinationPart, DestinationPartKind } from '../../types/game/destination';

const part = (id: string, kind: DestinationPartKind, label: string): DestinationPart => ({
  id, kind, label, position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, size: [1, 1, 1], color: '#fff', enabled: true,
});

function makePools(): MissionPools {
  const partsByKind = {} as Record<DestinationPartKind, DestinationPart[]>;
  const all = [
    part('carry1', 'carry_item', 'Parcel'),
    part('drop1', 'dropoff_zone', 'Dropoff'),
    part('lost1', 'lost_item', 'Cap'),
    part('lost2', 'lost_item', 'Kite'),
    part('dev1', 'repair_device', 'Beacon'),
  ];
  for (const p of all) (partsByKind[p.kind] ??= []).push(p);
  return {
    locations: [{ id: 'loc1', name: 'Harbor' }, { id: 'loc2', name: 'Isle' }] as unknown as MissionPools['locations'],
    npcs: [{ id: 'npc1', name: 'Ana' }] as unknown as MissionPools['npcs'],
    routes: [{ id: 'route1', toLocationId: 'loc1' }] as unknown as MissionPools['routes'],
    characters: [
      { id: 'char_jett', missionSuitability: ['delivery'] },
      { id: 'char_paul', missionSuitability: ['find_lost'] },
      { id: 'char_todd', missionSuitability: ['repair'] },
    ] as unknown as MissionPools['characters'],
    partsByKind,
    miniGameIds: ['repair_wiring'],
  };
}

describe('generateMissions', () => {
  it('is deterministic for a fixed seed', () => {
    const pools = makePools();
    const a = generateMissions({ seed: 'daily-1', count: 6 }, MISSION_TEMPLATES, pools);
    const b = generateMissions({ seed: 'daily-1', count: 6 }, MISSION_TEMPLATES, pools);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('emits only valid (playable) missions', () => {
    const pools = makePools();
    const { missions } = generateMissions({ seed: 7, count: 8 }, MISSION_TEMPLATES, pools);
    expect(missions.length).toBeGreaterThan(0);
    for (const m of missions) expect(validateMission(m, pools)).toEqual([]);
  });

  it('different seeds produce different missions', () => {
    const pools = makePools();
    const a = generateMissions({ seed: 'x', count: 5 }, MISSION_TEMPLATES, pools);
    const b = generateMissions({ seed: 'y', count: 5 }, MISSION_TEMPLATES, pools);
    expect(JSON.stringify(a.missions)).not.toEqual(JSON.stringify(b.missions));
  });

  it('respects the type filter', () => {
    const pools = makePools();
    const { missions } = generateMissions({ seed: 'z', count: 6, types: ['delivery'] }, MISSION_TEMPLATES, pools);
    expect(missions.length).toBeGreaterThan(0);
    for (const m of missions) expect(m.type).toBe('delivery');
  });

  it('rejects when the destination lacks required parts', () => {
    const pools = makePools();
    pools.partsByKind.repair_device = []; // remove the device → repair missions can't bind
    const { missions } = generateMissions({ seed: 'r', count: 6, types: ['repair'] }, MISSION_TEMPLATES, pools);
    expect(missions.length).toBe(0);
  });
});
