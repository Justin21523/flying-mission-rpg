import { describe, it, expect, beforeEach } from 'vitest';
import { lodForDistance, qualityCullMultiplier } from './lod';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';

describe('lodForDistance', () => {
  const t = { highWithin: 50, cullBeyond: 100 };
  it('grades high / low / culled by distance', () => {
    expect(lodForDistance(10, t)).toBe('high');
    expect(lodForDistance(75, t)).toBe('low');
    expect(lodForDistance(150, t)).toBe('culled');
  });
});

describe('qualityCullMultiplier', () => {
  beforeEach(() => useGraphicsSettingsStore.getState().setTier('medium'));
  it('lower quality sees less far; higher sees a bit more', () => {
    useGraphicsSettingsStore.getState().setTier('low');
    expect(qualityCullMultiplier()).toBeLessThan(1);
    useGraphicsSettingsStore.getState().setTier('high');
    expect(qualityCullMultiplier()).toBeGreaterThan(1);
    useGraphicsSettingsStore.getState().setTier('medium');
    expect(qualityCullMultiplier()).toBe(1);
  });
});
