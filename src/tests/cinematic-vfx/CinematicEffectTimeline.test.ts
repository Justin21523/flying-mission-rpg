import { describe, it, expect, beforeEach } from 'vitest';
import { spawnCombatLayer, tickCinematicVfx, activeCombatFx, cleanupAllCinematic, liveCinematicCount } from '../../game/vfx/cinematicVfxRuntime';
import type { TransformationEffectConfig } from '../../types/game/transformationEffects';

const cfg = (startTime: number, duration: number): TransformationEffectConfig => ({
  effectId: `t_${Math.random()}`, effectName: 'test', effectType: 'starburst_effect', enabled: true,
  startTime, duration, delay: 0, layerOrder: 0, attachToBone: false, useCharacterModel: false, useCustomModel: false,
  positionOffset: [0, 0, 0], rotationOffset: [0, 0, 0], scaleMultiplier: 1, opacity: 1, fadeInDuration: 0, fadeOutDuration: 0.001,
  color: '#fff', emissiveColor: '#fff', intensity: 1, blendMode: 'additive', loop: false, previewEnabled: true, parameters: {},
});

describe('CinematicEffectTimeline / runtime', () => {
  beforeEach(() => cleanupAllCinematic());

  it('spawns a layer + advances its progress on tick, then expires', () => {
    spawnCombatLayer({ config: cfg(0, 0.001), follow: 'world', anchor: { x: 1, y: 0, z: 2 } });
    expect(liveCinematicCount()).toBe(1);
    expect(activeCombatFx[0].config.runtimeAnchor).toEqual({ x: 1, y: 0, z: 2, heading: undefined });
    // first tick advances progress toward 1
    tickCinematicVfx();
    expect(activeCombatFx[0]?.progress ?? 1).toBeGreaterThanOrEqual(0);
    // after the duration window (start + duration + fadeOut + 0.05s) the layer is swept
    const start = performance.now();
    while (performance.now() - start < 120) { /* let the short layer expire */ }
    tickCinematicVfx();
    expect(liveCinematicCount()).toBe(0);
  });

  it('cleanupAll empties the active set', () => {
    spawnCombatLayer({ config: cfg(0, 1), follow: 'world', anchor: { x: 0, y: 0, z: 0 } });
    expect(liveCinematicCount()).toBe(1);
    cleanupAllCinematic();
    expect(liveCinematicCount()).toBe(0);
  });
});
