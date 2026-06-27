import { liveTargets, useCombatTargetStore, type CombatTarget } from '../../stores/game/combatTargetStore';

export type StatusEffectType =
  | 'stunned'
  | 'slowed'
  | 'restrained'
  | 'scanned'
  | 'weakpoint-exposed'
  | 'shield-broken'
  | 'burning-placeholder'
  | 'wet-placeholder'
  | 'repairing'
  | 'protected'
  | 'taunted'
  | 'knocked-back'
  // Batch O — real elemental/control effects.
  | 'burning' // DoT (magnitude = damage/sec)
  | 'frozen' // slow (magnitude = move-speed multiplier)
  | 'shocked' // interrupt windups
  | 'armor-broken'; // takes more damage (magnitude = bonus fraction)

export type ActiveStatusEffect = {
  id: string;
  type: StatusEffectType;
  sourceId: string;
  startedAtMs: number;
  expiresAtMs: number;
  magnitude: number;
};

export type StatusEffectTuning = {
  type: StatusEffectType;
  durationMs: number;
  magnitude: number;
};

export const DEFAULT_STATUS_EFFECT_TUNING: Record<StatusEffectType, StatusEffectTuning> = {
  stunned: { type: 'stunned', durationMs: 1400, magnitude: 1 },
  slowed: { type: 'slowed', durationMs: 2600, magnitude: 0.45 },
  restrained: { type: 'restrained', durationMs: 1800, magnitude: 1 },
  scanned: { type: 'scanned', durationMs: 5000, magnitude: 1 },
  'weakpoint-exposed': { type: 'weakpoint-exposed', durationMs: 4000, magnitude: 1.35 },
  'shield-broken': { type: 'shield-broken', durationMs: 3200, magnitude: 1 },
  'burning-placeholder': { type: 'burning-placeholder', durationMs: 3000, magnitude: 4 },
  'wet-placeholder': { type: 'wet-placeholder', durationMs: 3000, magnitude: 1 },
  repairing: { type: 'repairing', durationMs: 2500, magnitude: 8 },
  protected: { type: 'protected', durationMs: 4000, magnitude: 0.35 },
  taunted: { type: 'taunted', durationMs: 2500, magnitude: 1 },
  'knocked-back': { type: 'knocked-back', durationMs: 500, magnitude: 1 },
  burning: { type: 'burning', durationMs: 3000, magnitude: 6 }, // 6 dmg/sec
  frozen: { type: 'frozen', durationMs: 2500, magnitude: 0.4 }, // 60% slow
  shocked: { type: 'shocked', durationMs: 1200, magnitude: 1 },
  'armor-broken': { type: 'armor-broken', durationMs: 4000, magnitude: 0.3 }, // +30% damage taken
};

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function getTargetStatusEffects(target: CombatTarget | string): ActiveStatusEffect[] {
  const t = typeof target === 'string' ? liveTargets.find((x) => x.id === target) : target;
  if (!t?.statusEffects) return [];
  const now = nowMs();
  return t.statusEffects.filter((effect) => effect.expiresAtMs > now);
}

export function hasStatusEffect(target: CombatTarget | string, type: StatusEffectType): boolean {
  return getTargetStatusEffects(target).some((effect) => effect.type === type);
}

export function applyStatusEffect(
  targetId: string,
  type: StatusEffectType,
  sourceId: string,
  tuning: Partial<StatusEffectTuning> = {},
): ActiveStatusEffect | null {
  const target = liveTargets.find((t) => t.id === targetId);
  if (!target || target.defeatedAt) return null;
  const base = DEFAULT_STATUS_EFFECT_TUNING[type];
  const startedAtMs = nowMs();
  const effect: ActiveStatusEffect = {
    id: `${type}_${sourceId}_${Math.round(startedAtMs)}`,
    type,
    sourceId,
    startedAtMs,
    expiresAtMs: startedAtMs + (tuning.durationMs ?? base.durationMs),
    magnitude: tuning.magnitude ?? base.magnitude,
  };
  target.statusEffects = [...getTargetStatusEffects(target), effect];
  if (type === 'scanned') target.scanned = true;
  if (type === 'weakpoint-exposed') target.weakpointExposed = true;
  if (type === 'shield-broken') target.shieldBroken = true;
  if (type === 'stunned') target.aiData = { ...(target.aiData ?? {}), stunUntil: effect.expiresAtMs / 1000 };
  // Batch O — frozen slows movement (read by enemyAi); shocked interrupts windups.
  if (type === 'frozen') target.aiData = { ...(target.aiData ?? {}), freezeMultiplier: effect.magnitude, freezeUntil: effect.expiresAtMs / 1000 };
  if (type === 'shocked') target.aiData = { ...(target.aiData ?? {}), shockUntil: effect.expiresAtMs / 1000 };
  useCombatTargetStore.getState().bump();
  return effect;
}

// Wave 1 — remove all active effects of a given type from a target (used when an element reaction consumes a
// primary status). Also clears the derived ai-blackboard flags so the gameplay effect (freeze slow / shock
// interrupt) ends immediately.
export function removeStatusEffectsOfType(targetId: string, type: StatusEffectType): boolean {
  const t = liveTargets.find((x) => x.id === targetId);
  if (!t?.statusEffects?.length) return false;
  const next = t.statusEffects.filter((e) => e.type !== type);
  if (next.length === t.statusEffects.length) return false;
  t.statusEffects = next;
  if (type === 'frozen' && t.aiData) { delete t.aiData.freezeMultiplier; delete t.aiData.freezeUntil; }
  if (type === 'shocked' && t.aiData) delete t.aiData.shockUntil;
  if (type === 'stunned' && t.aiData) delete t.aiData.stunUntil;
  if (type === 'scanned') t.scanned = false;
  if (type === 'weakpoint-exposed') t.weakpointExposed = false;
  useCombatTargetStore.getState().bump();
  return true;
}

export function clearExpiredStatusEffects(targetId?: string): number {
  const now = nowMs();
  let removed = 0;
  for (const target of liveTargets) {
    if (targetId && target.id !== targetId) continue;
    if (!target.statusEffects?.length) continue;
    const next = target.statusEffects.filter((effect) => effect.expiresAtMs > now);
    removed += target.statusEffects.length - next.length;
    target.statusEffects = next;
  }
  if (removed) useCombatTargetStore.getState().bump();
  return removed;
}
