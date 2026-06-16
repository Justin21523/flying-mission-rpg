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
import { VfxModelPreloader } from '../vfx/VfxModelPreloader';

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
    <VfxModelPreloader />
    <DamageNumberRenderer />
    <HitVolumeDebugRenderer />
  </>
);

// Render-only VFX layers (no combat directors/input) — mounted in EDIT MODE so the 🎨 VFX Showcase /
// 🎬 Cinematic debug panels can preview cast effects. Without this, Edit Mode unmounts CombatRuntimeLayer and
// the panels spawn effects into a layer that isn't in the scene (so nothing renders — "no reaction at all").
export const CombatVfxPreviewLayer = () => (
  <>
    <CombatEffectLayer />
    <CombatSpawnLayer />
    <CinematicVfxLayer />
    <PhysicsVfxLayer />
    <VfxModelPreloader />
  </>
);
