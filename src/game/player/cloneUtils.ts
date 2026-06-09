import { Box3, Vector3, type Material, type Mesh, type Object3D, type AnimationClip } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import type { AnimRule } from '../../types/character';

// POLI yokai-hunt — shared clone construction so a "分身" looks EXACTLY like the player: a SkeletonUtils clone,
// Box3-normalized to the character height, with each mesh's REAL material cloned (textures/colours kept; the
// live player isn't touched). Returns the cloned-material list so callers can fade opacity imperatively.
export interface BuiltClone { clone: Object3D; scale: number; offset: [number, number, number]; materials: Material[] }

export function buildPlayerClone(scene: Object3D, height: number, yOff: number): BuiltClone {
  const clone = SkeletonUtils.clone(scene);
  const box = new Box3().setFromObject(clone);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size); box.getCenter(center);
  const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
  const scale = height / nativeH;
  const ox = Number.isFinite(center.x) ? -center.x * scale : 0;
  const oy = (Number.isFinite(box.min.y) ? -box.min.y * scale : 0) + yOff;
  const oz = Number.isFinite(center.z) ? -center.z * scale : 0;
  const materials: Material[] = [];
  clone.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const list = Array.isArray(m.material) ? m.material : [m.material];
    const next = list.map((src) => { const cm = (src as Material).clone(); materials.push(cm); return cm; });
    m.material = (Array.isArray(m.material) ? next : next[0]) as typeof m.material;
  });
  return { clone, scale, offset: [ox, oy, oz], materials };
}

// The "happy" clip for a celebrating clone: the character's celebrate-trigger rule clip if present, else the
// model's first clip.
export function pickHappyClip(animations: AnimationClip[] | undefined, rules: AnimRule[] | undefined): string | undefined {
  const clips = animations ?? [];
  if (clips.length === 0) return undefined;
  const celebrate = (rules ?? []).find((r) => r.trigger === 'celebrate' && clips.some((c) => c.name === r.clip));
  return celebrate?.clip ?? clips[0].name;
}

// Set opacity across a clone's cloned materials (transparent + no depth-write while fading).
export function setCloneOpacity(materials: Material[], opacity: number): void {
  for (const m of materials) {
    const std = m as unknown as { transparent: boolean; opacity: number; depthWrite: boolean };
    std.opacity = opacity;
    std.transparent = opacity < 0.999;
    std.depthWrite = opacity >= 0.999;
  }
}
