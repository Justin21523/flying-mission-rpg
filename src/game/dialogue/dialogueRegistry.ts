import type { DialogueTree } from '../../types/dialogue';
import { SEED_DIALOGUES } from '../../data/dialogues';
import { GAME_DIALOGUES } from '../../data/game/destinationDialogues';
import { getEditorDialogueTree, useEditorNpcStore } from '../../stores/editorNpcStore';

// Kit — resolve a dialogue tree by id from editor-authored trees (🧑 NPC tab) ⊕ the authored seed trees
// (POLI seeds + the aero-rescue game seeds). Runtime `tempTrees` are handled by the dialogue store directly.
export function getDialogueTree(id: string | null | undefined): DialogueTree | undefined {
  if (!id) return undefined;
  return getEditorDialogueTree(id) ?? SEED_DIALOGUES.find((t) => t.id === id) ?? GAME_DIALOGUES.find((t) => t.id === id);
}

export function listDialogueTreeIds(): { id: string; source: 'editor' | 'seed' }[] {
  const editor = Object.keys(useEditorNpcStore.getState().dialogueTrees).map((id) => ({ id, source: 'editor' as const }));
  const seen = new Set(editor.map((e) => e.id));
  const seed: { id: string; source: 'seed' }[] = [];
  for (const t of [...SEED_DIALOGUES, ...GAME_DIALOGUES]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      seed.push({ id: t.id, source: 'seed' });
    }
  }
  return [...editor, ...seed];
}
