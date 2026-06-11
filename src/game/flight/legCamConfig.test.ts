import { describe, it, expect } from 'vitest';
import { localFromConfig, configFromLocal } from './legCamConfig';

describe('legCamConfig', () => {
  it('angle 0 = directly behind (+z)', () => {
    expect(localFromConfig(10, 4, 0)).toEqual([0, 4, 10]);
  });
  it('angle 90 = to the side (+x)', () => {
    const [x, y, z] = localFromConfig(10, 4, 90);
    expect(x).toBeCloseTo(10);
    expect(y).toBe(4);
    expect(z).toBeCloseTo(0);
  });
  it('round-trips local <-> config', () => {
    const local = localFromConfig(12, 3, 35);
    const cfg = configFromLocal(local[0], local[1], local[2]);
    expect(cfg.distance).toBeCloseTo(12);
    expect(cfg.height).toBeCloseTo(3);
    expect(cfg.angleDeg).toBeCloseTo(35);
  });
});
