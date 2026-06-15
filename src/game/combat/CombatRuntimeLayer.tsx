import { CombatRuntimeHost } from './CombatRuntimeHost';
import { CombatEffectLayer } from './effects/CombatEffectLayer';
import { CombatDummyTargetLayer } from './CombatDummyTarget';
import { DamageNumberRenderer } from './DamageNumberRenderer';
import { HitVolumeDebugRenderer } from './effects/HitVolumeDebugRenderer';

// The in-Canvas Combat Runtime: the per-frame director/input host, model-first skill effects, live dummy
// targets, pooled damage numbers, and the debug hit-volume overlay. Mounted (phase-gated) inside
// DestinationScene so it only runs during ground combat phases.
export const CombatRuntimeLayer = () => (
  <>
    <CombatRuntimeHost />
    <CombatDummyTargetLayer />
    <CombatEffectLayer />
    <DamageNumberRenderer />
    <HitVolumeDebugRenderer />
  </>
);
