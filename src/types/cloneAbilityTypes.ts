// Character clone / "double" ability data model (Batch F.7). A clone ability spawns the hero in a DIFFERENT
// pose model and runs a spawn → pose-switch → action → dissolve state sequence with a real gameplay effect.
// The clone WRAPS a normal arsenal ability (cast/damage through SkillRuntime) + a CinematicEffectDefinition;
// this metadata drives the effect builder (CloneEffectDirector), Edit Mode, and validation.

export type CloneType = 'attack-double' | 'defense-double' | 'support-double' | 'ultimate-double';

export type CloneBehavior =
  | 'mirror-caster' | 'delayed-echo' | 'orbit-support' | 'decoy-target'
  | 'assist-strike' | 'shield-guardian' | 'route-guide' | 'scan-relay';

export type CloneSpawnPattern =
  | 'beside-caster' | 'behind-caster' | 'around-target' | 'orbit-caster'
  | 'line-formation' | 'triangle-formation' | 'arena-corners' | 'path-markers';

export type CloneMaterialMode = 'solid' | 'hologram' | 'afterimage' | 'energy-outline' | 'ghost-trail';

export type CloneState =
  | 'spawn' | 'pose-switch' | 'move' | 'attack' | 'defend' | 'support'
  | 'scan' | 'explode' | 'dissolve' | 'cleanup';

// Per-character pose model variants the clone cycles through. action + fallback are required; others optional.
export interface ClonePoseModelSet {
  idlePoseModelId: string;
  actionPoseModelId: string;
  defensePoseModelId?: string;
  supportPoseModelId?: string;
  ultimatePoseModelId?: string;
  dissolvePoseModelId?: string;
  fallbackModelId: string;
}

export interface CloneStateKeyframe {
  time: number; // seconds from cast
  state: CloneState;
  poseModelId?: string;
  transform?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
  effectId?: string;
  gameplayTrigger?: string;
}

export interface CloneGameplayEffect {
  canDealDamage?: boolean;
  canBlockProjectiles?: boolean;
  canAttractEnemyAggro?: boolean;
  canGuideNPC?: boolean;
  canExposeWeakpoint?: boolean;
  canRepairOrStabilize?: boolean;
  canApplyStatusTags?: string[];
}

export interface CloneVisualConfig {
  modelScaleMultiplier: number;
  opacity?: number;
  materialMode: CloneMaterialMode;
  particleEffectId: string;
  geometryEffectId?: string;
  fogCloudEffectId?: string;
  cameraFeedbackId?: string;
}

export interface CloneEditModeConfig {
  editable: boolean;
  canChangePoseModels: boolean;
  canChangeSpawnPattern: boolean;
  canChangeStateTimeline: boolean;
  canChangeEffects: boolean;
}

export interface CloneAbilityDefinition {
  id: string; // === cloneAbilityId, also the arsenal abilityId it backs
  cloneAbilityId: string;
  characterId: string;
  abilityId: string;
  name: string;

  cloneType: CloneType;
  poseModelSet: ClonePoseModelSet;
  cloneBehavior: CloneBehavior;
  spawnPattern: CloneSpawnPattern;

  durationSeconds: number;
  maxCloneCount: number;

  stateTimeline: CloneStateKeyframe[];

  gameplayEffect: CloneGameplayEffect;
  visualConfig: CloneVisualConfig;
  editModeConfig: CloneEditModeConfig;
}

export const CLONE_TYPES: readonly CloneType[] = ['attack-double', 'defense-double', 'support-double', 'ultimate-double'];
export const CLONE_MATERIAL_MODES: readonly CloneMaterialMode[] = ['solid', 'hologram', 'afterimage', 'energy-outline', 'ghost-trail'];
export const CLONE_SPAWN_PATTERNS: readonly CloneSpawnPattern[] = [
  'beside-caster', 'behind-caster', 'around-target', 'orbit-caster',
  'line-formation', 'triangle-formation', 'arena-corners', 'path-markers',
];
export const CLONE_BEHAVIORS: readonly CloneBehavior[] = [
  'mirror-caster', 'delayed-echo', 'orbit-support', 'decoy-target',
  'assist-strike', 'shield-guardian', 'route-guide', 'scan-relay',
];

// Badge shown in the HUD per clone type.
export const CLONE_BADGE: Record<CloneType, string> = {
  'attack-double': 'DOUBLE',
  'defense-double': 'PHANTOM',
  'support-double': 'ECHO',
  'ultimate-double': 'ECHO',
};
