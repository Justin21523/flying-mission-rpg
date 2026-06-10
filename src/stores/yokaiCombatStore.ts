import { create } from 'zustand';
import type { DamageRequest } from '../game/combat/applySuperDamage';
import { useActivityStore } from './activityStore';
import { useProgressionStore } from './progressionStore';
import { useWalletStore } from './walletStore';
import { useTransformStore } from './transformStore';

// Per-defeat rewards (exp + coins). Elites are worth more. Kept here so the kill consequence is one place.
const EXP_NORMAL = 10, EXP_ELITE = 25, COIN_NORMAL = 4, COIN_ELITE = 10;

// POLI yokai-hunt — runtime state for the LIVE yokai during an enemyRush hunt. The per-yokai mutable data
// (position, velocity, hp) lives in a module-level array updated in useFrame (no per-frame store writes / no
// re-renders); the zustand store only carries a `version` counter bumped when the SET of yokai changes
// (spawn / death-removed) so the layer remounts/unmounts meshes, plus the hunt on/off flag. Super attacks call
// `damage()` (registered as the super-damage sink by YokaiCombatLayer).

export interface Yokai {
  id: string;
  modelPath: string;   // encoded GLB url
  color: string;       // tint / fallback capsule colour
  elite: boolean;
  maxHp: number;
  hp: number;
  x: number; y: number; z: number;
  vx: number; vz: number;   // wander velocity
  clipSeed: number;         // picks a random animation clip
  dyingAt: number;          // 0 = alive; else perf-time the defeat poof started
  // AI (stamped from the YokaiType at spawn).
  behavior: import('../types/yokai').YokaiBehavior;
  moveSpeed: number;
  aggroRange: number;
  attackRange: number;
  attackRate: number;
  attackDamage: number;
  fleeHpPct: number;
  nextAttackAt: number;     // perf-time the next player attack is allowed (Phase J)
  flankAng: number;         // swarmer surround angle offset
}

// Module-level mutable list (the render list is keyed by id; movement mutates entries in place).
export const liveYokai: Yokai[] = [];

// Where each defeat happened this frame — drained by the kill-VFX layer (Phase C). Carries the exp/coin
// awarded so the rising "+N" popups show the right numbers.
export interface KillEvent { x: number; y: number; z: number; elite: boolean; exp: number; coin: number }
const killQueue: KillEvent[] = [];
export function drainKills(out: KillEvent[]): number { const n = killQueue.length; for (let i = 0; i < n; i++) out[i] = killQueue[i]; killQueue.length = 0; return n; }

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

interface YokaiCombatState {
  version: number;     // bumped on spawn / removal → layer re-renders the mesh list
  hunting: boolean;
  kills: number;       // defeats in the CURRENT hunt (reset on start)
  totalDefeated: number; // lifetime defeats (for quest objectives; never reset)
  start: () => void;
  stop: () => void;
  spawn: (y: Yokai) => void;
  removeDead: () => void;     // sweep finished poofs (called by the layer)
  cullFar: (px: number, pz: number, dist: number) => void;
  trimToCap: (cap: number) => void;
  damage: (req: DamageRequest) => void;
}

// Defeat one yokai: award exp/coins, queue its kill VFX, play a celebrate anim, bump the score/kill count.
// Endless 1-minute rush — there is NO kill target; the hunt ends only when the timer runs out (score = kills).
function defeat(y: Yokai): void {
  const exp = y.elite ? EXP_ELITE : EXP_NORMAL;
  const coin = y.elite ? COIN_ELITE : COIN_NORMAL;
  useProgressionStore.getState().addExp(exp);
  useWalletStore.getState().addCoins(coin);
  useTransformStore.getState().celebrate();
  killQueue.push({ x: y.x, y: y.y, z: y.z, elite: y.elite, exp, coin });
  const as = useActivityStore.getState();
  const a = as.activity;
  const rush = a?.rushConfig;
  as.addScore(y.elite ? (rush?.scoreElite ?? 30) : (rush?.scoreNormal ?? 10));
  const obj = a?.objectives.find((o) => o.objectiveType === 'defeatEnemies');
  const s = useYokaiCombatStore.getState();
  const kills = s.kills + 1;
  useYokaiCombatStore.setState({ kills, totalDefeated: s.totalDefeated + 1 });
  if (obj) as.setObjective(obj.id, kills); // track count for the HUD only — no early win on a target
}

export const useYokaiCombatStore = create<YokaiCombatState>((set, get) => ({
  version: 0,
  hunting: false,
  kills: 0,
  totalDefeated: 0,
  start: () => { liveYokai.length = 0; killQueue.length = 0; set({ hunting: true, kills: 0, version: get().version + 1 }); },
  stop: () => { liveYokai.length = 0; killQueue.length = 0; set({ hunting: false, version: get().version + 1 }); },
  spawn: (y) => { liveYokai.push(y); set({ version: get().version + 1 }); },
  removeDead: () => {
    const t = now();
    let changed = false;
    for (let i = liveYokai.length - 1; i >= 0; i--) {
      if (liveYokai[i].dyingAt && t - liveYokai[i].dyingAt > 0.4) { liveYokai.splice(i, 1); changed = true; }
    }
    if (changed) set({ version: get().version + 1 });
  },
  // Recycle yokai that wandered too far from the player (silent — no defeat/score), so on a big map the swarm
  // stays near and fresh ones keep spawning around the player.
  cullFar: (px, pz, dist) => {
    const d2 = dist * dist;
    let changed = false;
    for (let i = liveYokai.length - 1; i >= 0; i--) {
      const y = liveYokai[i];
      if (y.dyingAt) continue;
      if ((y.x - px) ** 2 + (y.z - pz) ** 2 > d2) { liveYokai.splice(i, 1); changed = true; }
    }
    if (changed) set({ version: get().version + 1 });
  },
  // Keep the LIVE count perf-safe while spawning endlessly: silently remove the OLDEST alive yokai (front of
  // the array) until within `cap`. Recycled yokai aren't "defeated" (no score) — they just wander off.
  trimToCap: (cap) => {
    let alive = liveYokai.reduce((n, y) => n + (y.dyingAt ? 0 : 1), 0);
    let changed = false;
    for (let i = 0; i < liveYokai.length && alive > cap; i++) {
      if (!liveYokai[i].dyingAt) { liveYokai.splice(i, 1); i--; alive--; changed = true; }
    }
    if (changed) set({ version: get().version + 1 });
  },
  damage: (req) => {
    if (req.kind === 'chain') { damageChain(req); return; }
    const facing = req.kind === 'beam' || req.kind === 'bolt' || req.kind === 'dash' || req.kind === 'boomerang';
    const halfWidth = 2.2; // lateral reach of forward attacks
    for (const y of liveYokai) {
      if (y.dyingAt) continue;
      const dx = y.x - req.x, dz = y.z - req.z;
      let hit: boolean;
      if (facing) {
        const along = dx * req.dirX + dz * req.dirZ;        // forward projection
        const perp = Math.abs(dx * req.dirZ - dz * req.dirX); // perpendicular distance
        hit = along > -1 && along < req.range && perp < halfWidth;
      } else {
        hit = dx * dx + dz * dz < req.radius * req.radius;   // AoE / auto radius
      }
      if (!hit) continue;
      applyHit(y, req.damage);
    }
  },
}));

// Apply damage to one yokai (defeat handles score/exp/coins/VFX).
function applyHit(y: Yokai, damage: number): void {
  if (y.dyingAt) return;
  y.hp -= damage;
  if (y.hp <= 0) { y.dyingAt = now(); defeat(y); }
}

// Chain lightning — strike the nearest yokai within range of the origin, then hop to the nearest not-yet-hit
// yokai within HOP_RANGE, up to `count` total targets.
const HOP_RANGE = 7;
function damageChain(req: DamageRequest): void {
  const hit = new Set<string>();
  let cx = req.x, cz = req.z, reach = Math.max(req.range, req.radius);
  const jumps = Math.max(1, req.count);
  for (let j = 0; j < jumps; j++) {
    let best: Yokai | null = null; let bestD = Infinity;
    for (const y of liveYokai) {
      if (y.dyingAt || hit.has(y.id)) continue;
      const d = Math.hypot(y.x - cx, y.z - cz);
      if (d < reach && d < bestD) { bestD = d; best = y; }
    }
    if (!best) break;
    hit.add(best.id);
    applyHit(best, req.damage);
    cx = best.x; cz = best.z; reach = HOP_RANGE; // subsequent hops measured from the last target
  }
}
