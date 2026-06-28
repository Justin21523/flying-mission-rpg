import type { StatusEffectId } from './statusRules';

// Wave 1 — Element Reactions. When a target that ALREADY carries a primary status (e.g. frozen) receives a
// trigger status (e.g. shocked / a heavy-impact hit applying armor-broken), a reaction fires: a burst of bonus
// damage (optionally AoE), an optional VFX, and (by default) the primary status is consumed. Editable in the
// ⬆ Progression tab, same data-driven model as statusRules — no ability retagging needed.
export type ReactionId = 'shatter' | 'overload' | 'conduct' | 'meltdown';

export interface ElementReactionDefinition {
  id: string;
  reaction: ReactionId;
  primaryStatus: StatusEffectId; // already on the target
  triggerStatus: StatusEffectId; // newly applied / re-applied this hit
  bonusDamage: number; // flat burst to the reacting target
  aoeRadius?: number; // >0 → also splash bonusDamage to enemies within radius
  consumesPrimary?: boolean; // remove the primary status after reacting (default true) — prevents spam
  cooldownMs?: number; // per-target reaction cooldown (default 600)
  vfxEffectId?: string; // optional cinematic effect id to play at the target
  damageType?: string; // burst damage type (default 'energy')
  attackTags?: string[]; // burst tags (default ['reaction', <reaction>])
  // Wave 4 — chains & propagation (optional; backward-compatible).
  resultsInStatus?: StatusEffectId; // apply this status to the primary target after reacting (enables a follow-up reaction)
  propagatesStatus?: { statusType: StatusEffectId; radius: number }; // spread a status to enemies within radius
  enabled?: boolean;
}

export const SEED_ELEMENT_REACTIONS: ElementReactionDefinition[] = [
  // Frozen + a shock/heavy hit → shatter the ice for a big single-target burst.
  {
    id: 'rxn_shatter', reaction: 'shatter',
    primaryStatus: 'frozen', triggerStatus: 'shocked',
    bonusDamage: 45, consumesPrimary: true, cooldownMs: 600,
    damageType: 'impact', attackTags: ['reaction', 'shatter'],
    vfxEffectId: 'fx_shatter_burst', enabled: true,
  },
  // Burning + shock → overload explosion (AoE).
  {
    id: 'rxn_overload', reaction: 'overload',
    primaryStatus: 'burning', triggerStatus: 'shocked',
    bonusDamage: 30, aoeRadius: 6, consumesPrimary: true, cooldownMs: 800,
    damageType: 'energy', attackTags: ['reaction', 'overload', 'aoe'],
    vfxEffectId: 'fx_overload_blast', enabled: true,
  },
  // Shocked + another shock → conduct: chain a smaller burst to nearby enemies.
  {
    id: 'rxn_conduct', reaction: 'conduct',
    primaryStatus: 'shocked', triggerStatus: 'shocked',
    bonusDamage: 18, aoeRadius: 8, consumesPrimary: false, cooldownMs: 700,
    damageType: 'electric', attackTags: ['reaction', 'conduct', 'aoe'],
    vfxEffectId: 'fx_conduct_chain', enabled: true,
  },
  // Frozen + burn → meltdown: high burst as the target thaws violently, then leaves it armor-broken so a
  // follow-up heavy/shield-break hit chains into another reaction (Wave 4 chain).
  {
    id: 'rxn_meltdown', reaction: 'meltdown',
    primaryStatus: 'frozen', triggerStatus: 'burning',
    bonusDamage: 38, consumesPrimary: true, cooldownMs: 700,
    damageType: 'fire', attackTags: ['reaction', 'meltdown'],
    resultsInStatus: 'armor-broken', vfxEffectId: 'fx_meltdown_implosion', enabled: true,
  },
  // Wave 4 — burning + shock advanced overload: spreads burning to nearby enemies (chain into more overloads).
  {
    id: 'rxn_overload_spread', reaction: 'overload',
    primaryStatus: 'burning', triggerStatus: 'shocked',
    bonusDamage: 22, aoeRadius: 6, consumesPrimary: true, cooldownMs: 900,
    damageType: 'energy', attackTags: ['reaction', 'overload', 'aoe'],
    propagatesStatus: { statusType: 'burning', radius: 5 }, vfxEffectId: 'fx_overload_blast', enabled: false,
  },
];
