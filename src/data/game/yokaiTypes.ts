import type { YokaiType, YokaiBehavior } from '../../types/yokai';

// Seed roster of hunt "sprite" types (child-friendly, non-violent mischief creatures — original codenames).
// Each spawns with its AI behaviour + combat stats; empty modelAssetId → a random model from public/models.
const mk = (id: string, name: string, color: string, behavior: YokaiBehavior, p: Partial<YokaiType>): YokaiType => ({
  id, name, color, behavior, modelAssetId: '', elite: false,
  hp: 50, moveSpeed: 3, aggroRange: 12, attackRange: 1.8, attackRate: 1.5, attackDamage: 6, fleeHpPct: 0.2,
  enabled: true, ...p,
});

export const SEED_AERO_YOKAI: YokaiType[] = [
  mk('yk_rusher', 'Rusher Sprite', '#a855f7', 'chaser', { hp: 45, moveSpeed: 3.4 }),
  mk('yk_lurker', 'Lurker Sprite', '#7c3aed', 'ambusher', { hp: 55, moveSpeed: 2.6, aggroRange: 9 }),
  mk('yk_spitter', 'Drifter Sprite', '#22d3ee', 'kiter', { hp: 40, moveSpeed: 3, attackRange: 8, attackRate: 2 }),
  mk('yk_swarm', 'Swarmling', '#f472b6', 'swarmer', { hp: 35, moveSpeed: 3.2 }),
  mk('yk_brute', 'Big Gust', '#ef4444', 'chaser', { elite: true, hp: 140, moveSpeed: 2.4, attackDamage: 12 }),
];
