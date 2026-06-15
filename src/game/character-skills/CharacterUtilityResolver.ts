import type { CombatSkillDefinition } from '../../types/game/combat';
import { liveTargets, useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import * as ObstacleDirector from '../obstacles/ObstacleDirector';

// Applies a kit skill's non-combat / stateful utility from its cast result (Batch D-kits). Tag-driven so it
// stays data-driven: scan → mark targets scanned/weakpoint-exposed; stun/restraint → stun hit enemies;
// repair → repair a hit Corrupted Device through ObstacleDirector; speed-gate → signal a zone area clear.
// Goes through the public director / zone-condition seams — never writes obstacle/zone internals directly.

const REPAIR_VALUE = 100;
const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export interface UtilityOutcome { scanned: string[]; stunned: string[]; repaired: string[]; speedGate: boolean; protect: boolean }

export function applyUtilityFromCast(skill: CombatSkillDefinition, hitIds: string[]): UtilityOutcome {
  const tags = new Set(skill.damageEvents?.flatMap((d) => d.attackTags) ?? []);
  const out: UtilityOutcome = { scanned: [], stunned: [], repaired: [], speedGate: false, protect: false };
  let changed = false;

  for (const id of hitIds) {
    const t = liveTargets.find((x) => x.id === id);
    if (!t) continue;
    if (tags.has('scan') || tags.has('reveal')) {
      t.scanned = true; t.weakpointExposed = true; out.scanned.push(id); changed = true;
    }
    if ((tags.has('stun') || tags.has('restraint')) && t.isEnemy) {
      (t.aiData ??= {}).stunUntil = nowS() + (skill.stunDurationSeconds ?? 2);
      out.stunned.push(id);
    }
    if (tags.has('repair') && t.isObstacle && t.obstacleId) {
      if (ObstacleDirector.repair(t.obstacleId, REPAIR_VALUE)) out.repaired.push(t.obstacleId);
    }
  }

  if (tags.has('speed-gate')) {
    useAdvancedMissionZoneStore.getState().recordAreaCleared('speed_gate');
    out.speedGate = true;
  }
  if (tags.has('protect')) out.protect = true;

  if (changed) useCombatTargetStore.getState().bump();
  return out;
}
