import { create } from 'zustand';
import type { ActiveEffectV2, TransformationEffectConfig } from '../../types/game/transformationEffects';
import { liveTargets } from '../../stores/game/combatTargetStore';
import { robotHandle } from '../destination/robotHandle';
import { acquire, release, activeCount, resetPool } from './CinematicEffectPool';

// Combat-driven cinematic effect runtime (Batch F.5). Holds the live combat effect layers (each an
// ActiveEffectV2 that the SHARED V2 registry renderers draw), advances their progress on a REAL clock (vs the
// transformation timeline's scrub), and refreshes each one's world anchor each frame so it follows the
// caster/target. The host (CinematicVfxLayer) re-renders only when the SET changes (version bump); per-frame
// progress/anchor are mutated in place, so the renderers' liveV2 fallback stays fresh.

export type CombatFxFollow = 'caster' | 'target' | 'world' | 'hit-point';

interface CombatFxInstance {
  fx: ActiveEffectV2;
  follow: CombatFxFollow;
  targetId?: string;
  baseX: number; baseY: number; baseZ: number;
  spawnedAtSec: number;
  endSec: number; // when this layer is fully done (start + duration + fadeOut)
  casterId?: string;
}

const instances: CombatFxInstance[] = [];
const nowSec = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

interface RuntimeStore { version: number; bump: () => void }
export const useCinematicVfxStore = create<RuntimeStore>((set, get) => ({
  version: 0,
  bump: () => set({ version: get().version + 1 }),
}));

// The fx list the host renders (module-level, mutated in place; SET changes bump the store).
export const activeCombatFx: ActiveEffectV2[] = [];

export interface SpawnLayerRequest {
  config: TransformationEffectConfig; // already built (effectType + parameters + offsets)
  follow: CombatFxFollow;
  targetId?: string;
  anchor: { x: number; y: number; z: number; heading?: number };
  casterId?: string;
}

export function spawnCombatLayer(req: SpawnLayerRequest): boolean {
  if (!acquire()) return false;
  const t = nowSec();
  const cfg = req.config;
  cfg.source = 'combat';
  cfg.runtimeAnchor = { x: req.anchor.x, y: req.anchor.y, z: req.anchor.z, heading: req.anchor.heading };
  const fx: ActiveEffectV2 = { config: cfg, localTime: 0, progress: 0 };
  instances.push({
    fx, follow: req.follow, targetId: req.targetId,
    baseX: req.anchor.x, baseY: req.anchor.y, baseZ: req.anchor.z,
    spawnedAtSec: t, endSec: t + cfg.startTime + cfg.duration + cfg.fadeOutDuration + 0.05,
    casterId: req.casterId,
  });
  activeCombatFx.push(fx);
  useCinematicVfxStore.getState().bump();
  return true;
}

function anchorFor(inst: CombatFxInstance): { x: number; y: number; z: number; heading: number } {
  if (inst.follow === 'caster') return { x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, heading: robotHandle.heading };
  if (inst.follow === 'target' && inst.targetId) {
    const tgt = liveTargets.find((x) => x.id === inst.targetId);
    if (tgt) return { x: tgt.x, y: tgt.y, z: tgt.z, heading: inst.fx.config.runtimeAnchor?.heading ?? 0 };
  }
  return { x: inst.baseX, y: inst.baseY, z: inst.baseZ, heading: inst.fx.config.runtimeAnchor?.heading ?? 0 };
}

// Per-frame: advance progress + refresh anchors, sweep expired. Returns true if the SET changed.
export function tickCinematicVfx(): void {
  const t = nowSec();
  let changed = false;
  for (let i = instances.length - 1; i >= 0; i--) {
    const inst = instances[i];
    const cfg = inst.fx.config;
    const elapsed = t - inst.spawnedAtSec - cfg.startTime;
    const local = Math.max(0, Math.min(cfg.duration, elapsed));
    inst.fx.localTime = local;
    inst.fx.progress = cfg.duration > 0 ? local / cfg.duration : 1;
    const a = anchorFor(inst);
    cfg.runtimeAnchor = { x: a.x, y: a.y, z: a.z, heading: a.heading };
    if (t >= inst.endSec) {
      instances.splice(i, 1);
      const fi = activeCombatFx.indexOf(inst.fx);
      if (fi >= 0) activeCombatFx.splice(fi, 1);
      release();
      changed = true;
    }
  }
  if (changed) useCinematicVfxStore.getState().bump();
}

export function liveCinematicCount(): number {
  return activeCombatFx.length;
}
export function poolActiveCount(): number {
  return activeCount();
}

export function cleanupCinematicForCaster(casterId: string): void {
  let changed = false;
  for (let i = instances.length - 1; i >= 0; i--) {
    if (instances[i].casterId === casterId) {
      const fx = instances[i].fx;
      instances.splice(i, 1);
      const fi = activeCombatFx.indexOf(fx);
      if (fi >= 0) activeCombatFx.splice(fi, 1);
      release();
      changed = true;
    }
  }
  if (changed) useCinematicVfxStore.getState().bump();
}

export function cleanupAllCinematic(): void {
  instances.length = 0;
  activeCombatFx.length = 0;
  resetPool();
  useCinematicVfxStore.getState().bump();
}
