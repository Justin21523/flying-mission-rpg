import type { SupportDispatchEntry, SupportDispatchProfile, SupportDispatchStatus } from '../../types/game/support';

export interface DispatchStage {
  status: SupportDispatchStatus;
  durationSeconds: number;
}

export function dispatchStages(profile: SupportDispatchProfile): DispatchStage[] {
  return [
    { status: 'queued', durationSeconds: profile.baseDispatchDelaySeconds },
    { status: 'launching', durationSeconds: profile.launchDurationSeconds },
    { status: 'flying', durationSeconds: profile.flightDurationSeconds },
    { status: 'transforming', durationSeconds: profile.transformDurationSeconds },
    { status: 'arriving', durationSeconds: profile.arrivalDurationSeconds },
  ];
}

export function totalDispatchSeconds(profile: SupportDispatchProfile): number {
  const staged = dispatchStages(profile).reduce((n, s) => n + Math.max(0, s.durationSeconds), 0);
  return Math.max(profile.quickModeTotalSeconds, staged, 0.1);
}

export function stageAt(profile: SupportDispatchProfile, elapsedSeconds: number): SupportDispatchStatus {
  let cursor = 0;
  for (const stage of dispatchStages(profile)) {
    cursor += Math.max(0, stage.durationSeconds);
    if (elapsedSeconds < cursor) return stage.status;
  }
  return 'active-at-scene';
}

export function advanceDispatch(entry: SupportDispatchEntry, profile: SupportDispatchProfile, deltaSeconds: number, nowMs: number): SupportDispatchEntry {
  if (entry.cancelled || entry.paused) return entry;
  const elapsedSeconds = Math.max(0, entry.elapsedSeconds + Math.max(0, deltaSeconds));
  const status = stageAt(profile, elapsedSeconds);
  const total = totalDispatchSeconds(profile);
  const etaSeconds = Math.max(0, total - elapsedSeconds);
  const stageChanged = status !== entry.status;
  return {
    ...entry,
    status,
    elapsedSeconds,
    etaSeconds,
    stageStartedAtMs: stageChanged ? nowMs : entry.stageStartedAtMs,
    arrivedAtMs: status === 'active-at-scene' && entry.status !== 'active-at-scene' ? nowMs : entry.arrivedAtMs,
  };
}
