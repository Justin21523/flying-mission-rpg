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
  enabled?: boolean;
}

export const SEED_ELEMENT_REACTIONS: ElementReactionDefinition[] = [
  // Frozen + a shock/heavy hit → shatter the ice for a big single-target burst.
  {
    id: 'rxn_shatter', reaction: 'shatter',
    primaryStatus: 'frozen', triggerStatus: 'shocked',
    bonusDamage: 45, consumesPrimary: true, cooldownMs: 600,
    damageType: 'impact', attackTags: ['reaction', 'shatter'], enabled: true,
  },
  // Burning + shock → overload explosion (AoE).
  {
    id: 'rxn_overload', reaction: 'overload',
    primaryStatus: 'burning', triggerStatus: 'shocked',
    bonusDamage: 30, aoeRadius: 6, consumesPrimary: true, cooldownMs: 800,
    damageType: 'energy', attackTags: ['reaction', 'overload', 'aoe'], enabled: true,
  },
  // Shocked + another shock → conduct: chain a smaller burst to nearby enemies.
  {
    id: 'rxn_conduct', reaction: 'conduct',
    primaryStatus: 'shocked', triggerStatus: 'shocked',
    bonusDamage: 18, aoeRadius: 8, consumesPrimary: false, cooldownMs: 700,
    damageType: 'electric', attackTags: ['reaction', 'conduct', 'aoe'], enabled: true,
  },
  // Frozen + burn → meltdown: high burst as the target thaws violently.
  {
    id: 'rxn_meltdown', reaction: 'meltdown',
    primaryStatus: 'frozen', triggerStatus: 'burning',
    bonusDamage: 38, consumesPrimary: true, cooldownMs: 700,
    damageType: 'fire', attackTags: ['reaction', 'meltdown'], enabled: true,
  },
];
