import type { CombatSkillDefinition } from '../../types/game/combat';

// Derive a skill's cast phases from its existing scalar timing — pure, for the Skill Timeline editor's read-only
// phase bar. windup = wait before hits land; active = hit-volume window; recovery = tail up to total. The total
// also covers any authored timelineEvents so late triggers stay on-bar. No schema change — reads what's there.
export interface SkillPhases {
  windupEnd: number; // seconds; hits start here (also where damage markers sit)
  activeEnd: number; // seconds; hit window closes here
  total: number; // seconds; full bar length
  damageStart: number; // alias of windupEnd, for marker clarity
  eventTimes: number[]; // authored event times (sorted)
}

export function deriveSkillPhases(skill: CombatSkillDefinition): SkillPhases {
  const hv = skill.hitVolume;
  const windupEnd = Math.max(0, hv?.activeDelaySeconds ?? skill.castTimeSeconds ?? 0);
  const activeDuration = Math.max(0, hv?.activeDurationSeconds ?? 0);
  const activeEnd = windupEnd + activeDuration;
  const eventTimes = (skill.timelineEvents ?? []).map((e) => e.timeSeconds).sort((a, b) => a - b);
  const total = Math.max(activeEnd, skill.durationSeconds ?? 0, eventTimes[eventTimes.length - 1] ?? 0, 0.1);
  return { windupEnd, activeEnd, total, damageStart: windupEnd, eventTimes };
}
