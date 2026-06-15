import type { EnemyDefinition, EnemyAiState } from '../../types/game/combat';

// Per-archetype enemy AI state machines (Batch C). Pure + unit-testable: given the enemy's mutable runtime
// fields + its definition + a context, it returns the movement / facing / action for this frame and updates
// the enemy's `aiState` + `aiData` blackboard in place. The host applies the move + actions (deal player
// damage on charge-hit/bash, fire a projectile on fire). Generic enemies are handled by the host's
// approach-and-cast loop, not here.

export interface AiEnemy {
  x: number; z: number;
  aiState?: string;
  aiData?: Record<string, number>;
  facingRad?: number;
  shieldBroken?: boolean;
  moveSpeed?: number;
  aggroRange?: number;
  attackRange?: number;
}

export interface AiContext {
  playerX: number;
  playerZ: number;
  nowS: number;
  dt: number;
}

export type AiAction = 'none' | 'charge-hit' | 'fire' | 'bash';

export interface AiStep {
  state: EnemyAiState;
  moveX: number;
  moveZ: number;
  facingRad: number;
  action: AiAction;
}

const HIT_RADIUS = 1.6;

function bb(e: AiEnemy): Record<string, number> {
  return (e.aiData ??= {});
}
function angleTo(e: AiEnemy, ctx: AiContext): number {
  return Math.atan2(ctx.playerX - e.x, ctx.playerZ - e.z);
}
function distTo(e: AiEnemy, ctx: AiContext): number {
  return Math.hypot(ctx.playerX - e.x, ctx.playerZ - e.z);
}
function set(e: AiEnemy, state: EnemyAiState): EnemyAiState {
  e.aiState = state;
  return state;
}
const still = (state: EnemyAiState, facingRad: number, action: AiAction = 'none'): AiStep => ({ state, moveX: 0, moveZ: 0, facingRad, action });

// ---- Crusher Drone: idle → chasing → charge-windup → charging → recovering ----
function stepCrusher(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.charge!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  const aggro = e.aggroRange ?? def.aggroRange;
  const attack = e.attackRange ?? def.attackRange;
  const state = (e.aiState as EnemyAiState) ?? 'idle';

  switch (state) {
    case 'charge-windup':
      if (ctx.nowS >= (d.windupUntil ?? 0)) {
        d.chargeDirX = Math.sin(facing); d.chargeDirZ = Math.cos(facing);
        d.chargeUntil = ctx.nowS + cfg.chargeDurationSeconds;
        return still(set(e, 'charging'), facing);
      }
      return still('charge-windup', facing);
    case 'charging': {
      const step = cfg.chargeSpeed * ctx.dt;
      const mvx = (d.chargeDirX ?? 0) * step, mvz = (d.chargeDirZ ?? 0) * step;
      if (dist <= HIT_RADIUS) { d.recoverUntil = ctx.nowS + cfg.recoverSeconds; set(e, 'recovering'); return { state: 'recovering', moveX: mvx, moveZ: mvz, facingRad: e.facingRad ?? facing, action: 'charge-hit' }; }
      if (ctx.nowS >= (d.chargeUntil ?? 0)) { d.recoverUntil = ctx.nowS + cfg.recoverSeconds; return { state: set(e, 'recovering'), moveX: mvx, moveZ: mvz, facingRad: e.facingRad ?? facing, action: 'none' }; }
      return { state: 'charging', moveX: mvx, moveZ: mvz, facingRad: e.facingRad ?? facing, action: 'none' };
    }
    case 'recovering':
      if (ctx.nowS >= (d.recoverUntil ?? 0)) return still(set(e, 'chasing'), facing);
      return still('recovering', e.facingRad ?? facing);
    case 'chasing': {
      if (dist > aggro * 1.6) return still(set(e, 'idle'), facing);
      if (dist <= Math.max(attack, 2)) { d.windupUntil = ctx.nowS + cfg.windupSeconds; return still(set(e, 'charge-windup'), facing); }
      const step = (e.moveSpeed ?? def.moveSpeed) * ctx.dt;
      return { state: 'chasing', moveX: Math.sin(facing) * step, moveZ: Math.cos(facing) * step, facingRad: facing, action: 'none' };
    }
    case 'idle':
    default:
      if (dist <= aggro) return still(set(e, 'chasing'), facing);
      return still('idle', e.facingRad ?? facing);
  }
}

// ---- Pulse Turret: tracking → firing → cooldown (stationary) ----
function stepTurret(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.turret!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const target = angleTo(e, ctx);
  const aggro = e.aggroRange ?? def.aggroRange;
  // Rotate toward the player at rotationSpeed.
  const cur = e.facingRad ?? target;
  let diff = target - cur;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxStep = cfg.rotationSpeed * ctx.dt;
  const facing = Math.abs(diff) <= maxStep ? target : cur + Math.sign(diff) * maxStep;
  const aligned = Math.abs(diff) < 0.25;
  const state = (e.aiState as EnemyAiState) ?? 'tracking';

  if (state === 'cooldown') {
    if (ctx.nowS >= (d.fireAt ?? 0)) set(e, 'tracking');
    return still(e.aiState as EnemyAiState, facing);
  }
  if (dist <= aggro && aligned && ctx.nowS >= (d.fireAt ?? 0)) {
    d.fireAt = ctx.nowS + cfg.fireCooldownSeconds;
    set(e, 'cooldown');
    return still('firing', facing, 'fire');
  }
  set(e, 'tracking');
  return still('tracking', facing);
}

// ---- Shield Carrier: guarding ⇄ bash; shield-broken → stunned ----
function stepShield(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.shield!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  const aggro = e.aggroRange ?? def.aggroRange;

  // Stun window after the shield breaks — exposed, no action.
  if (e.shieldBroken && ctx.nowS < (d.stunUntil ?? 0)) return still(set(e, 'stunned'), e.facingRad ?? facing);

  if (dist <= cfg.bashRange && ctx.nowS >= (d.bashAt ?? 0)) {
    d.bashAt = ctx.nowS + 2;
    return still(set(e, 'bash'), facing, 'bash');
  }
  if (dist <= aggro) {
    const step = (e.moveSpeed ?? def.moveSpeed) * 0.5 * ctx.dt;
    return { state: set(e, 'guarding'), moveX: Math.sin(facing) * step, moveZ: Math.cos(facing) * step, facingRad: facing, action: 'none' };
  }
  return still(set(e, 'guarding'), e.facingRad ?? facing);
}

// Dispatch by archetype. Returns null for archetypes without a state machine (generic → host loop).
export function stepEnemyAi(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep | null {
  switch (def.archetype) {
    case 'crusher-drone': return def.charge ? stepCrusher(e, def, ctx) : null;
    case 'pulse-turret': return def.turret ? stepTurret(e, def, ctx) : null;
    case 'shield-carrier': return def.shield ? stepShield(e, def, ctx) : null;
    default: return null;
  }
}
