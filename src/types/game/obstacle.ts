import type { DamageableDefinition } from './combat';

// Advanced Mission Zone obstacles (Batch C) — Energy Barrier / Cracked Wall / Corrupted Device. Damageable
// obstacles register a proxy in the combat target registry (so player skills damage them through the same
// DamageResolver); a state machine + interaction rules drive their lifecycle and zone-condition links.

export type ObstacleType =
  | 'energy-barrier' | 'cracked-wall' | 'corrupted-device'
  | 'future-enemy-spawner' | 'future-shield-tower' | 'future-locked-core' | 'future-partner-gate';

export const OBSTACLE_TYPES: readonly ObstacleType[] = [
  'energy-barrier', 'cracked-wall', 'corrupted-device',
  'future-enemy-spawner', 'future-shield-tower', 'future-locked-core', 'future-partner-gate',
];

export type ObstacleState =
  | 'inactive' | 'active' | 'damaged' | 'disabled' | 'destroyed' | 'repaired' | 'cleared' | 'locked' | 'unlocked';

export const OBSTACLE_STATES: readonly ObstacleState[] = [
  'inactive', 'active', 'damaged', 'disabled', 'destroyed', 'repaired', 'cleared', 'locked', 'unlocked',
];

export type ObstacleTrigger = 'damage' | 'shield-break' | 'interact' | 'repair' | 'debug-clear';

export interface ObstacleInteractionRule {
  id: string;
  trigger: ObstacleTrigger;
  requiredTags?: string[];
  forbiddenTags?: string[];
  threshold?: { damageAmount?: number; repairAmount?: number; interactCount?: number };
  resultState: ObstacleState;
  effects?: {
    completeZoneConditionId?: string;
    unlockNextSegment?: boolean;
    playEffectId?: string;
  };
}

export interface ObstacleVisualState {
  modelPresetId?: string; // optional GLB; falls back to geometry by obstacleType
  color?: string;
  opacity?: number;
}

export interface ObstacleDefinition {
  id: string;
  name: string;
  obstacleType: ObstacleType;
  zoneId: string;
  segmentId: string;
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] };
  damageable?: DamageableDefinition; // present for energy-barrier / cracked-wall
  interactionRules: ObstacleInteractionRule[];
  stateMachine: {
    initialState: ObstacleState;
    allowedTransitions: { from: ObstacleState; to: ObstacleState; trigger: string }[];
  };
  visualStates: Partial<Record<ObstacleState, ObstacleVisualState>>;
  linkedZoneConditionId?: string;
  // Batch O — environmental weaponize: when destroyed, deal AOE damage to nearby enemies (explosive barrel).
  explodeOnDestroy?: { radius: number; damage: number };
  editorMeta?: { notes?: string; debugColor?: string };
  enabled: boolean;
}

// States that count as "cleared" for the clear-obstacle zone condition.
export const CLEARED_OBSTACLE_STATES: readonly ObstacleState[] = ['cleared', 'disabled', 'destroyed', 'repaired', 'unlocked'];
