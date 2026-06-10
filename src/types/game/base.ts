// Editable layout of the 3D home base (hangar interior). Each part is a data object placed + tuned in
// Edit Mode (gizmo move + tab fields), rendered with a real model when `assetId` is set, else a primitive
// box sized by `size`. Mirrors the kit's collision-shape vocabulary so parts can drop straight into the
// reused Rapier collidable renderers.
export type BasePartKind =
  | 'spawn'
  | 'hangar'
  | 'apron'
  | 'navline'
  | 'warning_light'
  | 'gate'
  | 'lift_platform'
  | 'tunnel_entrance'
  | 'base_exit'
  | 'wall';

export const BASE_PART_KINDS: readonly BasePartKind[] = [
  'spawn',
  'hangar',
  'apron',
  'navline',
  'warning_light',
  'gate',
  'lift_platform',
  'tunnel_entrance',
  'base_exit',
  'wall',
];

// Same members as the kit's CollisionShape (game/edit/sceneEditMerge) so values pass straight through.
export type BaseCollision = 'none' | 'cuboid' | 'hull' | 'trimesh';
export const BASE_COLLISIONS: readonly BaseCollision[] = ['none', 'cuboid', 'hull', 'trimesh'];

export interface BasePart {
  id: string;
  kind: BasePartKind;
  label: string;
  assetId?: string; // kit model-library id; empty → primitive box (size)
  modelTarget?: number; // when assetId set: normalise the model's largest dim to this many world units
  position: [number, number, number];
  rotation: [number, number, number]; // radians
  scale: number;
  size: [number, number, number]; // primitive box dimensions (when no assetId)
  color: string;
  collision: BaseCollision;
}
