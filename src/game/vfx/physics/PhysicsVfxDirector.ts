import { create } from 'zustand';
import type { PhysicsVfxObjectDefinition, PhysicsVfxShape, PhysicsVfxCollisionBehavior } from '../../../types/physicsVfxTypes';
import { acquire, release, activeCount, resetPool } from './PhysicsVfxObjectPool';

// Lightweight KINEMATIC physics VFX runtime (Batch F.6) — pooled analytic objects (pos/vel/gravity/bounce/
// scatter/assemble/orbit + lifetime fade). NOT rapier rigid bodies. Rendered by PhysicsVfxLayer; ticked each
// frame. Gameplay (damage / blocker) is handled by the existing combatSpawnStore — these are the VISUAL layer.

export interface PhysicsVfxObject {
  id: string;
  type: PhysicsVfxObjectDefinition['objectType'];
  shape: PhysicsVfxShape;
  color: string;
  modelAssetId?: string;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  rotX: number; rotY: number; rotZ: number;
  angVx: number; angVy: number; angVz: number;
  size: number;
  bornSec: number;
  lifeSec: number;
  fadeOutSec: number;
  gravityScale: number;
  restitution: number;
  friction: number;
  damping: number;
  behavior: PhysicsVfxCollisionBehavior;
  cx: number; cy: number; cz: number; // origin (orbit/assemble center)
  orbitAng: number; orbitRadius: number;
  opacity: number;
}

export const livePhysicsObjects: PhysicsVfxObject[] = [];
let uid = 0;
const nowSec = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

interface PhysStore { version: number; bump: () => void }
export const usePhysicsVfxStore = create<PhysStore>((set, get) => ({ version: 0, bump: () => set({ version: get().version + 1 }) }));

export interface PhysicsSpawnContext {
  x: number; y: number; z: number;
  dirX: number; dirZ: number;
  casterId?: string;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function spawn(def: PhysicsVfxObjectDefinition, ctx: PhysicsSpawnContext): boolean {
  const count = Math.max(1, def.spawn.count);
  if (!acquire(count)) return false;
  const t = nowSec();
  const [smin, smax] = def.spawn.initialSpeedRange;
  const [szmin, szmax] = def.spawn.sizeRange ?? [0.3, 0.5];
  const radius = def.spawn.spreadRadius ?? 2;
  const behavior = def.physics.behavior ?? 'debris';
  for (let i = 0; i < count; i++) {
    const speed = rand(smin, smax);
    let dx = ctx.dirX, dz = ctx.dirZ, dy = 0.4;
    const ang = (i / count) * Math.PI * 2;
    switch (def.spawn.spreadShape) {
      case 'cone': { const a = rand(-0.5, 0.5); dx = ctx.dirX * Math.cos(a) - ctx.dirZ * Math.sin(a); dz = ctx.dirX * Math.sin(a) + ctx.dirZ * Math.cos(a); dy = rand(0.3, 0.9); break; }
      case 'sphere': { const phi = rand(0, Math.PI), th = rand(0, Math.PI * 2); dx = Math.sin(phi) * Math.cos(th); dz = Math.sin(phi) * Math.sin(th); dy = Math.cos(phi); break; }
      case 'ring': { dx = Math.cos(ang); dz = Math.sin(ang); dy = 0.2; break; }
      case 'line': { dx = ctx.dirX; dz = ctx.dirZ; dy = 0; break; }
      case 'box': { dx = rand(-1, 1); dz = rand(-1, 1); dy = rand(0, 1); break; }
      default: break; // point
    }
    const o: PhysicsVfxObject = {
      id: `pvfx_${uid++}`,
      type: def.objectType, shape: def.shape, color: def.color ?? '#cccccc', modelAssetId: def.modelPresetId,
      x: ctx.x + (def.spawn.spreadShape === 'ring' ? Math.cos(ang) * radius : 0),
      y: ctx.y + 0.4,
      z: ctx.z + (def.spawn.spreadShape === 'ring' ? Math.sin(ang) * radius : 0),
      vx: dx * speed, vy: dy * speed, vz: dz * speed,
      rotX: rand(0, Math.PI), rotY: rand(0, Math.PI), rotZ: rand(0, Math.PI),
      angVx: rand(-(def.spawn.angularSpeedRange?.[1] ?? 3), def.spawn.angularSpeedRange?.[1] ?? 3),
      angVy: rand(-3, 3), angVz: rand(-3, 3),
      size: rand(szmin, szmax),
      bornSec: t, lifeSec: def.physics.lifetimeSeconds, fadeOutSec: def.cleanup.fadeOutSeconds,
      gravityScale: def.physics.gravityScale ?? 1, restitution: def.physics.restitution ?? 0.3,
      friction: def.physics.friction ?? 0.4, damping: def.physics.linearDamping ?? 0.05,
      behavior,
      cx: ctx.x, cy: ctx.y, cz: ctx.z, orbitAng: ang, orbitRadius: radius, opacity: 1,
    };
    if (behavior === 'shield-panels' || behavior === 'assemble') { o.x = ctx.x + Math.cos(ang) * radius; o.z = ctx.z + Math.sin(ang) * radius; o.vx = 0; o.vz = 0; o.vy = 0; o.y = ctx.y + 1; }
    livePhysicsObjects.push(o);
  }
  usePhysicsVfxStore.getState().bump();
  return true;
}

const GRAV = 14;

export function update(dt: number): void {
  const t = nowSec();
  let removed = 0;
  for (let i = livePhysicsObjects.length - 1; i >= 0; i--) {
    const o = livePhysicsObjects[i];
    const age = t - o.bornSec;
    if (age >= o.lifeSec) { livePhysicsObjects.splice(i, 1); removed++; continue; }
    // fade in the last fadeOut window.
    o.opacity = age > o.lifeSec - o.fadeOutSec ? Math.max(0, (o.lifeSec - age) / Math.max(0.01, o.fadeOutSec)) : 1;

    if (o.behavior === 'orbit') {
      o.orbitAng += dt * 2;
      o.x = o.cx + Math.cos(o.orbitAng) * o.orbitRadius;
      o.z = o.cz + Math.sin(o.orbitAng) * o.orbitRadius;
      o.y = o.cy + 1 + Math.sin(o.orbitAng * 2) * 0.4;
    } else if (o.behavior === 'assemble') {
      // ease toward the center + assemble height.
      o.x += (o.cx - o.x) * Math.min(1, dt * 4);
      o.z += (o.cz - o.z) * Math.min(1, dt * 4);
      o.y += (o.cy + 1.2 - o.y) * Math.min(1, dt * 4);
    } else if (o.behavior === 'shield-panels') {
      o.rotY += dt * 0.4;
    } else {
      // ballistic: gravity + bounce on the ground.
      o.vy -= GRAV * o.gravityScale * dt;
      o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt;
      if (o.y <= 0) {
        o.y = 0;
        o.vy = -o.vy * o.restitution;
        o.vx *= 1 - o.friction; o.vz *= 1 - o.friction;
        if (Math.abs(o.vy) < 0.6) o.vy = 0;
      }
      o.vx *= 1 - o.damping * dt; o.vz *= 1 - o.damping * dt;
      o.rotX += o.angVx * dt; o.rotY += o.angVy * dt; o.rotZ += o.angVz * dt;
    }
  }
  if (removed) { release(removed); usePhysicsVfxStore.getState().bump(); }
}

export function cleanupForCaster(): void {
  // Per-object caster tracking isn't kept (these are short-lived visual objects); clear all live VFX objects.
  cleanupAll();
}

export function cleanupAll(): void {
  const n = livePhysicsObjects.length;
  livePhysicsObjects.length = 0;
  release(n);
  resetPool();
  usePhysicsVfxStore.getState().bump();
}

export function physicsActiveCount(): number {
  return activeCount();
}
