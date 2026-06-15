import { describe, it, expect } from 'vitest';
import { queryHits, hitVolumeActiveWindow, type HitTargetPoint, type HitVolumeWorld } from './HitVolumeRuntime';
import type { HitVolumeDefinition } from '../../types/game/combat';

// Facing +Z (heading 0 → dir (0,1) per sin/cos), origin at world 0.
const world: HitVolumeWorld = { originX: 0, originZ: 0, dirX: 0, dirZ: 1 };
const targets: HitTargetPoint[] = [
  { id: 'front', x: 0, y: 0, z: 5 },
  { id: 'side', x: 6, y: 0, z: 0 },
  { id: 'far', x: 0, y: 0, z: 30 },
  { id: 'behind', x: 0, y: 0, z: -5 },
];

describe('HitVolumeRuntime.queryHits', () => {
  it('sphere hits everything within radius regardless of facing', () => {
    const hv: HitVolumeDefinition = { id: 'h', shape: 'sphere', origin: 'character-root', radius: 6, activeDurationSeconds: 1 };
    const hits = queryHits(hv, world, targets);
    expect(hits).toContain('front');
    expect(hits).toContain('side');
    expect(hits).toContain('behind');
    expect(hits).not.toContain('far');
  });

  it('line hits forward targets within length/width, not behind or to the side', () => {
    const hv: HitVolumeDefinition = { id: 'h', shape: 'line', origin: 'character-forward', length: 16, width: 2, activeDurationSeconds: 1 };
    const hits = queryHits(hv, world, targets);
    expect(hits).toEqual(['front']);
  });

  it('cone hits forward arc only', () => {
    const hv: HitVolumeDefinition = { id: 'h', shape: 'cone', origin: 'character-forward', radius: 8, angleDegrees: 90, activeDurationSeconds: 1 };
    const hits = queryHits(hv, world, targets);
    expect(hits).toContain('front');
    expect(hits).not.toContain('behind');
    expect(hits).not.toContain('side'); // 90° cone → side at exactly 90° is excluded
  });

  it('box hits within half-length forward and half-width sideways', () => {
    const hv: HitVolumeDefinition = { id: 'h', shape: 'box', origin: 'character-forward', length: 12, width: 4, activeDurationSeconds: 1 };
    const hits = queryHits(hv, world, targets);
    expect(hits).toContain('front');
    expect(hits).not.toContain('far');
  });

  it('active window = delay + duration', () => {
    expect(hitVolumeActiveWindow({ id: 'h', shape: 'sphere', origin: 'character-root', activeDurationSeconds: 0.3, activeDelaySeconds: 0.1 })).toBeCloseTo(0.4, 5);
  });
});
