import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';

// Records boss progress into the Advanced Mission Zone store through its public `recordBossEvent` seam
// (Batch F). The zone probe reads these sets; the evaluator decides completion of the boss-* conditions.
// Never completes a condition directly.
export type BossZoneEventKind = 'defeat-boss' | 'complete-boss-phase' | 'destroy-boss-weakpoint' | 'clear-boss-summon-wave';

export type BossEventRecorder = (kind: BossZoneEventKind, id: string) => void;

const defaultRecord: BossEventRecorder = (kind, id) => useAdvancedMissionZoneStore.getState().recordBossEvent(kind, id);

export function recordBossDefeated(bossId: string, record: BossEventRecorder = defaultRecord): void {
  record('defeat-boss', bossId);
}
export function recordPhaseComplete(bossId: string, phaseId: string, record: BossEventRecorder = defaultRecord): void {
  record('complete-boss-phase', `${bossId}:${phaseId}`);
}
export function recordWeakpointDestroyed(bossId: string, weakpointId: string, record: BossEventRecorder = defaultRecord): void {
  record('destroy-boss-weakpoint', `${bossId}:${weakpointId}`);
}
export function recordWaveCleared(bossId: string, waveId: string, record: BossEventRecorder = defaultRecord): void {
  record('clear-boss-summon-wave', `${bossId}:${waveId}`);
}
