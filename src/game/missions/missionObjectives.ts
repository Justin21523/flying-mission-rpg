import type { MissionObjective, MissionObjectiveProgress } from '../../types/game/mission';

// Ordered-objective gating: in an `ordered` mission an objective can only complete once every EARLIER required
// (non-optional) objective is already done. Pure → unit-testable; the director calls this before applying a
// completion. Non-ordered missions allow completion any time.
export function canCompleteObjective(
  objectives: readonly MissionObjective[],
  progress: Record<string, MissionObjectiveProgress | undefined>,
  objId: string,
  ordered: boolean | undefined,
): boolean {
  if (!ordered) return true;
  const idx = objectives.findIndex((o) => o.id === objId);
  if (idx < 0) return true;
  for (let i = 0; i < idx; i += 1) {
    const o = objectives[i];
    if (o.optional) continue;
    if (!progress[o.id]?.done) return false;
  }
  return true;
}
