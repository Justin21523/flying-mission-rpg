import type { BossPhaseDefinition, BossPhaseStartCondition, BossPhaseCompletionCondition } from '../../types/game/boss';

// Pure phase-state logic for a boss (Batch F). The BossDirector feeds a probe of the live world; this module
// decides whether a phase's start/completion conditions hold and what the next phase is. No side effects.
export interface BossPhaseProbe {
  bossHpPercent: number; // 0..1
  destroyedWeakpointIds: Set<string>;
  clearedSummonWaveIds: Set<string>;
  clearedObstacleIds: Set<string>;
  usedSupportAbilityIds: Set<string>;
  completedPhaseIds: Set<string>;
  phaseElapsedSeconds: number;
  debugCompletePhase?: boolean;
}

export function evaluateStartCondition(cond: BossPhaseStartCondition, probe: BossPhaseProbe): boolean {
  switch (cond.type) {
    case 'on-boss-start': return true;
    case 'boss-hp-below': return probe.bossHpPercent <= cond.hpPercent;
    case 'previous-phase-complete': return probe.completedPhaseIds.has(cond.phaseId);
    case 'debug-start': return !!probe.debugCompletePhase;
    default: return false;
  }
}

export function evaluateCompletionCondition(cond: BossPhaseCompletionCondition, probe: BossPhaseProbe): boolean {
  switch (cond.type) {
    case 'boss-hp-below': return probe.bossHpPercent <= cond.hpPercent;
    case 'destroy-weakpoint': return probe.destroyedWeakpointIds.has(cond.weakpointId);
    case 'destroy-all-weakpoints': return cond.weakpointIds.every((id) => probe.destroyedWeakpointIds.has(id));
    case 'clear-summon-wave': return probe.clearedSummonWaveIds.has(cond.summonWaveId);
    case 'clear-obstacle': return probe.clearedObstacleIds.has(cond.obstacleId);
    case 'survive-seconds': return probe.phaseElapsedSeconds >= cond.seconds;
    case 'use-support-ability': return probe.usedSupportAbilityIds.has(cond.abilityId);
    case 'debug-complete-phase': return !!probe.debugCompletePhase;
    default: return false;
  }
}

// A phase completes when ALL its completion conditions hold (AND).
export function isPhaseComplete(phase: BossPhaseDefinition, probe: BossPhaseProbe): boolean {
  if (probe.debugCompletePhase) return true;
  if (phase.completionConditions.length === 0) return false;
  return phase.completionConditions.every((c) => evaluateCompletionCondition(c, probe));
}

export function nextPhaseId(phase: BossPhaseDefinition): string | undefined {
  return phase.nextPhaseIds[0];
}

export function isFinalPhase(phase: BossPhaseDefinition, finalPhaseIds: string[]): boolean {
  return finalPhaseIds.includes(phase.id) || phase.nextPhaseIds.length === 0;
}
