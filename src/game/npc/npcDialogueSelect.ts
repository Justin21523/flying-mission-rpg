import type { DialogueTree, DialogueCondition } from '../../types/dialogue';
import type { NpcType } from '../../types/editorNPC';
import { NPC_TYPE_COLOR, NPC_TYPE_DEFAULT_ROLE } from '../../types/editorNPC';

// Pure NPC helpers (no React/stores → unit-testable).

// Pick the dialogue tree to play on interact: the FIRST tree (in the NPC's order) whose tree-level condition
// passes. A tree with no condition is always eligible. `evalFn` evaluates a single condition (the runtime
// passes the live evaluateCondition). Returns null when no listed tree resolves to a real tree / passes.
export function pickActiveDialogueTreeId(
  trees: Record<string, DialogueTree | undefined>,
  ids: readonly string[],
  evalFn: (c: DialogueCondition) => boolean,
): string | null {
  for (const id of ids) {
    const tree = trees[id];
    if (!tree) continue;
    if (!tree.condition || evalFn(tree.condition)) return id;
  }
  return null;
}

// The list of dialogue tree ids for an NPC (new multi-tree list, falling back to the legacy single id).
export function npcDialogueTreeIds(npc: { dialogueTreeIds?: string[]; dialogueTreeId?: string }): string[] {
  if (npc.dialogueTreeIds && npc.dialogueTreeIds.length) return npc.dialogueTreeIds;
  return npc.dialogueTreeId ? [npc.dialogueTreeId] : [];
}

// Default role + colour from the archetype (used when the author leaves them blank), mirroring the POLI editor.
export function npcDefaults(npcType: NpcType | undefined): { role: string; color: string } {
  if (!npcType) return { role: '', color: '#f472b6' };
  return { role: NPC_TYPE_DEFAULT_ROLE[npcType], color: NPC_TYPE_COLOR[npcType] };
}
