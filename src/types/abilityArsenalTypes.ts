// Cinematic Ability Arsenal (Batch F.5) — the 8-hero × 11-ability data model. Each ability WRAPS a real
// CombatSkillDefinition (so it casts/damages through the existing SkillRuntime/DamageResolver) and points at
// a CinematicEffectDefinition. A loadout maps a character's keyed slots to chosen arsenal abilities.

import type { DamageType, HitVolumeDefinition, TargetRuleDefinition } from './game/combat';

// Batch F.7 — 16 abilities/hero: 6 attack / 3 defense / 1 signature / 2 ultimate / 4 clone. The clone slots are
// the per-character "double / echo / phantom" abilities (one interleaved into each of the 4 skill pages).
export type AbilityCategory = 'attack' | 'defense' | 'signature' | 'ultimate' | 'clone';
export const ABILITY_CATEGORIES: readonly AbilityCategory[] = ['attack', 'defense', 'signature', 'ultimate', 'clone'];

export type AbilitySlot =
  | 'attack-1' | 'attack-2' | 'attack-3' | 'attack-4' | 'attack-5' | 'attack-6'
  | 'defense-1' | 'defense-2' | 'defense-3'
  | 'signature-1'
  | 'ultimate-1' | 'ultimate-2'
  | 'clone-1' | 'clone-2' | 'clone-3' | 'clone-4';
export const ABILITY_SLOTS: readonly AbilitySlot[] = [
  'attack-1', 'attack-2', 'attack-3', 'attack-4', 'attack-5', 'attack-6',
  'defense-1', 'defense-2', 'defense-3', 'signature-1', 'ultimate-1', 'ultimate-2',
  'clone-1', 'clone-2', 'clone-3', 'clone-4',
];

export type VisualIntensity = 1 | 2 | 3 | 4 | 5;

// Batch F.6 — tiered model-scale presets so each ability's models read at a deliberate on-screen size
// (basic attacks clearly visible → ultimates with giant presence) without authoring a raw scalar per piece.
export type CinematicModelScalePreset = 'small' | 'medium' | 'large' | 'hero' | 'ultimate';
export interface AbilityVisualScale {
  modelScalePreset: CinematicModelScalePreset;
  modelScaleMultiplier: number;
  geometryScaleMultiplier: number;
  particleScaleMultiplier: number;
  fogScaleMultiplier: number;
}

export interface CinematicAbilityDefinition {
  id: string;
  characterId: string;
  name: string;
  description: string;

  abilityCategory: AbilityCategory;
  abilitySlot: AbilitySlot;
  inputBinding: string;

  combat: {
    skillDefinitionId: string;
    damageType?: DamageType;
    attackTags: string[];
    energyCost: number;
    cooldownSeconds: number;
    castTimeSeconds?: number;
    durationSeconds?: number;
    hitVolume: HitVolumeDefinition;
    targetRules: TargetRuleDefinition;
  };

  vfx: {
    cinematicEffectId: string;
    previewEffectId?: string;
    impactEffectId?: string;
    cleanupEffectId?: string;
  };

  gameplayHooks?: {
    affectsEnemies?: boolean;
    affectsObstacles?: boolean;
    affectsBossWeakpoints?: boolean;
    affectsSupportSynergy?: boolean;
    affectsZoneCondition?: boolean;
    appliesStatusTags?: string[];
    effectiveAgainstEnemyTypes?: string[];
    weakAgainstEnemyTypes?: string[];
    effectiveAgainstObstacleTypes?: string[];
    canDamageBoss?: boolean;
    canExposeWeakpoint?: boolean;
    canRepairDevice?: boolean;
    canBreakShield?: boolean;
  };

  balance: {
    baseDamage?: number;
    shieldDamage?: number;
    staggerValue?: number;
    knockbackForce?: number;
    repairAmount?: number;
    scanDurationSeconds?: number;
    defenseReductionPercent?: number;
  };

  // Batch F.6 — tiered visual scale (preset + per-channel multipliers). Edit-Mode-tunable.
  visualScale?: AbilityVisualScale;

  editorMeta?: {
    notes?: string;
    difficulty?: 'easy' | 'normal' | 'hard';
    visualIntensity?: VisualIntensity;
    recommendedUse?: string;
    themeColor?: string;
  };
  enabled?: boolean;
}

// A character's equipped loadout: which arsenal abilities sit on the keyed slots + ultimate. The kit's
// defaultSkillIds are derived from this so the existing keyed-slot casting (Z/X/Y/H/B/N + ultimate) works.
export interface AbilityLoadoutDefinition {
  id: string; // === characterId
  characterId: string;
  basic: string;      // ability id → keyed slot Z
  special1: string;   // X
  special2: string;   // Y
  aoe: string;        // H
  defense: string;    // B
  utility: string;    // N
  ultimate: string;   // ultimate
  editorMeta?: { notes?: string };
}

export interface AbilityValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
