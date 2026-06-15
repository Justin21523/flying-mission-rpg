import { nanoid } from 'nanoid';
import { useCombatStore } from '../../../stores/game/useCombatStore';
import { getCombatEffect } from '../../../stores/game/editorCombatStore';
import { resolveCinematicEffect, playEffect as playCinematicEffect } from '../../vfx/CinematicVfxDirector';

// Model-first effect orchestration. playEffect registers an ActiveEffectInstance (placed in world at cast
// time); the CombatEffectLayer renders it via the geometry / model-component renderers; expired instances
// are swept by CombatDirector.update (cleanupExpired) or explicitly via cleanupEffectsForSkill. The actual
// geometry/material reuse (pooling) happens in the renderer (preallocated meshes, SuperAbilityFx pattern).

export interface EffectContext {
  skillInstanceId: string;
  x: number; y: number; z: number;
  headingRad: number;
}

export function playEffect(effectDefId: string, ctx: EffectContext): string | null {
  const def = getCombatEffect(effectDefId);
  if (!def) {
    // Batch F.5 — a skill's effectDefinitionId may resolve to a layered CINEMATIC effect; route it through the
    // unified cinematic VFX runtime (one effect system, not two).
    if (resolveCinematicEffect(effectDefId)) {
      return playCinematicEffect(effectDefId, { x: ctx.x, y: ctx.y, z: ctx.z, heading: ctx.headingRad });
    }
    return null;
  }
  const instanceId = `efx_${nanoid(6)}`;
  useCombatStore.getState().addEffect({
    instanceId,
    effectDefId,
    skillInstanceId: ctx.skillInstanceId,
    x: ctx.x,
    y: ctx.y,
    z: ctx.z,
    headingRad: ctx.headingRad,
    startedAtMs: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  });
  return instanceId;
}

export function stopEffect(instanceId: string): void {
  useCombatStore.getState().removeEffect(instanceId);
}

export function cleanupEffectsForSkill(skillInstanceId: string): void {
  const effects = useCombatStore.getState().activeEffects.filter((e) => e.skillInstanceId === skillInstanceId);
  for (const e of effects) useCombatStore.getState().removeEffect(e.instanceId);
}

export function cleanupAll(): void {
  for (const e of [...useCombatStore.getState().activeEffects]) useCombatStore.getState().removeEffect(e.instanceId);
}

// Remove effects whose total timing window has elapsed (called each frame by the director).
export function cleanupExpired(nowMs: number): void {
  for (const e of useCombatStore.getState().activeEffects) {
    const def = getCombatEffect(e.effectDefId);
    if (!def) { useCombatStore.getState().removeEffect(e.instanceId); continue; }
    const total = (def.timing.startDelaySeconds + def.timing.durationSeconds + (def.timing.fadeOutSeconds ?? 0)) * 1000;
    if (nowMs - e.startedAtMs >= total) useCombatStore.getState().removeEffect(e.instanceId);
  }
}
