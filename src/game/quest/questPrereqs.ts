import { evaluateCondition } from '../evaluateCondition';
import { useQuestStore } from '../../stores/questStore';
import { useEditorQuestStore } from '../../stores/editorQuestStore';
import { useFlagStore } from '../../stores/flagStore';

// POLI — quest gating + time limits for editor-authored quests. Quests can require prerequisite quests done,
// a list of conditions (flag/level/item/trust…), and a repeat cooldown; time-limited quests fail when the
// clock runs out (recoverable — status Failed + an optional flag).

const lastCompleted: Record<string, number> = {};  // quest id → perf seconds at completion (cooldown)
const startedAt: Record<string, number> = {};       // quest id → perf seconds when it went InProgress
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export function markQuestCompleted(id: string): void { lastCompleted[id] = now(); }

// May this quest start? Prereq quests completed + all prerequisite conditions pass + repeat cooldown elapsed.
export function canStartQuest(id: string): boolean {
  const eq = useEditorQuestStore.getState().quests.find((q) => q.id === id);
  if (!eq) return true; // seed / non-editor quest: no extra gating
  const qs = useQuestStore.getState();
  for (const pq of eq.prerequisiteQuestIds ?? []) if (qs.getQuestById(pq)?.status !== 'Completed') return false;
  for (const c of eq.prerequisites ?? []) if (!evaluateCondition(c)) return false;
  if (eq.repeatCooldownSec && lastCompleted[id] && now() - lastCompleted[id] < eq.repeatCooldownSec) return false;
  return true;
}

// Called on an interval: fail time-limited quests whose clock expired.
export function tickQuestTimers(): void {
  const qs = useQuestStore.getState();
  for (const eq of useEditorQuestStore.getState().quests) {
    if (!eq.timeLimitSec) continue;
    const q = qs.getQuestById(eq.id);
    if (q?.status !== 'InProgress') { delete startedAt[eq.id]; continue; }
    if (!startedAt[eq.id]) startedAt[eq.id] = now();
    if (now() - startedAt[eq.id] > eq.timeLimitSec) {
      qs.setQuestStatuses({ [eq.id]: 'Failed' });
      if (eq.failFlag) useFlagStore.getState().setFlag(eq.failFlag);
      delete startedAt[eq.id];
    }
  }
}
