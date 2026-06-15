import { CanvasTexture } from 'three';
import { txFrame, type TransformationGhostActor } from '../transformationRuntime';
import type { ActiveEffectV2, TransformationEffectConfig } from '../../../types/game/transformationEffects';

// Shared helpers for v2 effect renderers: find the live character actor (world transform + model id), the
// effect's live progress this frame, and an anchor position. Reading from txFrame.snapshot (mutated by the
// director each frame) keeps renderers deterministic + per-frame-allocation-free.

export function currentActor(): TransformationGhostActor | undefined {
  const g = txFrame.ghostActors;
  return g.activeRef ?? g.robot ?? g.shared ?? g.plane;
}

export function effectModelId(config: TransformationEffectConfig): string | undefined {
  if (config.useCustomModel && config.customModelPrefabId) return config.customModelPrefabId;
  if (config.targetModelId) return config.targetModelId;
  return currentActor()?.modelId ?? txFrame.charModelId ?? txFrame.def?.robotModelRef ?? txFrame.def?.sharedModelRef;
}

export function anchorPosition(config: TransformationEffectConfig): [number, number, number] {
  const o = config.positionOffset;
  // Batch F.5 — combat-driven effects carry an explicit world anchor (refreshed each frame by the combat
  // tick). Transformation effects fall through to the live transforming actor.
  const ra = config.runtimeAnchor;
  if (ra) return [ra.x + o[0], ra.y + o[1], ra.z + o[2]];
  const a = currentActor();
  if (!a) return [o[0], o[1], o[2]];
  return [a.position[0] + o[0], a.position[1] + o[1], a.position[2] + o[2]];
}

// Live effect entry this frame (fresh progress) by id — the host only re-renders on SET change, so renderers
// pull the live progress from the snapshot every frame instead of the stale prop.
export function liveV2(effectId: string, fallback: ActiveEffectV2): ActiveEffectV2 {
  const list = txFrame.snapshot?.activeEffectsV2;
  if (!list) return fallback;
  for (const e of list) if (e.config.effectId === effectId) return e;
  return fallback;
}

// envelope: config-level fade-in/out across the effect's own progress (multiplies per-effect opacity).
export function fadeEnvelope(config: TransformationEffectConfig, progress: number, duration: number): number {
  const fin = duration > 0 ? config.fadeInDuration / duration : 0;
  const fout = duration > 0 ? config.fadeOutDuration / duration : 0;
  let e = 1;
  if (fin > 0 && progress < fin) e = progress / fin;
  else if (fout > 0 && progress > 1 - fout) e = Math.max(0, (1 - progress) / fout);
  return e * config.opacity;
}

// A soft radial sprite texture (shared by particle/star effects). Caller disposes on unmount.
export function makeSoftTexture(): CanvasTexture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}
