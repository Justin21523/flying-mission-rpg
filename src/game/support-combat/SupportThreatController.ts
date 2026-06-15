import { spawnCombat } from '../../stores/game/combatSpawnStore';

// Taunt / Decoy redirect (Batch E). Enemy AI has no aggro table — it steers toward the player position the
// host passes into stepEnemyAi. This module holds a module-level threat override (mirrors aiData.stunUntil):
// while a decoy is live, CombatEnemyAiHost substitutes the decoy position as the steer/aim target for the
// tainted enemies, then reverts when it expires. The decoy is also a model-first combatSpawn for the visual.

export interface DecoyState {
  id: string;
  x: number;
  z: number;
  hp: number;
  until: number; // seconds
  spawnId?: string;
}

const decoys = new Map<string, DecoyState>();
const overrides = new Map<string, { decoyId: string; until: number }>();
let decoyCounter = 0;

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

// Spawn a decoy at `center`, redirect the given enemies to it for `seconds`. Returns the decoy id.
export function applyTaunt(enemyIds: string[], center: { x: number; z: number }, seconds: number, hp = 60, modelAssetId?: string): string {
  const id = `decoy_${decoyCounter++}`;
  const until = nowS() + seconds;
  let spawnId: string | undefined;
  if (modelAssetId !== undefined) {
    const sp = spawnCombat({
      kind: 'summon', faction: 'player', modelAssetId,
      x: center.x, y: 0, z: center.z, dirX: 0, dirZ: 1, speed: 0, movement: 'stationary',
      lifetimeSeconds: seconds, radius: 1, color: '#a5f3fc',
      damage: { amount: 0, damageType: 'impact', attackTags: ['decoy'] },
    });
    spawnId = sp.id;
  }
  decoys.set(id, { id, x: center.x, z: center.z, hp, until, spawnId });
  for (const eid of enemyIds) overrides.set(eid, { decoyId: id, until });
  return id;
}

// Where should this enemy steer/aim? The decoy position if it is taunted + the decoy is still live.
export function getDecoyTargetFor(enemyId: string): { x: number; z: number } | undefined {
  const o = overrides.get(enemyId);
  if (!o) return undefined;
  const d = decoys.get(o.decoyId);
  if (!d || o.until < nowS()) { overrides.delete(enemyId); return undefined; }
  return { x: d.x, z: d.z };
}

export function isTaunted(enemyId: string): boolean {
  return getDecoyTargetFor(enemyId) !== undefined;
}

export function damageDecoy(decoyId: string, amount: number): void {
  const d = decoys.get(decoyId);
  if (d) d.hp = Math.max(0, d.hp - amount);
}

export function activeDecoys(): DecoyState[] {
  return [...decoys.values()];
}

// Remove expired / destroyed decoys + their dangling overrides.
export function clearExpired(now = nowS()): void {
  for (const [id, d] of decoys) {
    if (d.until < now || d.hp <= 0) {
      decoys.delete(id);
      for (const [eid, o] of overrides) if (o.decoyId === id) overrides.delete(eid);
    }
  }
}

export function reset(): void {
  decoys.clear();
  overrides.clear();
  decoyCounter = 0;
}
