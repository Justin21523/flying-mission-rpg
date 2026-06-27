export type StageBalanceProfile = {
  id: string;
  stageId: string;
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  enemyBudget: {
    maxActiveEnemies: number;
    maxTotalEnemies: number;
    maxEliteEnemies: number;
    maxTurrets: number;
    maxSummoners: number;
  };
  combatBudget: {
    expectedDamageTaken: number;
    recommendedPlayerPower: number;
    supportUsageExpected: number;
    ultimateUsageExpected: number;
  };
  resourceBudget: {
    supplyStations: number;
    repairStations: number;
    supportBeacons: number;
    energyPickups: number;
  };
  objectiveBudget: {
    requiredObjectives: number;
    optionalObjectives: number;
    maxConcurrentObjectives: number;
  };
  failRisk: {
    timeLimitRisk: 'none' | 'low' | 'medium' | 'high';
    enemyPressureRisk: 'low' | 'medium' | 'high';
    navigationRisk: 'low' | 'medium' | 'high';
  };
  editorMeta?: {
    notes?: string;
  };
};

export type StageBalanceFinding = {
  severity: 'info' | 'warning' | 'fatal';
  stageId: string;
  message: string;
};
