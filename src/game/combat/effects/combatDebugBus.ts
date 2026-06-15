import type { HitVolumeDefinition } from '../../../types/game/combat';

// Tiny ring of recently-cast hit volumes so HitVolumeDebugRenderer can draw their wireframes when
// showHitVolumes is on. CombatRuntimeHost records a volume on each successful cast.
export interface DebugHitVolume {
  def: HitVolumeDefinition;
  x: number; z: number;
  headingRad: number;
  untilMs: number;
  color: string;
}

const volumes: DebugHitVolume[] = [];
const CAP = 12;

export function recordHitVolume(v: DebugHitVolume): void {
  volumes.push(v);
  if (volumes.length > CAP) volumes.shift();
}

export function activeDebugVolumes(nowMs: number): DebugHitVolume[] {
  return volumes.filter((v) => v.untilMs > nowMs);
}
