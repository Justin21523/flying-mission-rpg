import type { DialogueCondition } from '../../types/dialogue';

// Mission chaining via world flags: a mission sets its done-flag on completion, and a mission listing it in
// requiredMissionIds becomes available once that flag is set (reuses the POLI worldFlag condition engine).
export function missionDoneFlag(id: string): string {
  return `mission:${id}:done`;
}

export function missionRequirementConditions(requiredMissionIds: readonly string[] | undefined): DialogueCondition[] {
  return (requiredMissionIds ?? []).map((id) => ({ type: 'worldFlagSet', flag: missionDoneFlag(id) }));
}
