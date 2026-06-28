// Wave 1 — Elite Affixes. A spawn-time modifier system: normal enemies can roll one or more affixes that
// scale their stats and add runtime behaviours (death explosion / regen / lifesteal). One injection point
// (post-spawn mutation, mirroring EliteEncounterDirector) covers zones, arena waves and boss summons.
export type AffixId = 'shielded' | 'volatile' | 'swift' | 'regenerating' | 'vampiric' | 'berserk' | 'summoner' | 'reflect' | 'teleport';

export const AFFIX_IDS: readonly AffixId[] = ['shielded', 'volatile', 'swift', 'regenerating', 'vampiric', 'berserk', 'summoner', 'reflect', 'teleport'];

export interface EliteAffixDefinition {
  id: AffixId;
  name: string;
  hpMult?: number; // multiply maxHp (e.g. tanky)
  speedMult?: number; // multiply moveSpeed (swift)
  addShield?: number; // flat shield added (legacy; prefer shieldFraction so low-HP enemies aren't over-tanked)
  shieldFraction?: number; // shield added as a fraction of maxHp (shielded) — consistent across HP tiers
  onDeathExplosion?: { radius: number; damage: number }; // volatile
  regenPerSec?: number; // regenerating
  lifestealFraction?: number; // vampiric — fraction of damage dealt to player healed back
  berserk?: { hpThreshold: number; speedMult: number }; // Wave 5 — under hpThreshold (0..1) move ×speedMult
  onDeathSummon?: { enemyId: string; count: number }; // Wave 5 — spawn count minions of enemyId on death
  reflectFraction?: number; // Wave 6 — bounce this fraction of incoming player damage back to the player
  teleport?: { intervalMs: number; rangePerBlink: number }; // Wave 6 — blink toward the player every intervalMs
  description?: string; // player-facing one-liner for the Codex affix legend
  auraColor: string;
  enabled?: boolean;
}

export const SEED_ELITE_AFFIXES: EliteAffixDefinition[] = [
  { id: 'shielded', name: 'Shielded', hpMult: 1.15, shieldFraction: 0.45, auraColor: '#38bdf8', description: 'Starts behind a heavy shield — break it first.', enabled: true },
  { id: 'volatile', name: 'Volatile', hpMult: 1.0, onDeathExplosion: { radius: 6, damage: 35 }, auraColor: '#f97316', description: 'Detonates on death — don’t finish it point-blank.', enabled: true },
  { id: 'swift', name: 'Swift', speedMult: 1.35, hpMult: 0.9, auraColor: '#a3e635', description: 'Moves much faster, but is more fragile.', enabled: true },
  { id: 'regenerating', name: 'Regenerating', hpMult: 1.25, regenPerSec: 6, auraColor: '#34d399', description: 'Heals over time — burst it down fast.', enabled: true },
  { id: 'vampiric', name: 'Vampiric', hpMult: 1.15, lifestealFraction: 0.5, auraColor: '#f43f5e', description: 'Heals itself from the damage it deals to you.', enabled: true },
  // Wave 5 — frenzies (faster) once wounded.
  { id: 'berserk', name: 'Berserk', hpMult: 1.1, berserk: { hpThreshold: 0.4, speedMult: 1.6 }, auraColor: '#fb7185', description: 'Enrages and speeds up once badly wounded.', enabled: true },
  // Wave 5 — spawns a small swarm when it dies (zip-glitch minions).
  { id: 'summoner', name: 'Summoner', hpMult: 1.1, onDeathSummon: { enemyId: 'zip_glitch', count: 2 }, auraColor: '#c084fc', description: 'Spawns a small swarm of minions when it dies.', enabled: true },
  // Wave 6 — bounces a fifth of your damage back; blinks toward you on a timer.
  // Balance pass — reflect 25%→20% (self-damage stacks across multiple reflect elites + AOE); teleport
  // 2.5s/5u → 3.5s/4u (less oppressive gap-close, more telegraphed alongside the new blink VFX).
  { id: 'reflect', name: 'Reflect', hpMult: 1.15, reflectFraction: 0.2, auraColor: '#a78bfa', description: 'Bounces a fifth of your damage back at you.', enabled: true },
  { id: 'teleport', name: 'Blink', hpMult: 1.1, teleport: { intervalMs: 3500, rangePerBlink: 4 }, auraColor: '#22d3ee', description: 'Blinks toward you — hard to escape by running.', enabled: true },
];

// Per-spawn affix policy (lives on a spawn group, or generated per arena round).
export interface AffixPolicy {
  allowedAffixIds: AffixId[];
  chancePerEnemy: number; // 0..1 probability an enemy gets any affix
  maxPerEnemy: number; // cap of distinct affixes per enemy
}

// Arena escalation — later rounds roll affixes more often and stack more of them.
export function arenaAffixPolicy(round: number): AffixPolicy {
  return {
    allowedAffixIds: [...AFFIX_IDS],
    chancePerEnemy: Math.min(0.6, 0.08 + round * 0.04),
    maxPerEnemy: round >= 8 ? 2 : 1,
  };
}
