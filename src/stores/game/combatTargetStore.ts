import { create } from 'zustand';
import type { DamageResult } from '../../types/game/combat';
import type { ActiveStatusEffect } from '../../game/combat/StatusEffectRuntime';
import { awardKillReward } from '../../game/progression/KillRewards';

// Runtime registry of live combat targets (dummies this batch; enemies later). Mirrors the yokai pattern:
// the per-target mutable data (hp/shield/pos) lives in a module-level array updated without per-frame store
// writes; the zustand store only carries a `version` counter bumped when the SET changes (spawn/remove) so
// the renderer remounts meshes. Kept SEPARATE from liveYokai (no hunt rewards / no AI here).

export interface CombatTarget {
  id: string;
  definitionId: string;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  x: number; y: number; z: number;
  defeatedAt: number; // 0 = alive; else perf-time the defeat poof started
  segmentAreaId?: string; // optional: which zone clear-area this target belongs to
  // Batch D — enemy/boss fields (undefined for plain dummies).
  isEnemy?: boolean;
  enemyDefId?: string;
  modelAssetId?: string;
  scale?: number;
  color?: string;
  moveSpeed?: number;
  aggroRange?: number;
  attackRange?: number;
  aiBehavior?: string;
  skillIds?: string[];
  skillCooldowns?: Record<string, number>;
  bossId?: string;
  bossPhaseIndex?: number;
  // Batch C — archetype AI + obstacle proxy fields.
  archetype?: string;
  aiState?: string;
  aiData?: Record<string, number>; // blackboard: windupUntil / chargeUntil / recoverUntil / stunUntil / fireAt …
  facingRad?: number;
  shieldBroken?: boolean;
  spawnGroupId?: string;
  isObstacle?: boolean;
  obstacleId?: string;
  // Batch D-kits — Chase scan marks weakpoints (precision bonus on hit); stun via aiData.stunUntil.
  scanned?: boolean;
  weakpointExposed?: boolean;
  // Batch F — boss encounter targets (driven by BossDirector, NOT the enemy AI host; rendered by BossRenderer).
  isBossEntity?: boolean;
  isBossWeakpoint?: boolean;
  bossWeakpointId?: string;
  statusEffects?: ActiveStatusEffect[];
  // Wave 1 — elite affixes applied at spawn (runtime values live on aiData: affixVolatileRadius/Damage,
  // affixRegenPerSec, affixLifesteal). affixExploded guards the one-shot volatile death explosion.
  affixIds?: string[];
  affixExploded?: boolean;
  // Wave 2 — poise/break meter (accumulates from staggering hits; full → stagger via aiData.stunUntil) +
  // execution guard (executingAt set while a finisher plays).
  poiseValue?: number;
  maxPoise?: number;
  poiseBreakAt?: number;
  executingAt?: number;
}

export const liveTargets: CombatTarget[] = [];

// Hit popups ("-N") drained by the damage-number layer.
export interface CombatHitEvent { x: number; y: number; z: number; amount: number; weakness: boolean; crit: boolean }
const hitQueue: CombatHitEvent[] = [];
export function drainCombatHits(out: CombatHitEvent[]): number {
  const n = hitQueue.length;
  for (let i = 0; i < n; i++) out[i] = hitQueue[i];
  hitQueue.length = 0;
  return n;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

// Shove a live target (pull/push skills, knockback). Mutates in place — no store write needed (the renderer
// reads the live position each frame).
export function displaceTarget(id: string, dx: number, dz: number): void {
  const t = liveTargets.find((x) => x.id === id);
  if (t && !t.defeatedAt) { t.x += dx; t.z += dz; }
}

interface CombatTargetState {
  version: number;
  bump: () => void;
  spawn: (t: CombatTarget) => void;
  remove: (id: string) => void;
  reset: () => void;
  removeDead: () => void;
  applyResult: (result: DamageResult) => void;
  liveCountForArea: (areaId: string) => number;
}

export const useCombatTargetStore = create<CombatTargetState>((set, get) => ({
  version: 0,

  bump: () => set({ version: get().version + 1 }),

  spawn: (t) => { liveTargets.push(t); set({ version: get().version + 1 }); },

  remove: (id) => {
    const i = liveTargets.findIndex((t) => t.id === id);
    if (i >= 0) { liveTargets.splice(i, 1); set({ version: get().version + 1 }); }
  },

  reset: () => { liveTargets.length = 0; hitQueue.length = 0; set({ version: get().version + 1 }); },

  removeDead: () => {
    const t = now();
    let changed = false;
    for (let i = liveTargets.length - 1; i >= 0; i--) {
      if (liveTargets[i].defeatedAt && t - liveTargets[i].defeatedAt > 0.5) { liveTargets.splice(i, 1); changed = true; }
    }
    if (changed) set({ version: get().version + 1 });
  },

  // Apply a resolved damage result to the matching live target (mutates in place; queues a popup).
  applyResult: (result) => {
    const target = liveTargets.find((t) => t.id === result.targetId);
    if (!target || target.defeatedAt) return;
    target.shield = Math.max(0, target.shield - result.shieldDamage);
    target.hp = Math.max(0, target.hp - result.hpDamage);
    hitQueue.push({ x: target.x, y: target.y, z: target.z, amount: result.finalAmount, weakness: result.wasWeaknessHit, crit: result.wasCrit });
    if (result.targetDefeated || target.hp <= 0) {
      target.hp = 0;
      target.defeatedAt = now();
      awardKillReward(target); // Batch L — EXP to active character + coins on enemy defeat
      set({ version: get().version + 1 });
    }
  },

  liveCountForArea: (areaId) => liveTargets.reduce((n, t) => n + (t.segmentAreaId === areaId && !t.defeatedAt ? 1 : 0), 0),
}));
