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
  // Wave 2 — live player-faction projectiles near the enemy (for the dodger). Optional; host fills it.
  threats?: { x: number; z: number; vx: number; vz: number }[];
}

export type AiAction =
  | 'none' | 'charge-hit' | 'fire' | 'bash' | 'spawn-minions' | 'dash' | 'quake-slam' | 'heal-ally'
  // Wave 2 — tactical actions.
  | 'melee-hit' | 'self-destruct' | 'buff-allies';

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

// ---- Spawner Bug: keeps its distance + summons minions on an interval (Batch I) ----
function stepSpawner(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.spawner!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  const aggro = e.aggroRange ?? def.aggroRange;
  if (dist <= aggro && ctx.nowS >= (d.nextSpawnAt ?? 0) && (d.spawns ?? 0) < cfg.maxSpawns) {
    d.nextSpawnAt = ctx.nowS + cfg.spawnIntervalSeconds;
    d.spawns = (d.spawns ?? 0) + 1;
    return still(set(e, 'spawning'), facing, 'spawn-minions');
  }
  if (dist < cfg.retreatRange) {
    const step = (e.moveSpeed ?? def.moveSpeed) * ctx.dt;
    return { state: set(e, 'fleeing'), moveX: -Math.sin(facing) * step, moveZ: -Math.cos(facing) * step, facingRad: facing, action: 'none' };
  }
  return still(set(e, 'idle'), facing);
}

// ---- Zip Glitch: erratic high-speed evasive dashes (Batch I) ----
function stepZip(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.zip!;
  const d = bb(e);
  const facing = angleTo(e, ctx);
  if (e.aiState === 'dashing' && ctx.nowS < (d.dashUntil ?? 0)) {
    const step = cfg.dashSpeed * ctx.dt;
    return { state: 'dashing', moveX: (d.dx ?? 0) * step, moveZ: (d.dz ?? 0) * step, facingRad: Math.atan2(d.dx ?? 0, d.dz ?? 0), action: 'dash' };
  }
  if (ctx.nowS >= (d.nextDashAt ?? 0)) {
    d.nextDashAt = ctx.nowS + cfg.dashIntervalSeconds;
    d.dashUntil = ctx.nowS + cfg.dashDurationSeconds;
    const away = facing + Math.PI + Math.sin(ctx.nowS * 7) * cfg.jitter; // deterministic evasion
    d.dx = Math.sin(away); d.dz = Math.cos(away);
    return still(set(e, 'dashing'), away, 'dash');
  }
  return still(set(e, 'idle'), facing);
}

// ---- Quake Walker: slow approach → telegraphed (interruptible) AOE slam (Batch I) ----
function stepQuake(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.quake!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  const aggro = e.aggroRange ?? def.aggroRange;
  const state = (e.aiState as EnemyAiState) ?? 'idle';
  // Interrupt: a stun during the windup cancels the slam (dodge/interrupt counterplay).
  if (state === 'quake-windup' && ctx.nowS < (d.stunUntil ?? 0)) { d.windupUntil = 0; return still(set(e, 'chasing'), facing); }
  switch (state) {
    case 'quake-windup':
      if (ctx.nowS >= (d.windupUntil ?? 0)) { d.slamAt = ctx.nowS + cfg.cooldownSeconds; return still(set(e, 'slamming'), facing, 'quake-slam'); }
      return still('quake-windup', e.facingRad ?? facing);
    case 'slamming':
      return still(set(e, 'chasing'), facing);
    case 'chasing': {
      if (dist > aggro * 1.6) return still(set(e, 'idle'), facing);
      if (dist <= cfg.slamRadius && ctx.nowS >= (d.slamAt ?? 0)) { d.windupUntil = ctx.nowS + cfg.windupSeconds; return still(set(e, 'quake-windup'), facing); }
      const step = (e.moveSpeed ?? def.moveSpeed) * ctx.dt;
      return { state: 'chasing', moveX: Math.sin(facing) * step, moveZ: Math.cos(facing) * step, facingRad: facing, action: 'none' };
    }
    case 'idle':
    default:
      if (dist <= aggro) return still(set(e, 'chasing'), facing);
      return still('idle', e.facingRad ?? facing);
  }
}

// ---- Repair Wisp: flees the player + heals a damaged ally on an interval (Batch I) ----
function stepRepairWisp(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.repairWisp!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  if (ctx.nowS >= (d.healAt ?? 0)) {
    d.healAt = ctx.nowS + cfg.healIntervalSeconds;
    return still(set(e, 'healing'), facing, 'heal-ally');
  }
  if (dist < cfg.fleeRange) {
    const step = (e.moveSpeed ?? def.moveSpeed) * ctx.dt;
    return { state: set(e, 'fleeing'), moveX: -Math.sin(facing) * step, moveZ: -Math.cos(facing) * step, facingRad: facing, action: 'none' };
  }
  return still(set(e, 'idle'), facing);
}

// ---- Dodger: chases, but sidesteps when a player projectile comes near (Wave 2) ----
function stepDodger(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.dodger!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  // Continue an active sidestep.
  if (e.aiState === 'evading' && ctx.nowS < (d.evadeUntil ?? 0)) {
    const step = cfg.evadeSpeed * ctx.dt;
    return { state: 'evading', moveX: (d.evx ?? 0) * step, moveZ: (d.evz ?? 0) * step, facingRad: facing, action: 'none' };
  }
  // Detect an incoming threat and begin a perpendicular evade (off cooldown).
  if (ctx.nowS >= (d.evadeReadyAt ?? 0) && ctx.threats?.length) {
    const r2 = cfg.projectileDetectRange * cfg.projectileDetectRange;
    const near = ctx.threats.find((th) => (th.x - e.x) ** 2 + (th.z - e.z) ** 2 <= r2);
    if (near) {
      const vlen = Math.hypot(near.vx, near.vz) || 1;
      d.evx = -near.vz / vlen; d.evz = near.vx / vlen; // perpendicular to the projectile heading
      d.evadeUntil = ctx.nowS + cfg.evadeDurationSeconds;
      d.evadeReadyAt = ctx.nowS + cfg.evadeCooldownSeconds;
      return still(set(e, 'evading'), facing);
    }
  }
  if (dist <= HIT_RADIUS + 1) return still(set(e, 'chasing'), facing, 'melee-hit');
  const step = cfg.approachSpeed * ctx.dt;
  return { state: set(e, 'chasing'), moveX: Math.sin(facing) * step, moveZ: Math.cos(facing) * step, facingRad: facing, action: 'none' };
}

// ---- Flanker: approaches on an angle to reach the player's side/back, then strikes (Wave 2) ----
function stepFlanker(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.flanker!;
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  if (dist <= cfg.attackRange) return still(set(e, 'flanking'), facing, 'melee-hit');
  // Offset the approach heading; straighten as it closes so it actually reaches the player.
  const off = (cfg.flankAngleDegrees * Math.PI / 180) * (dist > cfg.attackRange * 2 ? 1 : 0.3);
  const head = facing + off;
  const step = cfg.approachSpeed * ctx.dt;
  return { state: set(e, 'flanking'), moveX: Math.sin(head) * step, moveZ: Math.cos(head) * step, facingRad: facing, action: 'none' };
}

// ---- Bomber: rushes in, arms a fuse, then self-destructs (Wave 2) ----
function stepBomber(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.bomber!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  if (e.aiState === 'arming') {
    if (ctx.nowS >= (d.armUntil ?? 0)) return still(set(e, 'defeated'), e.facingRad ?? facing, 'self-destruct');
    return still('arming', e.facingRad ?? facing);
  }
  if (dist <= cfg.armRange) { d.armUntil = ctx.nowS + cfg.fuseSeconds; return still(set(e, 'arming'), facing); }
  const step = cfg.rushSpeed * ctx.dt;
  return { state: set(e, 'chasing'), moveX: Math.sin(facing) * step, moveZ: Math.cos(facing) * step, facingRad: facing, action: 'none' };
}

// ---- Suppressor: holds a preferred range and fires rapid covering shots (Wave 2) ----
function stepSuppressor(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.suppressor!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  const step = (e.moveSpeed ?? def.moveSpeed) * ctx.dt;
  let mvx = 0, mvz = 0;
  if (dist < cfg.preferredRange - 1) { mvx = -Math.sin(facing) * step; mvz = -Math.cos(facing) * step; }
  else if (dist > cfg.preferredRange + 2) { mvx = Math.sin(facing) * step; mvz = Math.cos(facing) * step; }
  if (ctx.nowS >= (d.fireAt ?? 0)) { d.fireAt = ctx.nowS + cfg.fireIntervalSeconds; return { state: set(e, 'suppressing'), moveX: mvx, moveZ: mvz, facingRad: facing, action: 'fire' }; }
  return { state: set(e, 'suppressing'), moveX: mvx, moveZ: mvz, facingRad: facing, action: 'none' };
}

// ---- Buffer: hangs back and shields nearby allies on an interval (kill priority) (Wave 2) ----
function stepBuffer(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep {
  const cfg = def.buffer!;
  const d = bb(e);
  const dist = distTo(e, ctx);
  const facing = angleTo(e, ctx);
  const step = (e.moveSpeed ?? def.moveSpeed) * ctx.dt;
  let mvx = 0, mvz = 0;
  if (dist < cfg.keepDistance) { mvx = -Math.sin(facing) * step; mvz = -Math.cos(facing) * step; }
  if (ctx.nowS >= (d.buffAt ?? 0)) { d.buffAt = ctx.nowS + cfg.buffIntervalSeconds; return { state: set(e, 'buffing'), moveX: mvx, moveZ: mvz, facingRad: facing, action: 'buff-allies' }; }
  return { state: set(e, 'buffing'), moveX: mvx, moveZ: mvz, facingRad: facing, action: 'none' };
}

// Dispatch by archetype. Returns null for archetypes without a state machine (generic → host loop).
export function stepEnemyAi(e: AiEnemy, def: EnemyDefinition, ctx: AiContext): AiStep | null {
  switch (def.archetype) {
    case 'crusher-drone': return def.charge ? stepCrusher(e, def, ctx) : null;
    case 'pulse-turret': return def.turret ? stepTurret(e, def, ctx) : null;
    case 'shield-carrier': return def.shield ? stepShield(e, def, ctx) : null;
    case 'spawner-bug': return def.spawner ? stepSpawner(e, def, ctx) : null;
    case 'zip-glitch': return def.zip ? stepZip(e, def, ctx) : null;
    case 'quake-walker': return def.quake ? stepQuake(e, def, ctx) : null;
    case 'repair-wisp': return def.repairWisp ? stepRepairWisp(e, def, ctx) : null;
    case 'dodger': return def.dodger ? stepDodger(e, def, ctx) : null;
    case 'flanker': return def.flanker ? stepFlanker(e, def, ctx) : null;
    case 'bomber': return def.bomber ? stepBomber(e, def, ctx) : null;
    case 'suppressor': return def.suppressor ? stepSuppressor(e, def, ctx) : null;
    case 'buffer': return def.buffer ? stepBuffer(e, def, ctx) : null;
    default: return null;
  }
}
