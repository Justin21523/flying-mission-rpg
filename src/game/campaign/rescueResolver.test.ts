import { describe, it, expect } from 'vitest';
import { rescuedNpcIdsForStage } from './rescueResolver';
import type { NPCDefinition } from '../../types/game/npc';

const npc = (id: string, over: Partial<NPCDefinition> = {}): NPCDefinition => ({
  id, codename: id, name: id, sourceConfidence: 'GameAdaptation', locationId: 'loc', role: '', description: '', color: '#fff', ...over,
});

describe('rescuedNpcIdsForStage', () => {
  const npcs = [
    npc('a', { hubResident: true, rescuedByStageId: 'stage_1' }),
    npc('b', { hubResident: true, rescuedByStageId: 'stage_2' }),
    npc('c', { hubResident: true, rescuedByStageId: 'stage_1' }),
    npc('d', { rescuedByStageId: 'stage_1' }), // not a hub resident → ignored
  ];
  it('returns hub residents linked to the cleared stage', () => {
    expect(rescuedNpcIdsForStage('stage_1', npcs).sort()).toEqual(['a', 'c']);
    expect(rescuedNpcIdsForStage('stage_2', npcs)).toEqual(['b']);
  });
  it('returns [] when no resident is linked', () => {
    expect(rescuedNpcIdsForStage('stage_9', npcs)).toEqual([]);
  });
});
