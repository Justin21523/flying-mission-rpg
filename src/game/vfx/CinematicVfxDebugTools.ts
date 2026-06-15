import { liveCinematicCount, poolActiveCount, cleanupAllCinematic } from './cinematicVfxRuntime';
import { poolCapacity } from './CinematicEffectPool';
import { previewEffect, exportEffectSnapshot } from './CinematicVfxDirector';
import { getCinematicEffect } from '../../stores/game/useCinematicEffectStore';

// Debug helpers for the Cinematic VFX panel (Batch F.5) — counts, preview, cleanup, snapshot.
export interface CinematicVfxStats {
  activeEffects: number;
  pooledInstances: number;
  poolCapacity: number;
  layerCount: number;
}

export function vfxStats(selectedEffectId?: string): CinematicVfxStats {
  const def = selectedEffectId ? getCinematicEffect(selectedEffectId) : undefined;
  return {
    activeEffects: liveCinematicCount(),
    pooledInstances: poolActiveCount(),
    poolCapacity: poolCapacity(),
    layerCount: def?.layers.length ?? 0,
  };
}

export function previewVfx(effectId: string): void {
  previewEffect(effectId);
}
export function cleanupAllVfx(): void {
  cleanupAllCinematic();
}
export function snapshotVfx(effectId: string): string {
  return exportEffectSnapshot(effectId);
}
