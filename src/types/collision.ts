import type { Vec3Tuple, PathControlMode } from './path';
import type { SurfaceType } from './surface';

// Phase A (data model) — a semantic layer over raw Rapier collisions: every collidable carries CollisionMetadata
// (resolved through a central registry, not ad-hoc userData reads). Contacts/sensors emit a GameplayCollisionEvent;
// data-driven CollisionReactionRules match those events and run ReactionActions. Runtime is Phase C.
export type CollisionObjectType =
  | 'ground' | 'road' | 'pathSurface' | 'boostPad' | 'wall' | 'building'
  | 'vehicle' | 'npc' | 'pedestrian' | 'trafficSignal' | 'roadBarrier'
  | 'destructible' | 'hazard' | 'water' | 'mud' | 'sand' | 'grass' | 'ice'
  | 'incidentObject' | 'questObject' | 'player' | 'yokai' | 'custom';

export const COLLISION_OBJECT_TYPES: CollisionObjectType[] = [
  'ground', 'road', 'pathSurface', 'boostPad', 'wall', 'building', 'vehicle', 'npc', 'pedestrian',
  'trafficSignal', 'roadBarrier', 'destructible', 'hazard', 'water', 'mud', 'sand', 'grass', 'ice',
  'incidentObject', 'questObject', 'player', 'yokai', 'custom',
];

export interface CollisionMetadata {
  objectId: string;
  objectType: CollisionObjectType;
  tags: string[];
  surfaceType?: SurfaceType;
  reactionProfileId?: string;
  pathId?: string;
  incidentId?: string;
  npcId?: string;
  vehicleId?: string;
  enabled: boolean;
}

export type CollisionPhase = 'enter' | 'stay' | 'exit' | 'impact';

export interface GameplayCollisionEvent {
  phase: CollisionPhase;
  sourceId: string;
  sourceType: CollisionObjectType;
  targetId: string;
  targetType: CollisionObjectType;
  sourceTags: string[];
  targetTags: string[];
  contactPoint?: Vec3Tuple;
  contactNormal?: Vec3Tuple;
  relativeSpeed?: number;
  impactStrength?: number;
  timestamp: number;
}

// ── Reaction actions (discriminated union) ─────────────────────────────────────
export type ReactionTarget = 'source' | 'target';
export type ReactionAction =
  | { type: 'playAnimation'; on: ReactionTarget; animationId: string }
  | { type: 'playSound'; soundId: string }
  | { type: 'spawnEffect'; effectId: string }
  | { type: 'applyForce'; on: ReactionTarget; direction: Vec3Tuple; strength: number }
  | { type: 'changeState'; on: ReactionTarget; state: string }
  | { type: 'startDialogue'; dialogueTreeId: string }
  | { type: 'triggerNpcReaction'; reaction: string }
  | { type: 'startIncident'; incidentId: string }
  | { type: 'enterPathFollow'; pathId: string; mode: PathControlMode }
  | { type: 'exitPathFollow' }
  | { type: 'modifyRelationship'; characterId: string; amount: number }
  | { type: 'emitGameEvent'; event: string };

// A placeable collidable (test/authored) that produces CollisionMetadata + an in-world visual. The
// CollisionTestLayer registers each one in the resolver and gives it a sensor (and a solid collider when
// `solid`). Phase D adds a full authoring tab; Phase C seeds a handful.
export interface CollisionObjectDef {
  id: string;
  areaId: string;
  objectType: CollisionObjectType;
  position: Vec3Tuple;
  size: Vec3Tuple;            // full box extents (x,y,z)
  solid: boolean;            // true = solid collider (player physically bumps); false = sensor-only
  tags: string[];
  surfaceType?: SurfaceType;
  impactSpeed?: number;      // relativeSpeed at/above which the 'impact' phase fires (default 4)
  pathId?: string;           // for guidedSurface → enterPathFollow target
  color?: string;
  label?: string;
  enabled: boolean;
}

export interface CollisionReactionRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;

  sourceTypes: CollisionObjectType[];
  targetTypes: CollisionObjectType[];

  requiredSourceTags?: string[];
  requiredTargetTags?: string[];
  blockedSourceTags?: string[];
  blockedTargetTags?: string[];

  phases: CollisionPhase[];

  minImpactSpeed?: number;
  maxImpactSpeed?: number;
  minImpactStrength?: number;
  maxImpactStrength?: number;

  requiredCharacterStates?: string[];
  blockedCharacterStates?: string[];

  requiredSurfaceTypes?: SurfaceType[];
  requiredPathModes?: PathControlMode[];

  actions: ReactionAction[];

  cooldown: number;
  oncePerContact: boolean;
}
