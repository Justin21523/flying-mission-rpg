export type QASeverity = 'error' | 'warning' | 'info';
export type QAStatus = 'pass' | 'warning' | 'fail';

export type QAFinding = {
  id: string;
  severity: QASeverity;
  message: string;
  system: string;
  detail?: string;
};

export type QACheck = {
  id: string;
  label: string;
  status: QAStatus;
  system: string;
  findings: QAFinding[];
};

export type ReleaseCandidateChecklist = {
  app: {
    appStarts: boolean;
    noBlockingConsoleErrors: boolean;
    demoLandingLoads: boolean;
  };
  campaign: {
    campaignMapLoads: boolean;
    stage1Unlocked: boolean;
    stageSelectWorks: boolean;
    stageBriefingWorks: boolean;
    stageClearUnlocksNext: boolean;
  };
  gameplay: {
    canStartStage1: boolean;
    canReachGameplay: boolean;
    canUseBasicAttack: boolean;
    canResolveIncident: boolean;
    canDefeatEnemy: boolean;
    canClearObstacle: boolean;
    canCompleteStage: boolean;
  };
  systems: {
    combatRuntimeStable: boolean;
    vfxCleanupWorks: boolean;
    enemyCleanupWorks: boolean;
    incidentRuntimeStable: boolean;
    bossRuntimeStable: boolean;
    supportRuntimeStable: boolean;
  };
  editor: {
    editModeOpens: boolean;
    validationPanelWorks: boolean;
    canApplySafeDraft: boolean;
    invalidDraftBlocked: boolean;
  };
  performance: {
    activeVfxUnderBudget: boolean;
    activePhysicsObjectsUnderBudget: boolean;
    noObviousMemoryLeak: boolean;
  };
  build: {
    typecheckPass: boolean;
    lintPass: boolean;
    testsPass: boolean;
    buildPass: boolean;
  };
};

export type ReleaseCandidateReport = {
  status: QAStatus;
  generatedAt: string;
  checklist: ReleaseCandidateChecklist;
  checks: QACheck[];
  p0Blockers: QAFinding[];
  p1Warnings: QAFinding[];
  p2Info: QAFinding[];
};

export const EMPTY_RELEASE_CANDIDATE_CHECKLIST: ReleaseCandidateChecklist = {
  app: { appStarts: false, noBlockingConsoleErrors: false, demoLandingLoads: false },
  campaign: { campaignMapLoads: false, stage1Unlocked: false, stageSelectWorks: false, stageBriefingWorks: false, stageClearUnlocksNext: false },
  gameplay: { canStartStage1: false, canReachGameplay: false, canUseBasicAttack: false, canResolveIncident: false, canDefeatEnemy: false, canClearObstacle: false, canCompleteStage: false },
  systems: { combatRuntimeStable: false, vfxCleanupWorks: false, enemyCleanupWorks: false, incidentRuntimeStable: false, bossRuntimeStable: false, supportRuntimeStable: false },
  editor: { editModeOpens: false, validationPanelWorks: false, canApplySafeDraft: false, invalidDraftBlocked: false },
  performance: { activeVfxUnderBudget: false, activePhysicsObjectsUnderBudget: false, noObviousMemoryLeak: false },
  build: { typecheckPass: false, lintPass: false, testsPass: false, buildPass: false },
};

export function makeQACheck(id: string, label: string, system: string, pass: boolean, finding?: QAFinding): QACheck {
  return { id, label, system, status: pass ? 'pass' : finding?.severity === 'warning' ? 'warning' : 'fail', findings: finding ? [finding] : [] };
}

export function summarizeQAStatus(checks: QACheck[]): QAStatus {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  return 'pass';
}
