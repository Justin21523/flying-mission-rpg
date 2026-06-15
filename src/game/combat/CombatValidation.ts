import type {
  CombatStatsPreset,
  CombatSkillDefinition,
  HitVolumeDefinition,
  DamageableDefinition,
  CombatEffectDefinition,
  CombatValidationResult,
} from '../../types/game/combat';

// Pure validators for the Combat Runtime data — used by the ⚔ Combat editor tab (surfaces errors/warnings)
// and by tests. `getEffect` lets skill validation confirm its effectDefinitionId resolves.

export function validateCombatStats(p: CombatStatsPreset): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!p.id.trim()) errors.push('Stats preset id must not be empty.');
  if (p.maxHp <= 0) errors.push('maxHp must be > 0.');
  if (p.maxShield < 0) errors.push('maxShield must be >= 0.');
  if (p.maxEnergy < 0) errors.push('maxEnergy must be >= 0.');
  if (p.energyRegenPerSecond < 0) errors.push('energyRegenPerSecond must be >= 0.');
  if (p.shieldRegenPerSecond < 0) errors.push('shieldRegenPerSecond must be >= 0.');
  if (p.shieldRegenDelaySeconds < 0) errors.push('shieldRegenDelaySeconds must be >= 0.');
  if (p.moveSpeedMultiplier <= 0) warnings.push('moveSpeedMultiplier <= 0 will freeze the player.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateHitVolume(hv: HitVolumeDefinition): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!hv.id.trim()) errors.push('Hit volume id must not be empty.');
  for (const k of ['radius', 'length', 'width', 'height'] as const) {
    const v = hv[k];
    if (v != null && v < 0) errors.push(`Hit volume ${k} must be >= 0.`);
  }
  if (hv.activeDurationSeconds <= 0) errors.push('Hit volume activeDurationSeconds must be > 0.');
  if (hv.angleDegrees != null && (hv.angleDegrees <= 0 || hv.angleDegrees > 360)) warnings.push('angleDegrees should be within (0, 360].');
  if ((hv.shape === 'cone' || hv.shape === 'arc') && hv.angleDegrees == null) warnings.push('cone/arc without angleDegrees defaults to 90°.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateSkill(s: CombatSkillDefinition, getEffect?: (id: string) => CombatEffectDefinition | undefined): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!s.id.trim()) errors.push('Skill id must not be empty.');
  if (!s.inputBinding.trim()) errors.push('Skill inputBinding must not be empty.');
  if (s.energyCost < 0) errors.push('energyCost must be >= 0.');
  if (s.cooldownSeconds < 0) errors.push('cooldownSeconds must be >= 0.');
  for (const d of s.damageEvents ?? []) {
    if (d.amount < 0) errors.push('damage amount must be >= 0.');
  }
  const hv = validateHitVolume(s.hitVolume);
  errors.push(...hv.errors.map((e) => `hitVolume: ${e}`));
  warnings.push(...hv.warnings.map((w) => `hitVolume: ${w}`));
  if (s.effectDefinitionId && getEffect && !getEffect(s.effectDefinitionId)) {
    errors.push(`effectDefinitionId "${s.effectDefinitionId}" does not resolve to a CombatEffectDefinition.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateDamageable(d: DamageableDefinition): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!d.id.trim()) errors.push('Damageable id must not be empty.');
  if (d.maxHp <= 0) errors.push('maxHp must be > 0.');
  if (d.maxShield != null && d.maxShield < 0) errors.push('maxShield must be >= 0.');
  if (d.shieldRules?.enabled && d.shieldRules.shieldHp < 0) errors.push('shieldRules.shieldHp must be >= 0.');
  const overlap = d.weaknessTags.filter((t) => d.resistanceTags.includes(t) || (d.immuneTags ?? []).includes(t));
  if (overlap.length) warnings.push(`tags both weak and resistant/immune: ${overlap.join(', ')}.`);
  return { ok: errors.length === 0, errors, warnings };
}

export function validateCombatEffect(e: CombatEffectDefinition): CombatValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!e.id.trim()) errors.push('Effect id must not be empty.');
  if (e.timing.durationSeconds < 0) errors.push('timing.durationSeconds must be >= 0.');
  if (e.effectType === 'geometry-range' || e.effectType === 'ring-burst' || e.effectType === 'energy-field') {
    if (!e.geometry) errors.push(`${e.effectType} requires a geometry definition.`);
  }
  if (e.effectType === 'model-component-motion') {
    const bad = (e.modelComponents ?? []).some((m) => !m.componentId.trim());
    if (!e.modelComponents || e.modelComponents.length === 0) errors.push('model-component-motion requires modelComponents.');
    else if (bad) errors.push('every model component needs a non-empty componentId.');
  }
  return { ok: errors.length === 0, errors, warnings };
}
