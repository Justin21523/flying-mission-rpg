import type { NPCDefinition } from '../../types/game/npc';

// Batch E — pure: which hub-resident NPCs are rescued by clearing a given stage. Unit-tested; the director
// wires it to the npc store + save store.
export function rescuedNpcIdsForStage(stageId: string, npcs: NPCDefinition[]): string[] {
  return npcs.filter((n) => n.hubResident && n.rescuedByStageId === stageId).map((n) => n.id);
}
