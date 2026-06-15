import { describe, it, expect } from 'vitest';
import { cloneTransformAt, cloneDirection, defaultCloneParameters } from './cloneSampling';
import { evaluateEffectsAtTime } from './evaluateEffectsAtTime';
import type { TransformationDefinition } from '../../../types/game/transformation';
import type { TransformationEffectConfig } from '../../../types/game/transformationEffects';

const P = defaultCloneParameters();

describe('cloneSampling (inflate, default)', () => {
  it('scale grows monotonically toward cloneEndScale', () => {
    const a = cloneTransformAt(0, P, 0.1).scale;
    const b = cloneTransformAt(0, P, 0.5).scale;
    const c = cloneTransformAt(0, P, 0.95).scale;
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeGreaterThan(P.cloneEndScale * 0.7);
  });

  it('stays laterally centred (x,z within cluster) and shifts DOWN as it inflates (keeps visual centre)', () => {
    const r = P.cloneClusterRadius + 1e-6;
    for (const prog of [0.1, 0.5, 0.95]) {
      const s = cloneTransformAt(0, P, prog);
      expect(Math.abs(s.position[0])).toBeLessThanOrEqual(r);
      expect(Math.abs(s.position[2])).toBeLessThanOrEqual(r);
    }
    expect(cloneTransformAt(0, P, 0.9).position[1]).toBeLessThan(cloneTransformAt(0, P, 0.2).position[1]);
  });

  it('stays visible while growing, fades only when huge (near end)', () => {
    expect(cloneTransformAt(0, P, 0.5).opacity).toBeGreaterThan(P.cloneOpacity * 0.6);
    expect(cloneTransformAt(0, P, 0.99).opacity).toBeLessThan(P.cloneOpacity * 0.2);
  });

  it('distinct directions per clone', () => {
    const d0 = cloneDirection(0, P.cloneCount, P);
    const d1 = cloneDirection(1, P.cloneCount, P);
    expect(d0[0] !== d1[0] || d0[2] !== d1[2]).toBe(true);
  });

  it('is deterministic (same progress → same state)', () => {
    expect(cloneTransformAt(3, P, 0.42)).toEqual(cloneTransformAt(3, P, 0.42));
  });
});

describe('cloneSampling (spread, legacy mode)', () => {
  const S = { ...P, cloneGrowthMode: 'spread' as const };
  it('flies outward over progress, capped at the boundary', () => {
    expect(Math.hypot(...cloneTransformAt(0, S, 0.6).position)).toBeGreaterThan(Math.hypot(...cloneTransformAt(0, S, 0.05).position));
    const maxDist = Math.min(S.cloneSpreadRadius, S.cloneBoundaryRadius);
    for (let i = 0; i < S.cloneCount; i++) expect(Math.hypot(...cloneTransformAt(i, S, 1).position)).toBeLessThanOrEqual(maxDist + 1e-6);
  });
});

const cfg = (over: Partial<TransformationEffectConfig> = {}): TransformationEffectConfig => ({
  effectId: 'e1', effectName: 'Clone', effectType: 'clone_burst_effect', enabled: true,
  startTime: 1, duration: 4, delay: 0, layerOrder: 0, attachToBone: false, useCharacterModel: true,
  useCustomModel: false, positionOffset: [0, 0, 0], rotationOffset: [0, 0, 0], scaleMultiplier: 1,
  opacity: 1, fadeInDuration: 0.3, fadeOutDuration: 1, color: '#fff', emissiveColor: '#fff', intensity: 1,
  blendMode: 'additive', loop: false, previewEnabled: true, parameters: P, ...over,
});

describe('evaluateEffectsAtTime', () => {
  const def = { effects: [cfg()] } as unknown as TransformationDefinition;

  it('is inactive before start and after end', () => {
    expect(evaluateEffectsAtTime(def, 0.5)).toHaveLength(0);
    expect(evaluateEffectsAtTime(def, 6)).toHaveLength(0);
  });

  it('reports correct progress inside the window (t=1→0, t=3→0.5, t=5→1)', () => {
    expect(evaluateEffectsAtTime(def, 1)[0].progress).toBeCloseTo(0, 3);
    expect(evaluateEffectsAtTime(def, 3)[0].progress).toBeCloseTo(0.5, 3);
    expect(evaluateEffectsAtTime(def, 5)[0].progress).toBeCloseTo(1, 3);
  });

  it('skips disabled effects and (in preview) previewEnabled=false', () => {
    expect(evaluateEffectsAtTime({ effects: [cfg({ enabled: false })] } as unknown as TransformationDefinition, 3)).toHaveLength(0);
    expect(evaluateEffectsAtTime({ effects: [cfg({ previewEnabled: false })] } as unknown as TransformationDefinition, 3, true)).toHaveLength(0);
  });
});
