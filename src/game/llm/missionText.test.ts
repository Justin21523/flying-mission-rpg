import { describe, it, expect } from 'vitest';
import { MissionTextSchema, applyMissionText, missionTextOf } from './missionText';
import type { MissionDefinition } from '../../types/game/mission';

const mission: MissionDefinition = {
  id: 'm1',
  name: 'Parcel Run',
  sourceConfidence: 'GameAdaptation',
  type: 'delivery',
  locationId: 'loc1',
  difficulty: 'normal',
  weather: 'clear',
  recommendedCharacterIds: ['char_jett'],
  summary: 'Deliver the parcel.',
  objectives: [
    { id: 'o1', kind: 'carry', description: 'Carry the parcel', targetCount: 1, targetObjectIds: ['dst_parcel'], dropoffZoneId: 'dst_drop' },
    { id: 'o2', kind: 'find', description: 'Find the cap', targetCount: 1, targetObjectIds: ['dst_cap'] },
  ],
  rewards: [{ id: 'r', type: 'coins', amount: 20 }],
};

describe('applyMissionText', () => {
  it('replaces only text fields (matched by id) and keeps all structure', () => {
    const out = applyMissionText(mission, {
      name: 'Harbor Hustle',
      summary: 'A breezy delivery along the docks.',
      objectives: [
        { id: 'o1', description: 'Whisk the parcel to the drop-off' },
        { id: 'oX', description: 'ignored — unknown id' },
      ],
    });
    expect(out.name).toBe('Harbor Hustle');
    expect(out.summary).toBe('A breezy delivery along the docks.');
    expect(out.objectives[0].description).toBe('Whisk the parcel to the drop-off');
    expect(out.objectives[1].description).toBe('Find the cap'); // no id → original kept
    // structure untouched
    expect(out.type).toBe('delivery');
    expect(out.objectives[0].kind).toBe('carry');
    expect(out.objectives[0].targetObjectIds).toEqual(['dst_parcel']);
    expect(out.objectives[0].dropoffZoneId).toBe('dst_drop');
    expect(out.rewards).toEqual(mission.rewards);
  });

  it('keeps originals when the LLM returns blanks', () => {
    const out = applyMissionText(mission, { name: '  ', summary: ' ', objectives: [{ id: 'o1', description: '  ' }] });
    expect(out.name).toBe('Parcel Run');
    expect(out.objectives[0].description).toBe('Carry the parcel');
  });
});

describe('MissionTextSchema', () => {
  it('accepts a well-formed bundle and round-trips missionTextOf', () => {
    expect(MissionTextSchema.safeParse(missionTextOf(mission)).success).toBe(true);
  });
  it('rejects an over-long name', () => {
    expect(MissionTextSchema.safeParse({ name: 'x'.repeat(80), summary: 's', objectives: [] }).success).toBe(false);
  });
});
