import type { EliteEncounterDefinition } from '../../types/game/boss';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { spawnEnemyFromDef } from '../combat/enemyRuntime';
import { getElite } from '../../stores/game/useBossEditorStore';
import { liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';

// Elite encounters (Batch F) — a beefed-up Batch C archetype enemy (mini-boss placeholder). Reuses
// spawnEnemyFromDef then scales hp/shield + stun-on-shield-break. No new enemy runtime.
let eliteUid = 0;
const liveElites = new Map<string, { def: EliteEncounterDefinition; targetId: string }>();

export function startElite(eliteId: string, x: number, z: number): CombatTarget | null {
  const elite = getElite(eliteId);
  if (!elite || elite.enabled === false) return null;
  const enemyDef = getEnemyDef(elite.baseEnemyDefinitionId);
  if (!enemyDef) return null;
  const t = spawnEnemyFromDef(enemyDef, x, z);
  t.maxHp = Math.round(enemyDef.maxHp * elite.hpMultiplier);
  t.hp = t.maxHp;
  const baseShield = enemyDef.maxShield ?? enemyDef.shield?.shieldHp ?? 0;
  t.maxShield = Math.round(baseShield * elite.shieldMultiplier);
  t.shield = t.maxShield;
  t.scale = (enemyDef.scale ?? 1) * 1.4;
  const instId = `elite_${eliteUid++}`;
  liveElites.set(instId, { def: elite, targetId: t.id });
  return t;
}

// An elite instance is cleared when its target is defeated/removed; the encounter is clear when all are.
export function isEliteCleared(): boolean {
  if (liveElites.size === 0) return false;
  return [...liveElites.values()].every(({ targetId }) => {
    const t = liveTargets.find((x) => x.id === targetId);
    return !t || t.defeatedAt > 0;
  });
}

export function activeElites(): { instId: string; def: EliteEncounterDefinition; targetId: string }[] {
  return [...liveElites.entries()].map(([instId, v]) => ({ instId, ...v }));
}

export function reset(): void {
  liveElites.clear();
  eliteUid = 0;
}
