import type { CombatSkillDefinition, DamageResult } from '../../types/game/combat';
import type { CombatTarget } from '../../stores/game/combatTargetStore';

export type CombatFeedbackTier = 'minor' | 'standard' | 'strong' | 'cinematic';

export type CombatFeedbackKind =
  | 'basic-hit'
  | 'heavy-hit'
  | 'weakpoint-hit'
  | 'shield-pressure'
  | 'shield-break'
  | 'target-defeated'
  | 'immune'
  | 'resisted'
  | 'scan-exposed'
  | 'stunned'
  | 'repair'
  | 'ultimate-impact'
  | 'boss-weakpoint-exposed'
  | 'parry'
  // Wave 2 — poise break + execution finisher.
  | 'poise-break'
  | 'execution';

export type CombatFeedbackEvent = {
  id: string;
  kind: CombatFeedbackKind;
  tier: CombatFeedbackTier;
  targetId?: string;
  skillId?: string;
  label: string;
  detail?: string;
  amount?: number;
  createdAtMs: number;
};

export type CombatFeedbackContext = {
  result?: DamageResult;
  skill?: CombatSkillDefinition;
  target?: CombatTarget;
  nowMs?: number;
};

const priority: Record<CombatFeedbackTier, number> = { minor: 0, standard: 1, strong: 2, cinematic: 3 };

export function feedbackTierPriority(tier: CombatFeedbackTier): number {
  return priority[tier];
}

export function isHighPriorityFeedback(event: CombatFeedbackEvent): boolean {
  return event.tier === 'strong' || event.tier === 'cinematic';
}

export function classifyDamageFeedback({ result, skill, target, nowMs = Date.now() }: CombatFeedbackContext): CombatFeedbackEvent | null {
  if (!result) return null;
  const skillId = skill?.id;
  const targetId = result.targetId;
  const base = { id: `fb_${targetId}_${nowMs}_${result.finalAmount}`, targetId, skillId, amount: result.finalAmount, createdAtMs: nowMs };

  if (result.wasImmune) return { ...base, kind: 'immune', tier: 'standard', label: 'Immune', detail: 'Try scan, shield-break, or another damage type.' };
  if (result.targetDefeated) return { ...base, kind: 'target-defeated', tier: target?.isBossWeakpoint ? 'cinematic' : 'strong', label: target?.isBossWeakpoint ? 'Weakpoint Destroyed' : 'Target Down' };
  if (target?.isBossWeakpoint && (result.wasWeaknessHit || result.hpDamage > 0)) return { ...base, kind: 'weakpoint-hit', tier: 'cinematic', label: 'Boss Weakpoint Hit', detail: 'Keep pressure on the exposed core.' };
  if (result.shieldBroken) return { ...base, kind: 'shield-break', tier: 'strong', label: 'Shield Broken', detail: 'Follow up before it recovers.' };
  if (result.wasWeaknessHit || result.appliedTags.includes('weakpoint') || result.appliedTags.includes('precision')) {
    return { ...base, kind: 'weakpoint-hit', tier: 'strong', label: 'Weakpoint Hit', detail: 'Counterplay success.' };
  }
  if (skill?.skillType === 'ultimate-placeholder' || result.appliedTags.includes('ultimate')) {
    return { ...base, kind: 'ultimate-impact', tier: 'cinematic', label: 'Ultimate Impact' };
  }
  if (result.shieldDamage > 0) return { ...base, kind: 'shield-pressure', tier: 'standard', label: 'Shield Pressure', detail: `${Math.round(result.shieldDamage)} shield damage` };
  if (result.wasResisted) return { ...base, kind: 'resisted', tier: 'minor', label: 'Resisted', detail: 'Try a different counter.' };
  if (skill?.attackType === 'heavy' || skill?.attackType === 'shockwave') return { ...base, kind: 'heavy-hit', tier: 'standard', label: 'Heavy Hit' };
  if (result.finalAmount > 0) return { ...base, kind: 'basic-hit', tier: 'minor', label: 'Hit' };
  return null;
}

export function makeUtilityFeedback(kind: Extract<CombatFeedbackKind, 'scan-exposed' | 'stunned' | 'repair' | 'boss-weakpoint-exposed' | 'parry' | 'poise-break' | 'execution'>, targetId: string | undefined, skillId: string | undefined, nowMs = Date.now()): CombatFeedbackEvent {
  if (kind === 'poise-break') return { id: `fb_poise_${targetId ?? 'target'}_${nowMs}`, kind, tier: 'strong', targetId, skillId, label: 'Poise Broken!', detail: 'The target is staggered — punish it.', createdAtMs: nowMs };
  if (kind === 'execution') return { id: `fb_exec_${targetId ?? 'target'}_${nowMs}`, kind, tier: 'cinematic', targetId, skillId, label: 'Finisher!', detail: 'Execution complete — resources refunded.', createdAtMs: nowMs };
  if (kind === 'parry') return { id: `fb_parry_${nowMs}`, kind, tier: 'strong', targetId, skillId, label: 'Parry!', detail: 'Perfect block — fusion charged.', createdAtMs: nowMs };
  if (kind === 'boss-weakpoint-exposed') return { id: `fb_boss_wp_${targetId ?? 'target'}_${nowMs}`, kind, tier: 'cinematic', targetId, skillId, label: 'Boss Weakpoint Exposed', detail: 'Use precision or shield-break attacks now.', createdAtMs: nowMs };
  if (kind === 'scan-exposed') return { id: `fb_scan_${targetId ?? 'target'}_${nowMs}`, kind, tier: 'standard', targetId, skillId, label: 'Weakpoint Exposed', detail: 'Precision attacks deal bonus damage.', createdAtMs: nowMs };
  if (kind === 'stunned') return { id: `fb_stun_${targetId ?? 'target'}_${nowMs}`, kind, tier: 'standard', targetId, skillId, label: 'Target Stunned', detail: 'Heavy attacks are safer now.', createdAtMs: nowMs };
  return { id: `fb_repair_${targetId ?? 'target'}_${nowMs}`, kind, tier: 'standard', targetId, skillId, label: 'Repair Applied', detail: 'Objective device restored.', createdAtMs: nowMs };
}
