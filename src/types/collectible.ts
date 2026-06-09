import type { AbilityType } from './character';

// POLI — three.js built-in-geometry collectible economy. Many simple primitive collectibles are scattered in
// each area; each TYPE adds its `value` to a RESOURCE. When a resource reaches its `threshold` it triggers a
// chosen ability — automatically, or armed for a key press. All editable in the 🌤 Environment tab.

export type CollectibleShape = 'box' | 'sphere' | 'cone' | 'torus' | 'tetra' | 'cylinder' | 'octa' | 'dodeca' | 'icosa';
export const COLLECTIBLE_SHAPES: CollectibleShape[] = ['box', 'sphere', 'cone', 'torus', 'tetra', 'cylinder', 'octa', 'dodeca', 'icosa'];

export interface CollectibleType {
  id: string;
  name: string;
  shape: CollectibleShape;
  color: string;
  size: number;        // base half-size / radius of the primitive
  value: number;       // amount added to the resource when collected
  resourceId: string;  // which resource this fills
  count: number;       // how many scattered on the GROUND per area (× the area's pickupDensity)
  airCount?: number;   // how many scattered in the AIR per area (× pickupDensity); default 0
  airMinHeight?: number; // lowest air-scatter height (default 3)
  airMaxHeight?: number; // highest air-scatter height (default 22)
  spin?: boolean;      // spin + bob (default true)
  emissive?: number;   // emissive intensity (default 0.6)
}

export interface ResourceDef {
  id: string;
  name: string;
  color: string;
  threshold: number;          // amount needed to trigger the ability
  abilityType?: AbilityType;  // ability fired when the threshold is reached
  auto: boolean;              // true = fire automatically; false = arm and wait for `key`
  key?: string;               // KeyboardEvent.code to spend an armed resource (non-auto)
  abilityRadius?: number;
  abilityDuration?: number;
  abilityStrength?: number;
}

export interface CollectibleConfig {
  types: CollectibleType[];
  resources: ResourceDef[];
}
