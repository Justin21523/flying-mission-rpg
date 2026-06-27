import type { DamageEvent, DamageResult, DamageableDefinition } from '../../types/game/combat';

// Pure tag-based damage resolution. Shield is consumed first (shielded targets); weakness tags amplify,
// resistance tags reduce, immune tags zero it out; shield-break vs shield weakness tags strips the shield.
// No store access — caller passes the target definition + current hp/shield. Unit-testable.

const WEAKNESS_MULT = 1.5;
const RESIST_MULT = 0.5;

export interface TargetVitals {
  hp: number;
  shield: number;
}

function intersects(a: string[], b: string[] | undefined): boolean {
  if (!b || b.length === 0) return false;
  return a.some((t) => b.includes(t));
}

export function resolveDamage(event: DamageEvent, def: DamageableDefinition, vitals: TargetVitals): DamageResult {
  const tags = [event.damageType, ...event.attackTags];

  const wasImmune = intersects(tags, def.immuneTags);
  if (wasImmune) {
    return {
      targetId: event.targetId,
      originalAmount: event.amount,
      finalAmount: 0,
      shieldDamage: 0,
      hpDamage: 0,
      wasWeaknessHit: false,
      wasResisted: false,
      wasImmune: true,
      wasCrit: false,
      shieldBroken: false,
      targetDefeated: false,
      appliedTags: tags,
    };
  }

  const wasWeaknessHit = intersects(tags, def.weaknessTags);
  const wasResisted = intersects(tags, def.resistanceTags);

  let amount = event.amount;
  if (wasWeaknessHit) amount *= WEAKNESS_MULT;
  if (wasResisted) amount *= RESIST_MULT;

  // Crit: forced (combo bonus) OR a chance roll from accumulated crit chance (e.g. Hangar 'Targeting Optics').
  // Unseeded Math.random, consistent with the rest of combat — crit isn't replay-critical.
  const critChance = typeof event.metadata?.critChanceAdd === 'number' ? event.metadata.critChanceAdd : 0;
  const wasCrit = !!event.canCrit && (event.metadata?.forceCrit === true || Math.random() < critChance);
  if (wasCrit) amount *= event.critMultiplier ?? 1.5;

  amount = Math.max(0, Math.round(amount));

  // Shield phase — shield-break / shield-weakness tags strip remaining shield instantly.
  const shieldEnabled = !!def.shieldRules?.enabled && def.shieldRules.shieldHp > 0;
  let shieldDamage = 0;
  let shieldBroken = false;
  let hpAmount: number;

  if (shieldEnabled && vitals.shield > 0) {
    const breaksShield = intersects(tags, def.shieldRules!.shieldWeaknessTags);
    if (breaksShield) {
      shieldDamage = vitals.shield; // strip the whole shield
      shieldBroken = true;
      hpAmount = amount; // shield-break overflow still hits HP (simple model)
    } else {
      shieldDamage = Math.min(vitals.shield, amount);
      shieldBroken = vitals.shield - shieldDamage <= 0;
      hpAmount = amount - shieldDamage;
    }
  } else {
    hpAmount = amount;
  }
  const hpDamage = Math.min(vitals.hp, hpAmount);

  const targetDefeated = vitals.hp - hpDamage <= 0;

  return {
    targetId: event.targetId,
    originalAmount: event.amount,
    finalAmount: shieldDamage + hpDamage,
    shieldDamage,
    hpDamage,
    wasWeaknessHit,
    wasResisted,
    wasImmune: false,
    wasCrit,
    shieldBroken,
    targetDefeated,
    appliedTags: tags,
  };
}
