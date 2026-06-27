import type { StageBalanceProfile } from '../../types/stageBalanceTypes';
import { SEED_STAGES } from '../campaigns/stageDefinitions';

const FIRST_THREE_BALANCE_PROFILES: Record<string, StageBalanceProfile> = {
  stage_sunny_harbor_emergency: {
    id: 'balance_stage_sunny_harbor_emergency',
    stageId: 'stage_sunny_harbor_emergency',
    difficultyRating: 1,
    enemyBudget: { maxActiveEnemies: 1, maxTotalEnemies: 2, maxEliteEnemies: 0, maxTurrets: 0, maxSummoners: 0 },
    combatBudget: { expectedDamageTaken: 18, recommendedPlayerPower: 80, supportUsageExpected: 1, ultimateUsageExpected: 0 },
    resourceBudget: { supplyStations: 1, repairStations: 1, supportBeacons: 0, energyPickups: 1 },
    objectiveBudget: { requiredObjectives: 4, optionalObjectives: 0, maxConcurrentObjectives: 1 },
    failRisk: { timeLimitRisk: 'none', enemyPressureRisk: 'low', navigationRisk: 'low' },
    editorMeta: { notes: 'Batch N tutorial budget: one active enemy and one repair station.' },
  },
  stage_downtown_traffic_collapse: {
    id: 'balance_stage_downtown_traffic_collapse',
    stageId: 'stage_downtown_traffic_collapse',
    difficultyRating: 2,
    enemyBudget: { maxActiveEnemies: 4, maxTotalEnemies: 6, maxEliteEnemies: 0, maxTurrets: 1, maxSummoners: 0 },
    combatBudget: { expectedDamageTaken: 45, recommendedPlayerPower: 125, supportUsageExpected: 1, ultimateUsageExpected: 0 },
    resourceBudget: { supplyStations: 1, repairStations: 1, supportBeacons: 1, energyPickups: 2 },
    objectiveBudget: { requiredObjectives: 3, optionalObjectives: 0, maxConcurrentObjectives: 2 },
    failRisk: { timeLimitRisk: 'none', enemyPressureRisk: 'medium', navigationRisk: 'low' },
    editorMeta: { notes: 'Batch N defense/control budget: shield lesson plus small evacuation wave.' },
  },
  stage_factory_core_breakdown: {
    id: 'balance_stage_factory_core_breakdown',
    stageId: 'stage_factory_core_breakdown',
    difficultyRating: 3,
    enemyBudget: { maxActiveEnemies: 3, maxTotalEnemies: 6, maxEliteEnemies: 1, maxTurrets: 0, maxSummoners: 1 },
    combatBudget: { expectedDamageTaken: 68, recommendedPlayerPower: 170, supportUsageExpected: 2, ultimateUsageExpected: 0 },
    resourceBudget: { supplyStations: 1, repairStations: 2, supportBeacons: 1, energyPickups: 2 },
    objectiveBudget: { requiredObjectives: 3, optionalObjectives: 0, maxConcurrentObjectives: 2 },
    failRisk: { timeLimitRisk: 'none', enemyPressureRisk: 'medium', navigationRisk: 'medium' },
    editorMeta: { notes: 'Batch N scan/repair budget: support enemy lesson, hazard core, single mini elite.' },
  },
};

export const SEED_STAGE_BALANCE_PROFILES: StageBalanceProfile[] = SEED_STAGES.map((stage): StageBalanceProfile => {
  const authored = FIRST_THREE_BALANCE_PROFILES[stage.id];
  if (authored) return authored;
  const difficulty = stage.editorMeta?.difficultyRating ?? 1;
  return {
    id: `balance_${stage.id}`,
    stageId: stage.id,
    difficultyRating: difficulty,
    enemyBudget: {
      maxActiveEnemies: 3 + difficulty,
      maxTotalEnemies: 6 + difficulty * 3,
      maxEliteEnemies: difficulty >= 4 ? 2 : difficulty >= 3 ? 1 : 0,
      maxTurrets: difficulty >= 2 ? 3 : 1,
      maxSummoners: difficulty >= 3 ? 2 : 0,
    },
    combatBudget: {
      expectedDamageTaken: 20 + difficulty * 16,
      recommendedPlayerPower: 80 + difficulty * 35,
      supportUsageExpected: stage.requiredSystems.support ? Math.max(1, difficulty - 1) : 0,
      ultimateUsageExpected: stage.requiredSystems.boss ? 1 : difficulty >= 4 ? 1 : 0,
    },
    resourceBudget: {
      supplyStations: difficulty >= 4 ? 2 : 1,
      repairStations: stage.requiredSystems.incidents ? 1 : 0,
      supportBeacons: stage.requiredSystems.support ? 1 : 0,
      energyPickups: 1 + Math.floor(difficulty / 2),
    },
    objectiveBudget: {
      requiredObjectives: stage.objectiveIds.length,
      optionalObjectives: 0,
      maxConcurrentObjectives: Math.min(3, Math.max(1, stage.objectiveIds.length)),
    },
    failRisk: {
      timeLimitRisk: stage.failRules.some((rule) => rule.type === 'time-limit') ? 'medium' : 'none',
      enemyPressureRisk: difficulty >= 4 ? 'high' : difficulty >= 2 ? 'medium' : 'low',
      navigationRisk: stage.stageIndex === 8 ? 'high' : difficulty >= 3 ? 'medium' : 'low',
    },
    editorMeta: { notes: `Batch I budget profile for ${stage.name}.` },
  };
});
