import type {
  BossDefinition, BossPhaseDefinition, BossWeakpointDefinition, BossAttackPatternDefinition,
  BossArenaDefinition, BossSummonWaveDefinition, BossValidationResult,
} from '../../types/game/boss';
import { BOSS_TYPES, BOSS_PATTERN_TYPES } from '../../types/game/boss';

// Pure validators for boss content (Batch F, spec §18). Existence checks injected so the same validators run
// in the editor (against the live stores) and in tests (against seed arrays).
export interface BossLookups {
  arenaExists: (id: string) => boolean;
  phaseExists: (id: string) => boolean;
  weakpointExists: (id: string) => boolean;
  attackExists: (id: string) => boolean;
  waveExists?: (id: string) => boolean;
  spawnGroupExists?: (id: string) => boolean;
}

const ok = (errors: string[], warnings: string[] = []): BossValidationResult => ({ ok: errors.length === 0, errors, warnings });

export function validateBoss(b: BossDefinition, lk: BossLookups): BossValidationResult {
  const e: string[] = [];
  const w: string[] = [];
  if (!b.id?.trim()) e.push('boss id must not be empty.');
  if (!BOSS_TYPES.includes(b.bossType)) e.push(`unknown bossType "${b.bossType}".`);
  if (!b.arenaId || !lk.arenaExists(b.arenaId)) e.push(`arenaId "${b.arenaId}" does not exist.`);
  if (!b.phaseIds || b.phaseIds.length === 0) e.push('boss must have at least one phase.');
  if (!b.startPhaseId || !b.phaseIds.includes(b.startPhaseId)) e.push('startPhaseId must be one of phaseIds.');
  if (!b.finalPhaseIds || b.finalPhaseIds.length === 0) e.push('boss must have at least one finalPhaseId.');
  for (const id of b.finalPhaseIds ?? []) if (!b.phaseIds.includes(id)) e.push(`finalPhaseId "${id}" not in phaseIds.`);
  for (const id of b.phaseIds ?? []) if (!lk.phaseExists(id)) e.push(`phase "${id}" does not exist.`);
  for (const id of b.weakpointIds ?? []) if (!lk.weakpointExists(id)) e.push(`weakpoint "${id}" does not exist.`);
  for (const id of b.attackPatternIds ?? []) if (!lk.attackExists(id)) e.push(`attack pattern "${id}" does not exist.`);
  if (!b.damageable?.id) e.push('boss damageable is missing.');
  if (!b.visual?.modelPresetId?.trim()) e.push('boss visual.modelPresetId must not be empty.');
  if (b.completion?.completeZoneOnDefeat == null) w.push('completion.completeZoneOnDefeat not set.');
  return ok(e, w);
}

export function validatePhase(p: BossPhaseDefinition, lk: Pick<BossLookups, 'attackExists' | 'weakpointExists'>): BossValidationResult {
  const e: string[] = [];
  if (!p.id?.trim()) e.push('phase id must not be empty.');
  if (!p.bossId?.trim()) e.push('phase bossId must not be empty.');
  if (p.phaseIndex < 0) e.push('phaseIndex must be >= 0.');
  if (!p.completionConditions || p.completionConditions.length === 0) e.push('phase must have at least one completion condition.');
  for (const id of p.enabledAttackPatternIds ?? []) if (!lk.attackExists(id)) e.push(`enabled attack "${id}" does not exist.`);
  for (const id of p.enabledWeakpointIds ?? []) if (!lk.weakpointExists(id)) e.push(`enabled weakpoint "${id}" does not exist.`);
  return ok(e);
}

export function validateWeakpoint(wp: BossWeakpointDefinition, phaseExists: (id: string) => boolean): BossValidationResult {
  const e: string[] = [];
  if (!wp.id?.trim()) e.push('weakpoint id must not be empty.');
  if (!wp.activeInPhaseIds || wp.activeInPhaseIds.length === 0) e.push('weakpoint must be active in at least one phase.');
  for (const id of wp.activeInPhaseIds ?? []) if (!phaseExists(id)) e.push(`weakpoint phase "${id}" does not exist.`);
  if (!wp.damageable?.id) e.push('weakpoint damageable is missing.');
  if (!Array.isArray(wp.fallbackPosition) || wp.fallbackPosition.length !== 3) e.push('weakpoint fallbackPosition must be [x,y,z].');
  if (!wp.exposedRules) e.push('weakpoint exposedRules missing.');
  if (!wp.effectOnDestroyed) e.push('weakpoint effectOnDestroyed missing.');
  return ok(e);
}

export function validateAttackPattern(a: BossAttackPatternDefinition, phaseExists: (id: string) => boolean): BossValidationResult {
  const e: string[] = [];
  if (!a.id?.trim()) e.push('attack id must not be empty.');
  if (!BOSS_PATTERN_TYPES.includes(a.patternType)) e.push(`unknown patternType "${a.patternType}".`);
  if (a.cooldownSeconds < 0) e.push('cooldownSeconds must be >= 0.');
  if (a.castTimeSeconds < 0) e.push('castTimeSeconds must be >= 0.');
  if (a.activeDurationSeconds <= 0) e.push('activeDurationSeconds must be > 0.');
  if (!a.hitVolume) e.push('attack hitVolume missing.');
  if ((a.patternType === 'targeted-projectile' || a.patternType === 'sweep-beam' || a.patternType === 'ground-shockwave' || a.patternType === 'shield-pulse') && !a.damageEventTemplate) {
    e.push(`pattern "${a.id}" needs a damageEventTemplate.`);
  }
  for (const id of a.phaseIds ?? []) if (!phaseExists(id)) e.push(`attack phase "${id}" does not exist.`);
  return ok(e);
}

export function validateArena(a: BossArenaDefinition): BossValidationResult {
  const e: string[] = [];
  if (!a.id?.trim()) e.push('arena id must not be empty.');
  if (!a.bounds || a.bounds.size.some((s) => s <= 0)) e.push('arena bounds size must be > 0.');
  if (!a.bossSpawnPointId?.trim()) e.push('bossSpawnPointId must not be empty.');
  if (!a.playerStartPointId?.trim()) e.push('playerStartPointId must not be empty.');
  return ok(e);
}

export function validateSummonWave(w: BossSummonWaveDefinition, lk: Pick<BossLookups, 'phaseExists' | 'spawnGroupExists'>): BossValidationResult {
  const e: string[] = [];
  if (!w.id?.trim()) e.push('wave id must not be empty.');
  if (!w.phaseId || !lk.phaseExists(w.phaseId)) e.push(`wave phaseId "${w.phaseId}" does not exist.`);
  if (!w.enemySpawnGroupIds || w.enemySpawnGroupIds.length === 0) e.push('wave must reference at least one spawn group.');
  if (lk.spawnGroupExists) for (const id of w.enemySpawnGroupIds ?? []) if (!lk.spawnGroupExists(id)) e.push(`spawn group "${id}" does not exist.`);
  if (w.maxActiveEnemies != null && w.maxActiveEnemies < 0) e.push('maxActiveEnemies must be >= 0.');
  return ok(e);
}
