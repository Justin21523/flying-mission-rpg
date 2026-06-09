import { create } from 'zustand';
import type { DamageRequest } from '../game/combat/applySuperDamage';
import { useActivityStore } from './activityStore';

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
}

// Module-level mutable list (the render list is keyed by id; movement mutates entries in place).
export const liveYokai: Yokai[] = [];

// Where each defeat happened this frame — drained by the kill-VFX layer (Phase C).
export interface KillEvent { x: number; y: number; z: number; elite: boolean }
const killQueue: KillEvent[] = [];
export function drainKills(out: KillEvent[]): number { const n = killQueue.length; for (let i = 0; i < n; i++) out[i] = killQueue[i]; killQueue.length = 0; return n; }

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

interface YokaiCombatState {
  version: number;     // bumped on spawn / removal → layer re-renders the mesh list
  hunting: boolean;
  kills: number;
  start: () => void;
  stop: () => void;
  spawn: (y: Yokai) => void;
  removeDead: () => void;     // sweep finished poofs (called by the layer)
  damage: (req: DamageRequest) => void;
}

// Defeat one yokai: queue its kill VFX, bump score + objective, win when the target is met.
function defeat(y: Yokai): void {
  killQueue.push({ x: y.x, y: y.y, z: y.z, elite: y.elite });
  const as = useActivityStore.getState();
  const a = as.activity;
  const rush = a?.rushConfig;
  as.addScore(y.elite ? (rush?.scoreElite ?? 30) : (rush?.scoreNormal ?? 10));
  const obj = a?.objectives.find((o) => o.objectiveType === 'defeatEnemies');
  const kills = useYokaiCombatStore.getState().kills + 1;
  useYokaiCombatStore.setState({ kills });
  if (obj) {
    as.setObjective(obj.id, kills);
    if (kills >= obj.targetValue) as.finish('win');
  }
}

export const useYokaiCombatStore = create<YokaiCombatState>((set, get) => ({
  version: 0,
  hunting: false,
  kills: 0,
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
  damage: (req) => {
    const facing = req.kind === 'beam' || req.kind === 'bolt' || req.kind === 'dash';
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
      y.hp -= req.damage;
      if (y.hp <= 0) { y.dyingAt = now(); defeat(y); }
    }
  },
}));
