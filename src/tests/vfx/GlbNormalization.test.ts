import { describe, it, expect } from 'vitest';
import { Mesh, BoxGeometry, MeshBasicMaterial, Group } from 'three';
import { measureNormalization } from '../../game/poli/normalizeGlb';

// A box mesh sized (W,H,D) centred at (cx,cy,cz) wrapped in a group.
function boxObject(w: number, h: number, d: number, cx: number, cy: number, cz: number): Group {
  const m = new Mesh(new BoxGeometry(w, h, d), new MeshBasicMaterial());
  m.position.set(cx, cy, cz);
  const g = new Group();
  g.add(m);
  return g;
}

describe('measureNormalization (GLB size/pivot fit for VFX + world models)', () => {
  it('scales a tall model down to the target height', () => {
    const obj = boxObject(2, 200, 2, 0, 100, 0); // 200 units tall (cm-authored), feet at y=0
    const { scale } = measureNormalization(obj, 1.4);
    expect(scale).toBeCloseTo(1.4 / 200, 5);
  });

  it('scales a tiny model up to the target height', () => {
    const obj = boxObject(0.1, 0.2, 0.1, 0, 0.1, 0);
    const { scale } = measureNormalization(obj, 1.4);
    expect(scale).toBeCloseTo(1.4 / 0.2, 5);
  });

  it('recenters an off-pivot model on X/Z with feet at y=0 (offset pre-scaled)', () => {
    const obj = boxObject(2, 2, 2, 50, 31, -20); // far from origin; box.min.y = 30
    const { scale, offset } = measureNormalization(obj, 1.4);
    // offset = [-centerX*scale, -minY*scale, -centerZ*scale]
    expect(offset[0]).toBeCloseTo(-50 * scale, 5);
    expect(offset[1]).toBeCloseTo(-30 * scale, 5); // min.y = 31 - 1 = 30
    expect(offset[2]).toBeCloseTo(20 * scale, 5);
  });

  it('falls back to scale 1 for a degenerate (empty) object', () => {
    const { scale } = measureNormalization(new Group(), 1.4);
    expect(Number.isFinite(scale)).toBe(true);
    expect(scale).toBe(1.4); // nativeHeight falls back to 1 → scale = targetHeight
  });
});
