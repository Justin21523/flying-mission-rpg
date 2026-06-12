import type { SupportAbilityTag } from '../../types/game/support';
import type { MissionObjectiveKind } from '../../types/game/mission';

// Which support ability suits which objective kind — used by the companion AI to pick objectives it can work.
export function abilitySupportsObjective(ability: SupportAbilityTag, kind: MissionObjectiveKind): boolean {
  if (kind === 'activate') return ability === 'engineering' || ability === 'repair';
  if (kind === 'find') return ability === 'scouting' || ability === 'search' || ability === 'speed';
  if (kind === 'carry') return ability === 'transport' || ability === 'heavy-lift' || ability === 'rescue';
  if (kind === 'talk') return ability === 'rescue' || ability === 'medical';
  return ability === 'speed' || ability === 'air-control';
}
