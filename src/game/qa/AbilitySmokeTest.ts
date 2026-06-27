import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { getCombatSkills, getSkillsForCharacter } from '../../stores/game/editorCombatStore';

const CORE_CHARACTER_IDS = ['char_jett', 'char_donnie', 'char_paul', 'char_chase', 'char_todd', 'char_flip', 'char_bello', 'char_jerome'];

export function runAbilitySmokeTest(): QACheck[] {
  const checks: QACheck[] = [];
  for (const characterId of CORE_CHARACTER_IDS) {
    const skills = getSkillsForCharacter(characterId);
    checks.push(makeSmokeCheck(`ability_${characterId}_has_skill`, `${characterId} has an enabled skill`, 'ability', skills.length > 0, `${characterId} has no enabled skill.`));
  }
  const allSkills = getCombatSkills();
  checks.push(makeSmokeCheck('ability_has_attack', 'At least one attack exists', 'ability', allSkills.some((skill) => skill.damageEvents?.length), 'No skill has damage events.'));
  checks.push(makeSmokeCheck('ability_has_ultimate', 'Ultimate or placeholder exists', 'ability', allSkills.some((skill) => skill.skillType === 'ultimate-placeholder' || skill.id.includes('ultimate')), 'No ultimate placeholder found.'));
  checks.push(makeSmokeCheck('ability_cooldown_sane', 'Cooldown and energy values are sane', 'ability', allSkills.every((skill) => (skill.cooldownSeconds ?? 0) >= 0 && (skill.energyCost ?? 0) >= 0), 'Skill cooldown or energy cost is invalid.'));
  return checks;
}
