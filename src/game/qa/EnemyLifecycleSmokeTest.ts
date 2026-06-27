import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { getEnemyDefs, getSpawnGroup } from '../../stores/game/editorCombatStore';
import { triggerEncounter, initializeEncounters, cleanupEncounters } from '../encounters/EncounterDirector';
import { getEncountersForStage } from '../../stores/useEncounterEditorStore';
import { liveTargets, useCombatTargetStore } from '../../stores/game/combatTargetStore';

export function runEnemyLifecycleSmokeTest(): QACheck[] {
  useCombatTargetStore.getState().reset();
  initializeEncounters('stage_sunny_harbor_emergency');
  const encounter = getEncountersForStage('stage_sunny_harbor_emergency')[0];
  const triggered = encounter ? triggerEncounter(encounter.id) : false;
  const spawned = liveTargets.some((target) => target.isEnemy);
  cleanupEncounters();
  useCombatTargetStore.getState().reset();
  return [
    makeSmokeCheck('enemy_roster_exists', 'Enemy roster exists', 'enemy', getEnemyDefs().length >= 12, 'Enemy roster has fewer than 12 entries.'),
    makeSmokeCheck('enemy_spawn_group_exists', 'Encounter spawn groups exist', 'enemy', !!encounter?.enemySpawnGroupIds.every((id) => getSpawnGroup(id)), 'Encounter references missing spawn group.'),
    makeSmokeCheck('enemy_encounter_triggers', 'Encounter trigger spawns enemies', 'enemy', triggered && spawned, 'Encounter did not spawn enemy targets.'),
  ];
}
