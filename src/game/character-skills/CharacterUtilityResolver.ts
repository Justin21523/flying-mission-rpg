import type { CombatSkillDefinition } from '../../types/game/combat';
import { liveTargets, useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import * as ObstacleDirector from '../obstacles/ObstacleDirector';
import { makeUtilityFeedback } from '../combat/CombatFeedbackClassifier';
import { applyStatusEffect } from '../combat/StatusEffectRuntime';
import { statusEffectsForSkill } from '../../stores/game/useStatusRuleStore';
import { triggerGameFeelFromFeedback } from '../feel/GameFeelDirector';
import { tryTriggerReaction, type ReactionDeps } from '../combat/ElementReactionRuntime';
import { damageTargetByTemplate, damageTargetsInRadius } from '../combat/CombatDirector';
import { playEffect } from '../combat/effects/CombatEffectDirector';

// Applies a kit skill's non-combat / stateful utility from its cast result (Batch D-kits). Tag-driven so it
// stays data-driven: scan → mark targets scanned/weakpoint-exposed; stun/restraint → stun hit enemies;
// repair → repair a hit Corrupted Device through ObstacleDirector; speed-gate → signal a zone area clear.
// Goes through the public director / zone-condition seams — never writes obstacle/zone internals directly.

const REPAIR_VALUE = 100;
const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Wave 1 — deps for the element-reaction runtime (damage/AoE/VFX injected to avoid an import cycle).
function reactionDeps(): ReactionDeps {
  return {
    nowMs: nowMs(),
    damageTarget: (id, tpl) => damageTargetByTemplate(id, tpl),
    damageInRadius: (x, z, r, tpl) => damageTargetsInRadius(x, z, r, tpl),
    playEffect: (effectId, _id, x, y, z) => playEffect(effectId, { skillInstanceId: `rxn_${Math.round(nowMs())}`, x, y, z, headingRad: 0 }),
  };
}

function emitUtilityFeedback(kind: 'scan-exposed' | 'stunned' | 'repair' | 'boss-weakpoint-exposed', targetId: string | undefined, skillId: string): void {
  const event = makeUtilityFeedback(kind, targetId, skillId);
  useCombatStore.getState().pushFeedbackEvent(event);
  triggerGameFeelFromFeedback(event);
}

export interface UtilityOutcome { scanned: string[]; stunned: string[]; repaired: string[]; speedGate: boolean; protect: boolean }

export function applyUtilityFromCast(skill: CombatSkillDefinition, hitIds: string[]): UtilityOutcome {
  const tags = utilityTagsForSkill(skill);
  const out: UtilityOutcome = { scanned: [], stunned: [], repaired: [], speedGate: false, protect: false };
  let changed = false;

  // Batch O — elemental/control status from the skill's damageType + attack tags (editable rules).
  const dmgTypes = new Set(skill.damageEvents?.map((d) => d.damageType) ?? []);
  const statusEffects = statusEffectsForSkill(dmgTypes, tags);

  for (const id of hitIds) {
    const t = liveTargets.find((x) => x.id === id);
    if (!t) continue;
    if (t.isEnemy && statusEffects.length > 0) {
      const deps = reactionDeps();
      for (const eff of statusEffects) {
        applyStatusEffect(id, eff, skill.id);
        tryTriggerReaction(id, eff, skill.id, deps); // Wave 1 — element reaction on compatible existing status
      }
      changed = true;
    }
    if (tags.has('scan') || tags.has('reveal')) {
      applyStatusEffect(id, 'scanned', skill.id, { durationMs: (skill.durationSeconds ?? 5) * 1000 });
      applyStatusEffect(id, 'weakpoint-exposed', skill.id, { durationMs: (skill.durationSeconds ?? 4) * 1000 });
      out.scanned.push(id);
      emitUtilityFeedback(t.isBossWeakpoint ? 'boss-weakpoint-exposed' : 'scan-exposed', id, skill.id);
      changed = true;
    }
    if ((tags.has('stun') || tags.has('restraint')) && t.isEnemy) {
      (t.aiData ??= {}).stunUntil = nowS() + (skill.stunDurationSeconds ?? 2);
      applyStatusEffect(id, 'stunned', skill.id, { durationMs: (skill.stunDurationSeconds ?? 2) * 1000 });
      out.stunned.push(id);
      emitUtilityFeedback('stunned', id, skill.id);
    }
    if (tags.has('repair') && t.isObstacle && t.obstacleId) {
      if (ObstacleDirector.repair(t.obstacleId, REPAIR_VALUE)) {
        out.repaired.push(t.obstacleId);
        emitUtilityFeedback('repair', t.obstacleId, skill.id);
      }
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

function utilityTagsForSkill(skill: CombatSkillDefinition): Set<string> {
  const tags = new Set(skill.damageEvents?.flatMap((d) => d.attackTags) ?? []);
  const text = `${skill.id} ${skill.name} ${skill.description ?? ''}`.toLowerCase();
  if (text.includes('scan') || text.includes('reveal') || text.includes('weakpoint')) {
    tags.add('scan');
    tags.add('reveal');
  }
  if (text.includes('stun') || text.includes('cuff') || text.includes('restraint')) tags.add('stun');
  if (text.includes('repair') || skill.damageEvents?.some((event) => event.damageType === 'repair')) tags.add('repair');
  if (text.includes('protect') || text.includes('shield')) tags.add('protect');
  return tags;
}
