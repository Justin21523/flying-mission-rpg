import type { SuperKind } from '../../types/character';

// POLI yokai-hunt — decoupled super-attack damage bus. A super move (transformStore.triggerSuperMove) emits a
// DamageRequest; the yokai combat layer (Phase B) registers a sink that applies it to live yokai. Until a sink
// is registered (e.g. no hunt running, or Phase A alone) this is a harmless no-op, so the super VFX/input can
// ship and be tested independently.
export interface DamageRequest {
  kind: SuperKind;
  x: number; y: number; z: number;  // origin (player position)
  dirX: number; dirZ: number;       // forward unit direction (facing)
  damage: number;
  radius: number;                   // AoE / homing search radius (nova/orb/meteor/bomb/spin/blackhole)
  range: number;                    // forward reach (beam/bolt/dash/boomerang)
  count: number;                    // chain jumps (chain) / projectile count
}

type Sink = (r: DamageRequest) => void;
let sink: Sink | null = null;

// The yokai combat layer calls this on mount to receive super hits, and clears it (null) on unmount.
export function setSuperDamageSink(fn: Sink | null): void { sink = fn; }

export function applySuperDamage(r: DamageRequest): void { sink?.(r); }
