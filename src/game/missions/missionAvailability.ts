import type { DialogueCondition } from '../../types/dialogue';
import type { MissionDefinition } from '../../types/game/mission';
import { evaluateCondition } from '../evaluateCondition';

// A mission is offerable/startable only when ALL its prerequisites pass (reuse the POLI condition engine).
// `evalFn` is injectable so the rule is unit-testable without the live stores.
export function isMissionAvailable(mission: MissionDefinition, evalFn: (c: DialogueCondition) => boolean = evaluateCondition): boolean {
  const prereqs = mission.prerequisites ?? [];
  return prereqs.every((c) => evalFn(c));
}
