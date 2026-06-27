import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { getCombatSkills, getSkillsForCharacter } from '../../stores/game/editorCombatStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { applyDamageToTarget } from '../combat/CombatDirector';
import type { DamageEvent } from '../../types/game/combat';

export function runCombatSmokeTest(): QACheck[] {
  const skills = getCombatSkills().filter((skill) => skill.enabled !== false && (skill.faction ?? 'player') === 'player');
  const jettSkills = getSkillsForCharacter('char_jett');
  useCombatTargetStore.getState().reset();
  useCombatStore.getState().resetCombat();
  useCombatTargetStore.getState().spawn({
    id: 'qa_dummy_enemy',
    definitionId: 'combat_dummy_light',
    hp: 30,
    maxHp: 30,
    shield: 0,
    maxShield: 0,
    x: 0,
    y: 0,
    z: 0,
    defeatedAt: 0,
    isEnemy: true,
  });
  const event: DamageEvent = { id: 'qa_damage', sourceId: 'qa', sourceType: 'player', targetId: 'qa_dummy_enemy', targetType: 'dummy', amount: 10, damageType: 'impact', attackTags: ['qa'], hitPoint: [0, 0, 0] };
  applyDamageToTarget(event);
  const resultLogged = useCombatStore.getState().lastDamageResults.length > 0;
  useCombatTargetStore.getState().reset();
  return [
    makeSmokeCheck('combat_has_player_skills', 'Player skills are available', 'combat', skills.length > 0, 'No player combat skills are available.'),
    makeSmokeCheck('combat_jett_has_skill', 'Jett can cast at least one skill', 'combat', jettSkills.length > 0, 'Jett has no enabled skills.'),
    makeSmokeCheck('combat_damage_resolver', 'Damage resolver logs damage', 'combat', resultLogged, 'Damage event did not reach combat result log.'),
  ];
}
