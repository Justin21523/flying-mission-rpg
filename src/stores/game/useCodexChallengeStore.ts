import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CodexChallengeDefinition } from '../../data/progression/codexChallenges';
import { SEED_CODEX_CHALLENGES } from '../../data/progression/codexChallenges';

// Wave 4 — editable codex challenge catalog (⬆ Progression tab).
export const useCodexChallengeStore = createEditorCollection<CodexChallengeDefinition>({
  storageKey: 'aero-rescue-codex-challenges-v1',
  seed: SEED_CODEX_CHALLENGES,
  makeId: () => `chal_${nanoid(6)}`,
});
