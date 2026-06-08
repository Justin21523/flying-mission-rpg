import { create } from 'zustand';
import { useWorldClockStore } from './worldClockStore';
import type { CharacterDefinition } from '../types/character';
import { CORE_TEAM } from '../data/characters/coreTeam';
import { RESIDENTS } from '../data/characters/residents';
import { BROOMS_TOWN_SCHEDULES } from '../data/schedules/broomsTownSchedules';
import type { TimeSlot } from '../data/schedules/broomsTownSchedules';

// All characters that appear as world NPCs (excludes Poli, who is the player).
const ALL_NPC_CHARACTERS: CharacterDefinition[] = [
  ...CORE_TEAM.filter((c) => c.id !== 'poli'),
  ...RESIDENTS,
];

const DEFAULT_POSITION: [number, number, number] = [0, 0, 0];

function buildAreaMap(timeOfDay: string): Record<string, string> {
  const slot = timeOfDay as TimeSlot;
  const map: Record<string, string> = {};
  for (const sched of BROOMS_TOWN_SCHEDULES) {
    const areaId = sched.slots[slot] ?? sched.slots.day;
    if (areaId) map[sched.characterId] = areaId;
  }
  return map;
}

interface NpcScheduleState {
  activeAreaMap: Record<string, string>; // characterId → current areaId
  getActiveNpcsForArea: (areaId: string) => CharacterDefinition[];
  getCharacterPosition: (charId: string, areaId: string) => [number, number, number];
}

export const useNpcScheduleStore = create<NpcScheduleState>((_set, get) => ({
  activeAreaMap: buildAreaMap(useWorldClockStore.getState().timeOfDay),
  getActiveNpcsForArea: (areaId) => {
    const map = get().activeAreaMap;
    return ALL_NPC_CHARACTERS.filter((c) => map[c.id] === areaId);
  },
  getCharacterPosition: (charId, areaId) => {
    const sched = BROOMS_TOWN_SCHEDULES.find((s) => s.characterId === charId);
    return (sched?.positions[areaId] as [number, number, number] | undefined) ?? DEFAULT_POSITION;
  },
}));

// Subscribe to worldClockStore and rebuild the area map only when timeOfDay changes.
let _lastTimeOfDay: string = useWorldClockStore.getState().timeOfDay;
useWorldClockStore.subscribe((state) => {
  if (state.timeOfDay !== _lastTimeOfDay) {
    _lastTimeOfDay = state.timeOfDay;
    useNpcScheduleStore.setState({ activeAreaMap: buildAreaMap(state.timeOfDay) });
  }
});
