import type { StageBalanceFinding } from '../../types/stageBalanceTypes';
import type { StageDefinition } from '../../types/stageTypes';
import { useEditorSpawnGroupStore } from '../../stores/game/editorCombatStore';
import { useEncounterPackStore, useEnemyEncounterStore } from '../../stores/useEncounterEditorStore';
import { getStageBalanceProfile } from '../../stores/useStageContentEditorStore';

export function countStageEnemies(stage: StageDefinition): { total: number; maxActive: number; elites: number; turrets: number; summoners: number } {
  const packIds = new Set(stage.encounterPackIds);
  const encounterIds = useEncounterPackStore.getState().items.filter((pack) => packIds.has(pack.id)).flatMap((pack) => pack.encounterIds);
  const groups = useEnemyEncounterStore.getState().items
    .filter((encounter) => encounterIds.includes(encounter.id))
    .flatMap((encounter) => encounter.enemySpawnGroupIds)
    .map((id) => useEditorSpawnGroupStore.getState().items.find((group) => group.id === id))
    .filter(Boolean);
  let total = 0;
  let maxActive = 0;
  let elites = 0;
  let turrets = 0;
  let summoners = 0;
  for (const group of groups) {
    const groupTotal = group!.enemies.reduce((sum, enemy) => sum + enemy.count, 0);
    total += groupTotal;
    maxActive = Math.max(maxActive, groupTotal);
    for (const enemy of group!.enemies) {
      if (enemy.enemyDefinitionId.includes('elite') || enemy.enemyDefinitionId.includes('quake')) elites += enemy.count;
      if (enemy.enemyDefinitionId.includes('turret') || enemy.enemyDefinitionId.includes('sniper')) turrets += enemy.count;
      if (enemy.enemyDefinitionId.includes('spawner')) summoners += enemy.count;
    }
  }
  return { total, maxActive, elites, turrets, summoners };
}

export function analyzeEncounterBudget(stage: StageDefinition): StageBalanceFinding[] {
  const profile = getStageBalanceProfile(stage.id);
  if (!profile) return [{ severity: 'fatal', stageId: stage.id, message: 'Missing stage balance profile.' }];
  const counts = countStageEnemies(stage);
  const findings: StageBalanceFinding[] = [];
  if (counts.maxActive > profile.enemyBudget.maxActiveEnemies) findings.push({ severity: 'warning', stageId: stage.id, message: `Max active enemies ${counts.maxActive} exceeds budget ${profile.enemyBudget.maxActiveEnemies}.` });
  if (counts.total > profile.enemyBudget.maxTotalEnemies) findings.push({ severity: 'warning', stageId: stage.id, message: `Total enemies ${counts.total} exceeds budget ${profile.enemyBudget.maxTotalEnemies}.` });
  if (counts.elites > profile.enemyBudget.maxEliteEnemies) findings.push({ severity: 'warning', stageId: stage.id, message: `Elite enemies ${counts.elites} exceeds budget ${profile.enemyBudget.maxEliteEnemies}.` });
  if (counts.turrets > profile.enemyBudget.maxTurrets) findings.push({ severity: 'warning', stageId: stage.id, message: `Turrets/snipers ${counts.turrets} exceeds budget ${profile.enemyBudget.maxTurrets}.` });
  if (counts.summoners > profile.enemyBudget.maxSummoners) findings.push({ severity: 'warning', stageId: stage.id, message: `Summoners ${counts.summoners} exceeds budget ${profile.enemyBudget.maxSummoners}.` });
  return findings;
}
