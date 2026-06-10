import type { CollisionObjectDef, CollisionReactionRule } from '../../types/collision';
import type { AnimationDefinition } from '../../types/animationDef';

// Phase C — test content for the collision-classification + reaction system, seeded into rescue_hq: five
// classified objects (wall / npc / hazard / destructible / guidedSurface) and six reaction rules that produce
// a DISTINCT, recoverable, non-spammy reaction per object type. Child-friendly: bumps/recoils/greetings only,
// no damage beyond a recoverable shove. Editors (Phase D) author more; these merge in as defaults.
const AREA = 'rescue_hq';

export const COLLISION_OBJECT_SEED: CollisionObjectDef[] = [
  { id: 'col_wall', areaId: AREA, objectType: 'wall', position: [-8, 0, 8], size: [4, 3, 0.6], solid: true, tags: ['solid'], color: '#94a3b8', label: 'Wall', enabled: true },
  { id: 'col_npc', areaId: AREA, objectType: 'npc', position: [-8, 0, 2], size: [1.2, 2, 1.2], solid: false, tags: ['resident'], color: '#f59e0b', label: 'NPC', enabled: true },
  { id: 'col_hazard', areaId: AREA, objectType: 'hazard', position: [-8, 0, -4], size: [2, 1.5, 2], solid: false, tags: ['hazard'], color: '#ef4444', label: 'Hazard', enabled: true },
  { id: 'col_destructible', areaId: AREA, objectType: 'destructible', position: [-8, 0, -10], size: [1.6, 1.6, 1.6], solid: true, tags: ['breakable'], impactSpeed: 5, color: '#a16207', label: 'Crate', enabled: true },
  { id: 'col_guided', areaId: AREA, objectType: 'pathSurface', position: [4, 0, 12], size: [3, 0.2, 3], solid: false, tags: ['guided'], surfaceType: 'guidedRoad', pathId: 'path_test_curve', color: '#22d3ee', label: 'Guided', enabled: true },
];

// Helper to keep rules terse — the engine fills sensible defaults for omitted optional matchers.
function rule(r: Partial<CollisionReactionRule> & Pick<CollisionReactionRule, 'id' | 'name' | 'sourceTypes' | 'targetTypes' | 'phases' | 'actions'>): CollisionReactionRule {
  return {
    enabled: true,
    priority: 0,
    cooldown: 0,
    oncePerContact: false,
    ...r,
  } as CollisionReactionRule;
}

export const COLLISION_RULE_SEED: CollisionReactionRule[] = [
  rule({
    id: 'rule_wall_bump', name: 'Wall bump (fast)', priority: 10,
    sourceTypes: ['player'], targetTypes: ['wall'], phases: ['enter'], minImpactSpeed: 3, oncePerContact: true,
    actions: [
      { type: 'playAnimation', on: 'source', animationId: 'anim_bump' },
      { type: 'playSound', soundId: 'ui' },
      { type: 'applyForce', on: 'source', direction: [0, 0, 0], strength: 6 }, // direction [0,0,0] = shove away from contact
    ],
  }),
  rule({
    id: 'rule_wall_soft', name: 'Wall soft touch (slow)', priority: 1,
    sourceTypes: ['player'], targetTypes: ['wall'], phases: ['enter'], maxImpactSpeed: 3,
    actions: [{ type: 'emitGameEvent', event: 'soft_touch' }],
  }),
  rule({
    id: 'rule_npc_greet', name: 'NPC greeting', priority: 5, cooldown: 5,
    sourceTypes: ['player'], targetTypes: ['npc'], phases: ['enter'],
    actions: [
      { type: 'playAnimation', on: 'source', animationId: 'anim_wave' },
      { type: 'triggerNpcReaction', reaction: 'greet' },
      { type: 'modifyRelationship', characterId: 'col_npc', amount: 1 },
    ],
  }),
  rule({
    id: 'rule_hazard_recoil', name: 'Hazard recoil', priority: 8, cooldown: 1,
    sourceTypes: ['player'], targetTypes: ['hazard'], phases: ['enter'],
    actions: [
      { type: 'playAnimation', on: 'source', animationId: 'anim_recoil' },
      { type: 'applyForce', on: 'source', direction: [0, 0, 0], strength: 4 },
      { type: 'emitGameEvent', event: 'hazard_touch' },
    ],
  }),
  rule({
    id: 'rule_crate_break', name: 'Crate break (impact)', priority: 9,
    sourceTypes: ['player'], targetTypes: ['destructible'], phases: ['impact'], minImpactSpeed: 5, oncePerContact: true,
    actions: [
      { type: 'playSound', soundId: 'incident' },
      { type: 'changeState', on: 'target', state: 'broken' },
      { type: 'spawnEffect', effectId: 'crate_burst' },
    ],
  }),
  rule({
    id: 'rule_guided_enter', name: 'Guided surface → path', priority: 7,
    sourceTypes: ['player'], targetTypes: ['pathSurface'], phases: ['enter'],
    actions: [{ type: 'enterPathFollow', pathId: 'path_test_curve', mode: 'fullyAutomatic' }],
  }),
];

export const ANIMATION_DEF_SEED: AnimationDefinition[] = [
  { id: 'anim_bump', displayName: 'Bump', clipName: 'Bump', layer: 'reaction', loop: false, fadeIn: 0.1, fadeOut: 0.15, speed: 1, priority: 5, interruptible: true },
  { id: 'anim_wave', displayName: 'Wave', clipName: 'Wave', layer: 'reaction', loop: false, fadeIn: 0.15, fadeOut: 0.2, speed: 1, priority: 5, interruptible: true },
  { id: 'anim_recoil', displayName: 'Recoil', clipName: 'Recoil', layer: 'reaction', loop: false, fadeIn: 0.1, fadeOut: 0.15, speed: 1, priority: 6, interruptible: true },
];
