import type { BossSignatureMechanic } from '../../types/game/boss';

// Wave 1 — Boss Signature Mechanic runtime. Runs each frame on top of the shared boss pipeline so every boss
// gets a memorable hook. Pure of any BossDirector import (BossDirector imports THIS) — all world effects are
// injected via ctx. Per-mechanic runtime state lives here (reset on boss cleanup). Renderer-facing flags (e.g.
// blackout / flood radius / shrink radius / reflect) are exposed via getMechanicFlag for the hazard renderer.

export interface MechanicCtx {
  now: number; // seconds
  phaseId?: string;
  bossPos: { x: number; z: number };
  playerPos: { x: number; z: number };
  enrageActive: boolean;
  applyPlayerDamage: (amount: number) => void;
  spawnEnemy: (enemyDefId: string, x: number, z: number) => string | undefined;
  isAlive: (targetId: string) => boolean;
  healBoss: (amount: number) => void;
  regenBossShield: (amount: number) => void;
  playEffect?: (effectId: string, x: number, z: number) => void;
}

interface Strike { x: number; z: number; at: number; radius: number; damage: number }
interface MechState { lastNow: number; nextTickAt: number; healerIds: string[]; strikes: Strike[]; blackout: boolean; toggleAt: number; startAt: number }

const states = new Map<string, MechState>();
const flags: Record<string, number> = {}; // mechanic.id + ':' + key → value (read by the hazard renderer)

export function getMechanicFlag(mechanicId: string, key: string): number { return flags[`${mechanicId}:${key}`] ?? 0; }
function setFlag(id: string, key: string, value: number): void { flags[`${id}:${key}`] = value; }

function stateFor(id: string, now: number): MechState {
  let st = states.get(id);
  if (!st) { st = { lastNow: now, nextTickAt: 0, healerIds: [], strikes: [], blackout: false, toggleAt: 0, startAt: now }; states.set(id, st); }
  return st;
}

function dist2(ax: number, az: number, bx: number, bz: number): number { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; }

// Resolve any pending strikes whose time has come: damage the player only if still inside the radius (dodgeable).
function resolveStrikes(st: MechState, ctx: MechanicCtx): void {
  for (let i = st.strikes.length - 1; i >= 0; i--) {
    const s = st.strikes[i];
    if (ctx.now < s.at) continue;
    if (dist2(ctx.playerPos.x, ctx.playerPos.z, s.x, s.z) <= s.radius * s.radius) ctx.applyPlayerDamage(s.damage);
    ctx.playEffect?.('', s.x, s.z);
    st.strikes.splice(i, 1);
  }
}

export function update(mechanic: BossSignatureMechanic | undefined, ctx: MechanicCtx): void {
  if (!mechanic || mechanic.enabled === false) return;
  const active = !mechanic.activeInPhaseIds?.length || (ctx.phaseId != null && mechanic.activeInPhaseIds.includes(ctx.phaseId));
  const st = stateFor(mechanic.id, ctx.now);
  // stateFor seeds lastNow=now on creation, so the first tick is dt=0 naturally (no truthiness guard — now can be 0).
  const dt = Math.min(0.1, Math.max(0, ctx.now - st.lastNow));
  st.lastNow = ctx.now;
  if (!active) { setFlag(mechanic.id, 'blackout', 0); setFlag(mechanic.id, 'floodRadius', 0); setFlag(mechanic.id, 'reflect', 0); return; }

  const cfg = mechanic.config ?? {};
  const interval = Math.max(0.3, (cfg.intervalSeconds ?? 3) * (ctx.enrageActive ? (cfg.enrageIntervalMult ?? 0.6) : 1));
  const damage = cfg.damage ?? 12;
  const radius = cfg.radius ?? 6;
  const warn = cfg.warnSeconds ?? 1;
  const due = ctx.now >= st.nextTickAt;

  resolveStrikes(st, ctx);

  switch (mechanic.type) {
    case 'moving-hazard-lasers':
    case 'falling-debris': {
      // Schedule a telegraphed strike where the player currently is — they can walk out of it.
      if (due) { st.nextTickAt = ctx.now + interval; st.strikes.push({ x: ctx.playerPos.x, z: ctx.playerPos.z, at: ctx.now + warn, radius, damage }); ctx.playEffect?.(mechanic.vfxId ?? '', ctx.playerPos.x, ctx.playerPos.z); }
      break;
    }
    case 'arena-flood': {
      // Wide pulse centered on the boss/arena; the player must be far enough out when it resolves.
      setFlag(mechanic.id, 'floodRadius', radius);
      if (due) { st.nextTickAt = ctx.now + interval; st.strikes.push({ x: ctx.bossPos.x, z: ctx.bossPos.z, at: ctx.now + warn, radius, damage }); }
      break;
    }
    case 'blackout-pulse': {
      if (ctx.now >= st.toggleAt) { st.blackout = !st.blackout; st.toggleAt = ctx.now + interval; }
      setFlag(mechanic.id, 'blackout', st.blackout ? 1 : 0);
      break;
    }
    case 'reflect-aegis': {
      setFlag(mechanic.id, 'reflect', 1);
      ctx.regenBossShield((cfg.shieldRegenPerSec ?? 12) * dt);
      break;
    }
    case 'priority-healer': {
      st.healerIds = st.healerIds.filter((id) => ctx.isAlive(id));
      const maxHealers = cfg.maxHealers ?? 1;
      if (due && st.healerIds.length < maxHealers) {
        st.nextTickAt = ctx.now + interval;
        const ang = (ctx.now % (Math.PI * 2));
        const id = ctx.spawnEnemy(mechanic.enemyRef ?? 'repair_wisp', ctx.bossPos.x + Math.cos(ang) * 5, ctx.bossPos.z + Math.sin(ang) * 5);
        if (id) st.healerIds.push(id);
      }
      if (st.healerIds.length > 0) ctx.healBoss((cfg.healPerSec ?? 10) * dt);
      setFlag(mechanic.id, 'healerActive', st.healerIds.length > 0 ? 1 : 0);
      break;
    }
    case 'arena-shrink': {
      // Safe radius shrinks from baseRadius toward minRadius over shrinkSeconds; damage when the player is out.
      const base = cfg.baseRadius ?? 22, min = cfg.minRadius ?? 8, shrinkSeconds = cfg.shrinkSeconds ?? 30;
      const k = Math.min(1, Math.max(0, (ctx.now - st.startAt) / shrinkSeconds));
      const safe = Math.max(min, base - (base - min) * k);
      setFlag(mechanic.id, 'safeRadius', safe);
      if (due) {
        st.nextTickAt = ctx.now + interval;
        if (dist2(ctx.playerPos.x, ctx.playerPos.z, ctx.bossPos.x, ctx.bossPos.z) > safe * safe) ctx.applyPlayerDamage(damage);
      }
      break;
    }
  }
}

export function reset(): void {
  states.clear();
  for (const k of Object.keys(flags)) delete flags[k];
}
