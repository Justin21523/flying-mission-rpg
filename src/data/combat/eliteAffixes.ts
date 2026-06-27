// Wave 1 — Elite Affixes. A spawn-time modifier system: normal enemies can roll one or more affixes that
// scale their stats and add runtime behaviours (death explosion / regen / lifesteal). One injection point
// (post-spawn mutation, mirroring EliteEncounterDirector) covers zones, arena waves and boss summons.
export type AffixId = 'shielded' | 'volatile' | 'swift' | 'regenerating' | 'vampiric';

export const AFFIX_IDS: readonly AffixId[] = ['shielded', 'volatile', 'swift', 'regenerating', 'vampiric'];

export interface EliteAffixDefinition {
  id: AffixId;
  name: string;
  hpMult?: number; // multiply maxHp (e.g. tanky)
  speedMult?: number; // multiply moveSpeed (swift)
  addShield?: number; // flat shield added (shielded)
  onDeathExplosion?: { radius: number; damage: number }; // volatile
  regenPerSec?: number; // regenerating
  lifestealFraction?: number; // vampiric — fraction of damage dealt to player healed back
  auraColor: string;
  enabled?: boolean;
}

export const SEED_ELITE_AFFIXES: EliteAffixDefinition[] = [
  { id: 'shielded', name: 'Shielded', hpMult: 1.15, addShield: 60, auraColor: '#38bdf8', enabled: true },
  { id: 'volatile', name: 'Volatile', hpMult: 1.0, onDeathExplosion: { radius: 6, damage: 35 }, auraColor: '#f97316', enabled: true },
  { id: 'swift', name: 'Swift', speedMult: 1.5, hpMult: 0.9, auraColor: '#a3e635', enabled: true },
  { id: 'regenerating', name: 'Regenerating', hpMult: 1.25, regenPerSec: 6, auraColor: '#34d399', enabled: true },
  { id: 'vampiric', name: 'Vampiric', hpMult: 1.15, lifestealFraction: 0.5, auraColor: '#f43f5e', enabled: true },
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
