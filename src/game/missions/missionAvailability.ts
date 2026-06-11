import type { DialogueCondition } from '../../types/dialogue';
import type { MissionDefinition } from '../../types/game/mission';
import { evaluateCondition } from '../evaluateCondition';
import { missionRequirementConditions } from './missionChain';

// A mission is offerable/startable only when ALL its prerequisites AND its required-mission done-flags pass
// (reuse the POLI condition engine). `evalFn` is injectable so the rule is unit-testable without live stores.
export function isMissionAvailable(mission: MissionDefinition, evalFn: (c: DialogueCondition) => boolean = evaluateCondition): boolean {
  const conds = [...(mission.prerequisites ?? []), ...missionRequirementConditions(mission.requiredMissionIds)];
  return conds.every((c) => evalFn(c));
}
