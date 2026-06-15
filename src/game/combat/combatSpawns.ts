import { liveSpawns, type CombatSpawn } from '../../stores/game/combatSpawnStore';
import type { DamageEventTemplate } from '../../types/game/combat';

// Per-frame movement + impact resolution for model-driven combat spawns (projectiles / summons / terrain).
// Pure given injected deps so it's unit-testable. CombatDirector supplies the real store-backed deps.

export interface SpawnTickDeps {
  nowMs: number;
  // Enemy-side targets a PLAYER/BOSS-vs-enemy spawn can hit: dummies + enemies.
  enemyTargets: () => { id: string; x: number; y: number; z: number }[];
  playerPos: () => { x: number; z: number };
  targetPos: (id: string) => { x: number; z: number } | undefined;
  damageTarget: (targetId: string, template: DamageEventTemplate) => void; // player-faction → enemy
  damagePlayer: (amount: number) => void;                                  // enemy/boss-faction → player
  impact: (spawn: CombatSpawn) => void; // spawn impact effect + popup
}

const GRAVITY = 14;
const ORBIT_RADIUS = 3.2;

function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}

function hitsPlayer(s: CombatSpawn): boolean {
  return s.faction === 'enemy' || s.faction === 'boss';
}

// Resolve an impact: deal damage to the appropriate side, fire the impact callback, mark projectile spent.
function resolveImpact(s: CombatSpawn, deps: SpawnTickDeps, targetId?: string): void {
  if (hitsPlayer(s)) {
    deps.damagePlayer(s.damage.amount);
  } else if (targetId) {
    deps.damageTarget(targetId, s.damage);
  } else {
    // AoE: hit every enemy target in radius.
    for (const t of deps.enemyTargets()) {
      if (dist2(t.x, t.z, s.x, s.z) <= s.radius * s.radius) deps.damageTarget(t.id, s.damage);
    }
  }
  deps.impact(s);
}

// Nearest enemy target within a radius (for projectile collision / summon seek).
function nearestEnemyWithin(s: CombatSpawn, deps: SpawnTickDeps, radius: number): { id: string; x: number; z: number } | undefined {
  let best: { id: string; x: number; z: number } | undefined;
  let bestD = radius * radius;
  for (const t of deps.enemyTargets()) {
    const d = dist2(t.x, t.z, s.x, s.z);
    if (d <= bestD) { bestD = d; best = { id: t.id, x: t.x, z: t.z }; }
  }
  return best;
}

export function tickCombatSpawns(dt: number, deps: SpawnTickDeps): void {
  const player = deps.playerPos();
  for (const s of liveSpawns) {
    if (s.hasImpacted) continue;

    // --- movement ---
    if (s.movement === 'linear') {
      s.x += s.vx * dt; s.z += s.vz * dt;
    } else if (s.movement === 'lobbed') {
      s.x += s.vx * dt; s.z += s.vz * dt; s.vy -= GRAVITY * dt; s.y += s.vy * dt;
      if (s.y <= 0) { s.y = 0; resolveImpact(s, deps); s.hasImpacted = true; continue; }
    } else if (s.movement === 'homing') {
      const tp = s.targetId ? deps.targetPos(s.targetId) : nearestEnemyWithin(s, deps, 30);
      if (tp) {
        const dx = tp.x - s.x, dz = tp.z - s.z, d = Math.hypot(dx, dz) || 1;
        const speed = Math.hypot(s.vx, s.vz) || 8;
        s.vx = (s.vx * 0.85 + (dx / d) * speed * 0.15);
        s.vz = (s.vz * 0.85 + (dz / d) * speed * 0.15);
      }
      s.x += s.vx * dt; s.z += s.vz * dt;
    } else if (s.movement === 'orbit') {
      s.centerX = player.x; s.centerZ = player.z;
      s.orbitAng += dt * 2;
      s.x = s.centerX + Math.cos(s.orbitAng) * ORBIT_RADIUS;
      s.z = s.centerZ + Math.sin(s.orbitAng) * ORBIT_RADIUS;
      s.y = 1.2;
    } else if (s.movement === 'seek') {
      const near = nearestEnemyWithin(s, deps, 40);
      if (near) {
        const dx = near.x - s.x, dz = near.z - s.z, d = Math.hypot(dx, dz) || 1;
        const speed = Math.hypot(s.vx, s.vz) || 6;
        s.x += (dx / d) * speed * dt; s.z += (dz / d) * speed * dt;
      }
    }
    // stationary: terrain / dot-zone — no movement.

    // --- impact / periodic attack ---
    if (s.kind === 'projectile') {
      if (hitsPlayer(s)) {
        if (dist2(player.x, player.z, s.x, s.z) <= s.radius * s.radius) { resolveImpact(s, deps); s.hasImpacted = true; continue; }
      } else {
        const hit = nearestEnemyWithin(s, deps, s.radius);
        if (hit) { resolveImpact(s, deps, hit.id); s.hasImpacted = true; continue; }
      }
    } else {
      // summon / terrain — periodic radius pulse on its timer.
      if (deps.nowMs >= s.nextHitAt) {
        s.nextHitAt = deps.nowMs + 600;
        if (s.damage.amount > 0) {
          if (hitsPlayer(s)) {
            if (dist2(player.x, player.z, s.x, s.z) <= s.radius * s.radius) deps.damagePlayer(s.damage.amount);
          } else {
            resolveImpact(s, deps); // AoE on enemies (does not consume the summon)
          }
        }
      }
    }
  }
}
