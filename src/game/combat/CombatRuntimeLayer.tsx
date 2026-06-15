import { CombatRuntimeHost } from './CombatRuntimeHost';
import { CombatEffectLayer } from './effects/CombatEffectLayer';
import { CombatDummyTargetLayer } from './CombatDummyTarget';
import { DamageNumberRenderer } from './DamageNumberRenderer';
import { HitVolumeDebugRenderer } from './effects/HitVolumeDebugRenderer';
import { CombatSpawnLayer } from './CombatSpawnLayer';
import { DefenseEffectLayer } from './DefenseEffectLayer';
import { CombatEnemyAiHost } from './CombatEnemyAiHost';
import { SupportCombatHost } from '../support-combat/SupportCombatHost';
import { SupportTargetingOverlay } from '../../ui/support-combat/SupportTargetingOverlay';
import { BossEncounterLayer } from '../scenes/bosses/BossEncounterLayer';
import { CinematicVfxLayer } from '../vfx/CinematicVfxLayer';
import { PhysicsVfxLayer } from '../vfx/physics/PhysicsVfxLayer';

// The in-Canvas Combat Runtime: the per-frame director/input host, model-first skill effects, live dummy
// targets, pooled damage numbers, and the debug hit-volume overlay. Mounted (phase-gated) inside
// DestinationScene so it only runs during ground combat phases. Batch E adds the support-combat pump +
// targeting overlay.
export const CombatRuntimeLayer = () => (
  <>
    <CombatRuntimeHost />
    <CombatEnemyAiHost />
    <SupportCombatHost />
    <BossEncounterLayer />
    <CombatDummyTargetLayer />
    <CombatSpawnLayer />
    <CombatEffectLayer />
    <DefenseEffectLayer />
    <SupportTargetingOverlay />
    <CinematicVfxLayer />
    <PhysicsVfxLayer />
    <DamageNumberRenderer />
    <HitVolumeDebugRenderer />
  </>
);
