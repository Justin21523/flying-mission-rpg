import type { SuperMove } from '../../types/character';

// A default six-slot super-move set so EVERY character can attack with keys 1–6 even when its data carries no
// authored `supers` (the seed roster currently doesn't). Tinted by the character's colour; varied kinds so the
// six slots feel distinct. A per-character `supers` array (authored in Edit Mode) always overrides this.
// Pure → unit-testable; the destination controller falls back to it when `character.supers` is empty.
export function defaultSupers(color: string): SuperMove[] {
  return [
    { id: 'def_s1', name: 'Pulse Nova', kind: 'nova', color, damage: 40, radius: 8, cooldownSec: 4 },
    { id: 'def_s2', name: 'Beam Lance', kind: 'beam', color, damage: 32, range: 16, duration: 0.8, cooldownSec: 5 },
    { id: 'def_s3', name: 'Bolt Volley', kind: 'bolt', color, damage: 24, range: 14, count: 5, cooldownSec: 4 },
    { id: 'def_s4', name: 'Dash Strike', kind: 'dash', color, damage: 45, range: 12, duration: 0.35, cooldownSec: 4 },
    { id: 'def_s5', name: 'Burst Bomb', kind: 'bomb', color, damage: 55, radius: 7, range: 10, duration: 0.7, cooldownSec: 6 },
    { id: 'def_s6', name: 'Chain Spark', kind: 'chain', color, damage: 30, range: 12, count: 5, cooldownSec: 4 },
  ];
}
