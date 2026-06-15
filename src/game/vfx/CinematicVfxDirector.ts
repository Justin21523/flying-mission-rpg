import type { TransformationEffectConfig } from '../../types/game/transformationEffects';
import type { CinematicEffectDefinition, CinematicEffectLayerDefinition } from '../../types/cinematicVfxTypes';
import { liveTargets } from '../../stores/game/combatTargetStore';
import { robotHandle } from '../destination/robotHandle';
import { getCinematicEffect } from '../../stores/game/useCinematicEffectStore';
import { particleLayerToParams } from './ParticleEffectRuntime';
import { fogLayerToParams } from './FogCloudEffectRuntime';
import { modelLayerToParams } from './ModelEffectRuntime';
import { assemblyLayerToParams } from './ObjectAssemblyEffectRuntime';
import { geometryLayerToParams } from './GeometryCinematicRenderer';
import { applyCameraFeedback } from './CinematicCameraFeedback';
import { spawnCombatLayer, cleanupCinematicForCaster, cleanupAllCinematic, type CombatFxFollow } from './cinematicVfxRuntime';
import * as PhysicsVfxDirector from './physics/PhysicsVfxDirector';

// Combat cinematic VFX director (Batch F.5) — resolves a CinematicEffectDefinition and spawns each of its
// LAYERS into the shared runtime (translating high-level particle/fog/geometry/model settings into unified V2
// EffectParameters). Camera layers write the combat camera-fx. CombatEffectDirector delegates here when a
// skill's effectDefinitionId resolves to a cinematic effect — one effect system, not two.

let uid = 0;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export interface CinematicCastContext {
  casterId?: string;
  x: number; y: number; z: number;
  heading: number;
  targetId?: string;
  didHit?: boolean;
}

function buildLayerConfig(cinematicId: string, layer: CinematicEffectLayerDefinition, defaultColor: string): TransformationEffectConfig {
  let params: TransformationEffectConfig['parameters'] = {};
  let v2 = layer.v2EffectType;
  let modelId: string | undefined;

  if (layer.particle) params = { ...params, ...particleLayerToParams(layer.particle) };
  if (layer.fogCloud) params = { ...params, ...fogLayerToParams(layer.fogCloud) };
  if (layer.geometry) { const g = geometryLayerToParams(layer.geometry); params = { ...params, ...g.params }; if (!layer.v2EffectType) v2 = g.v2EffectType; }
  if (layer.model) {
    const m = layer.layerType === 'object-assembly' ? assemblyLayerToParams(layer.model) : modelLayerToParams(layer.model);
    params = { ...params, ...m.params }; modelId = m.modelId; if (!layer.v2EffectType) v2 = m.v2EffectType;
  }
  if (layer.paramsOverride) params = { ...params, ...layer.paramsOverride };

  const color = layer.color ?? layer.material?.color ?? defaultColor;
  return {
    effectId: `${cinematicId}__${layer.id}__${uid++}`,
    effectName: layer.id,
    effectType: v2,
    enabled: true,
    startTime: layer.startTimeSeconds,
    duration: layer.durationSeconds,
    delay: 0,
    layerOrder: 0,
    attachToBone: false,
    useCharacterModel: false,
    useCustomModel: !!modelId,
    customModelPrefabId: modelId,
    positionOffset: layer.transform?.position ?? [0, 0, 0],
    rotationOffset: layer.transform?.rotation ?? [0, 0, 0],
    scaleMultiplier: layer.transform?.scale?.[0] ?? 1,
    opacity: layer.material?.opacity ?? 1,
    fadeInDuration: 0.05,
    fadeOutDuration: 0.25,
    color,
    emissiveColor: layer.material?.emissive ?? color,
    intensity: 1,
    blendMode: layer.material?.blendMode ?? 'additive',
    loop: false,
    previewEnabled: true,
    parameters: params,
    source: 'combat',
  };
}

function targetPos(targetId: string | undefined): { x: number; y: number; z: number } | undefined {
  if (!targetId) return undefined;
  const t = liveTargets.find((x) => x.id === targetId);
  return t ? { x: t.x, y: t.y, z: t.z } : undefined;
}

export function playEffect(cinematicEffectId: string, ctx: CinematicCastContext): string | null {
  const def = getCinematicEffect(cinematicEffectId);
  if (!def) return null;
  const instanceId = `cvfx_${uid++}`;
  const tpos = targetPos(ctx.targetId);
  for (const layer of def.layers) {
    if (layer.layerType === 'camera-feedback' && layer.camera) { applyCameraFeedback(layer.camera, nowMs(), ctx.didHit ?? false); continue; }
    if (layer.layerType === 'ui-feedback') continue; // HUD toast handled by the skill HUD
    // Batch F.6 — a physics-object layer spawns lightweight kinematic VFX objects (debris/panels/balls/rubble).
    if (layer.layerType === 'physics-object' && layer.physicsObject) {
      const p = layer.attachTo === 'target' && tpos ? tpos : { x: ctx.x, y: ctx.y, z: ctx.z };
      PhysicsVfxDirector.spawn(layer.physicsObject, { x: p.x, y: p.y, z: p.z, dirX: Math.sin(ctx.heading), dirZ: Math.cos(ctx.heading), casterId: ctx.casterId });
      continue;
    }
    const follow: CombatFxFollow =
      layer.attachTo === 'target' ? 'target' : layer.attachTo === 'hit-point' ? 'hit-point' : layer.attachTo === 'world-position' ? 'world' : 'caster';
    const anchor = follow === 'target' && tpos ? { x: tpos.x, y: tpos.y, z: tpos.z, heading: ctx.heading } : { x: ctx.x, y: ctx.y, z: ctx.z, heading: ctx.heading };
    const cfg = buildLayerConfig(cinematicEffectId, layer, def.layers.find((l) => l.color)?.color ?? '#ffffff');
    spawnCombatLayer({ config: cfg, follow, targetId: ctx.targetId, anchor, casterId: ctx.casterId });
  }
  return instanceId;
}

// Preview at the live player position (debug/editor).
export function previewEffect(cinematicEffectId: string): string | null {
  return playEffect(cinematicEffectId, { casterId: 'preview', x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, heading: robotHandle.heading });
}

export function cleanupEffectsForCaster(casterId: string): void {
  cleanupCinematicForCaster(casterId);
  PhysicsVfxDirector.cleanupForCaster();
}
export function cleanupAllForPhaseChange(): void {
  cleanupAllCinematic();
  PhysicsVfxDirector.cleanupAll();
}

export function exportEffectSnapshot(cinematicEffectId: string): string {
  const def = getCinematicEffect(cinematicEffectId);
  return JSON.stringify(def ?? { error: 'not found', id: cinematicEffectId }, null, 2);
}

export function resolveCinematicEffect(id: string): CinematicEffectDefinition | undefined {
  return getCinematicEffect(id);
}
