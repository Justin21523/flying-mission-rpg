import { create } from 'zustand';
import type { DamageEventTemplate, SpawnMovement, SkillFaction } from '../../types/game/combat';

// Model-driven combat spawns — projectiles, summons, and terrain pieces that render REAL GLB models and
// participate in combat. Mirrors summonStore: per-spawn mutable data (position/velocity/timers) lives in a
// module array updated in useFrame (no per-frame store writes); the store carries a `version` bumped when
// the SET changes (spawn / despawn) so CombatSpawnLayer mounts/unmounts model instances.

export type CombatSpawnKind = 'projectile' | 'summon' | 'terrain';

export interface CombatSpawn {
  id: string;
  kind: CombatSpawnKind;
  faction: SkillFaction;
  casterId?: string; // Wave 5 — enemy/boss id that spawned this (enables projectile/summon vampiric heal-back)
  modelAssetId?: string; // GLB to render (geometry fallback if absent)
  scale: number;
  color: string;

  x: number; y: number; z: number;
  vx: number; vz: number;        // linear/lobbed horizontal velocity
  vy: number;                    // lobbed vertical velocity (gravity applied)
  movement: SpawnMovement;
  targetId?: string;             // homing / seek target
  centerX: number; centerZ: number; // orbit center (player)
  orbitAng: number;

  untilMs: number;
  nextHitAt: number;             // summon / dot-zone attack timer (perf ms)
  radius: number;
  damage: DamageEventTemplate;
  blocksMovement: boolean;
  impactEffectDefId?: string;
  hasImpacted: boolean;          // projectile single-hit guard
  spawnedAtMs: number;
}

export const liveSpawns: CombatSpawn[] = [];
let uid = 0;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Impact popups for the damage-number layer (reuses the same idea as combatTargetStore hits).
export interface SpawnImpact { x: number; y: number; z: number }
const impactQueue: SpawnImpact[] = [];
export function drainSpawnImpacts(out: SpawnImpact[]): number {
  const n = impactQueue.length;
  for (let i = 0; i < n; i++) out[i] = impactQueue[i];
  impactQueue.length = 0;
  return n;
}
export function queueSpawnImpact(x: number, y: number, z: number): void { impactQueue.push({ x, y, z }); }

interface CombatSpawnState {
  version: number;
  bump: () => void;
  sweep: () => void;
  reset: () => void;
}

export const useCombatSpawnStore = create<CombatSpawnState>((set, get) => ({
  version: 0,
  bump: () => set({ version: get().version + 1 }),
  sweep: () => {
    const t = nowMs();
    let changed = false;
    for (let i = liveSpawns.length - 1; i >= 0; i--) {
      if (liveSpawns[i].untilMs < t || liveSpawns[i].hasImpacted) { liveSpawns.splice(i, 1); changed = true; }
    }
    if (changed) set({ version: get().version + 1 });
  },
  reset: () => { liveSpawns.length = 0; impactQueue.length = 0; set({ version: get().version + 1 }); },
}));

export interface SpawnRequest {
  kind: CombatSpawnKind;
  faction: SkillFaction;
  casterId?: string; // Wave 5 — who spawned this (for vampiric heal-back on player hit)
  modelAssetId?: string;
  scale?: number;
  color?: string;
  x: number; y: number; z: number;
  dirX: number; dirZ: number;     // forward unit
  speed: number;
  movement: SpawnMovement;
  targetId?: string;
  lifetimeSeconds: number;
  radius: number;
  damage: DamageEventTemplate;
  blocksMovement?: boolean;
  impactEffectDefId?: string;
  attackIntervalSeconds?: number; // summon / dot-zone
  offsetForward?: number;         // spawn ahead of the caster
}

export function spawnCombat(req: SpawnRequest): CombatSpawn {
  const t = nowMs();
  const off = req.offsetForward ?? 0;
  const lobbed = req.movement === 'lobbed';
  const spawn: CombatSpawn = {
    id: `cs_${uid++}`,
    kind: req.kind,
    faction: req.faction,
    casterId: req.casterId,
    modelAssetId: req.modelAssetId,
    scale: req.scale ?? 1,
    color: req.color ?? '#ffffff',
    x: req.x + req.dirX * off,
    y: req.y + (lobbed ? 0.5 : req.kind === 'terrain' ? 0 : 1),
    z: req.z + req.dirZ * off,
    vx: req.dirX * req.speed,
    vz: req.dirZ * req.speed,
    vy: lobbed ? 6 : 0,
    movement: req.movement,
    targetId: req.targetId,
    centerX: req.x,
    centerZ: req.z,
    orbitAng: Math.random() * Math.PI * 2,
    untilMs: t + Math.max(0.2, req.lifetimeSeconds) * 1000,
    nextHitAt: t + (req.attackIntervalSeconds ?? 0.4) * 1000,
    radius: req.radius,
    damage: req.damage,
    blocksMovement: req.blocksMovement ?? false,
    impactEffectDefId: req.impactEffectDefId,
    hasImpacted: false,
    spawnedAtMs: t,
  };
  liveSpawns.push(spawn);
  useCombatSpawnStore.getState().bump();
  return spawn;
}
