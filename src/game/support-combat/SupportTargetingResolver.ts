import type { SupportTargetingDefinition } from '../../types/game/supportCombat';
import type { CombatTarget } from '../../stores/game/combatTargetStore';

// Pure target resolution for support abilities (Batch E). Filters live combat targets by type + tags +
// range shape, then orders by the ability's targetPriority. Returns a primary target, the full affected set
// (for group/area effects), and a world center for placing the effect. No store reads — candidates passed in.

export interface TargetingContext {
  playerX: number;
  playerZ: number;
  headingRad: number;
  candidates: CombatTarget[];
  manualTargetId?: string;
  validTargetTags?: string[];
  invalidTargetTags?: string[];
}

export interface TargetingResult {
  primaryId?: string;
  targetIds: string[];
  center: { x: number; z: number };
}

// Derive coarse tags from a live target so ability valid/invalidTargetTags can filter without a tag column.
export function targetTags(t: CombatTarget): string[] {
  const tags: string[] = [];
  if (t.isEnemy) tags.push('enemy');
  if (t.archetype) tags.push(t.archetype);
  if (t.isObstacle) tags.push('obstacle', 'device');
  if ((t.shield ?? 0) > 0) tags.push('shielded');
  if (t.scanned) tags.push('scanned');
  return tags;
}

function matchesType(t: CombatTarget, targetType: string): boolean {
  switch (targetType) {
    case 'enemy':
    case 'enemy-group':
      return !!t.isEnemy;
    case 'obstacle':
    case 'device':
      return !!t.isObstacle;
    case 'area':
      return !!t.isEnemy || !!t.isObstacle;
    default:
      return false;
  }
}

function passesTags(t: CombatTarget, valid?: string[], invalid?: string[]): boolean {
  const tags = targetTags(t);
  if (invalid && invalid.some((x) => tags.includes(x))) return false;
  if (valid && valid.length > 0 && !valid.some((x) => tags.includes(x))) return false;
  return true;
}

function dist2(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx, dz = az - bz;
  return dx * dx + dz * dz;
}

function withinShape(t: SupportTargetingDefinition, target: CombatTarget, ctx: TargetingContext): boolean {
  const range = t.maxRange ?? t.radius ?? 12;
  const d2 = dist2(ctx.playerX, ctx.playerZ, target.x, target.z);
  if (d2 > range * range) return false;
  if (t.rangeShape === 'cone') {
    const ang = Math.atan2(target.x - ctx.playerX, target.z - ctx.playerZ);
    let diff = Math.abs(ang - ctx.headingRad);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    const half = ((t.angleDegrees ?? 60) * Math.PI) / 180 / 2;
    if (diff > half) return false;
  }
  return true;
}

function orderByPriority(pool: CombatTarget[], priority: string | undefined, ctx: TargetingContext): CombatTarget[] {
  const byDist = (a: CombatTarget, b: CombatTarget) =>
    dist2(ctx.playerX, ctx.playerZ, a.x, a.z) - dist2(ctx.playerX, ctx.playerZ, b.x, b.z);
  switch (priority) {
    case 'lowest-hp':
      return [...pool].sort((a, b) => a.hp - b.hp);
    case 'shielded':
      return [...pool].sort((a, b) => (b.shield ?? 0) - (a.shield ?? 0) || byDist(a, b));
    case 'scanned':
      return [...pool].sort((a, b) => Number(!!b.scanned) - Number(!!a.scanned) || byDist(a, b));
    case 'highest-threat':
      return [...pool].sort((a, b) => b.hp - a.hp || byDist(a, b));
    case 'objective-linked':
      return [...pool].sort((a, b) => Number(!!b.obstacleId || !!b.segmentAreaId) - Number(!!a.obstacleId || !!a.segmentAreaId) || byDist(a, b));
    case 'nearest':
    default:
      return [...pool].sort(byDist);
  }
}

export function resolveTargets(t: SupportTargetingDefinition, ctx: TargetingContext): TargetingResult {
  if (t.targetType === 'player') {
    return { primaryId: 'player', targetIds: ['player'], center: { x: ctx.playerX, z: ctx.playerZ } };
  }

  const alive = ctx.candidates.filter((c) => !c.defeatedAt);
  const pool = alive.filter((c) => matchesType(c, t.targetType) && passesTags(c, ctx.validTargetTags, ctx.invalidTargetTags) && withinShape(t, c, ctx));

  // Manual selection takes precedence when it resolves into the pool.
  const manual = ctx.manualTargetId ? pool.find((c) => c.id === ctx.manualTargetId) : undefined;
  const ordered = orderByPriority(pool, t.targetPriority, ctx);
  const primary = manual ?? ordered[0];

  if (!primary) {
    // Area abilities can still place an effect at the player even with no target in range.
    if (t.targetType === 'area') return { targetIds: [], center: { x: ctx.playerX, z: ctx.playerZ } };
    return { targetIds: [], center: { x: ctx.playerX, z: ctx.playerZ } };
  }

  const groupLike = t.targetType === 'enemy-group' || t.targetType === 'area' || t.rangeShape !== 'single';
  if (groupLike) {
    const r = t.radius ?? t.maxRange ?? 6;
    const center = t.targetType === 'area' ? { x: primary.x, z: primary.z } : { x: ctx.playerX, z: ctx.playerZ };
    const ids = pool.filter((c) => dist2(center.x, center.z, c.x, c.z) <= r * r).map((c) => c.id);
    return { primaryId: primary.id, targetIds: ids.length ? ids : [primary.id], center };
  }

  return { primaryId: primary.id, targetIds: [primary.id], center: { x: primary.x, z: primary.z } };
}
