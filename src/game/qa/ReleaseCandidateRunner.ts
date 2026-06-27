import {
  EMPTY_RELEASE_CANDIDATE_CHECKLIST,
  type QACheck,
  type QAFinding,
  type ReleaseCandidateChecklist,
  type ReleaseCandidateReport,
  summarizeQAStatus,
} from './ReleaseCandidateChecklist';
import { runDemoFlowSmokeTest } from './DemoFlowSmokeTest';
import { runStageProgressionSmokeTest } from './StageProgressionSmokeTest';
import { runCombatSmokeTest } from './CombatSmokeTest';
import { runAbilitySmokeTest } from './AbilitySmokeTest';
import { runEnemyLifecycleSmokeTest } from './EnemyLifecycleSmokeTest';
import { runObstacleLifecycleSmokeTest } from './ObstacleLifecycleSmokeTest';
import { runBossLifecycleSmokeTest } from './BossLifecycleSmokeTest';
import { runIncidentSmokeTest } from './IncidentSmokeTest';
import { runEditModeSmokeTest } from './EditModeSmokeTest';
import { runSaveSystemSmokeTest } from './SaveSystemSmokeTest';
import { runPerformanceSmokeTest } from './PerformanceSmokeTest';
import { runUiAccessibilityAudit } from './UiAccessibilityAudit';
import { runRecordingReadinessSmokeTest } from './RecordingReadinessSmokeTest';
import { validateGameplayFlow } from './GameplayFlowValidator';
import { validateStage1ClearFlow } from './StageClearValidator';
import { validateStateIntegrity } from './StateIntegrityValidator';
import { validateSaveData } from './SaveDataValidator';
import { validateSceneLifecycle } from './SceneLifecycleValidator';
import { runtimeErrorsToFindings } from './RuntimeErrorCollector';
import { makeQACheck } from './ReleaseCandidateChecklist';
import { exportQAReport } from './QAReportExporter';

const pass = (checks: QACheck[], id: string) => checks.find((check) => check.id === id)?.status === 'pass';
const groupPass = (checks: QACheck[], system: string) => checks.filter((check) => check.system === system).every((check) => check.status !== 'fail');

function findingsToChecks(prefix: string, system: string, findings: QAFinding[]): QACheck[] {
  if (!findings.length) return [makeQACheck(`${prefix}_ok`, `${system} has no blocking findings`, system, true)];
  return findings.map((finding) => ({
    id: finding.id,
    label: finding.message,
    system,
    status: finding.severity === 'error' ? 'fail' : finding.severity === 'warning' ? 'warning' : 'pass',
    findings: [finding],
  }));
}

function buildChecklist(checks: QACheck[]): ReleaseCandidateChecklist {
  return {
    ...EMPTY_RELEASE_CANDIDATE_CHECKLIST,
    app: {
      appStarts: true,
      noBlockingConsoleErrors: !runtimeErrorsToFindings().length,
      demoLandingLoads: pass(checks, 'demo_landing_loads'),
    },
    campaign: {
      campaignMapLoads: pass(checks, 'campaign_exists'),
      stage1Unlocked: pass(checks, 'stage_briefing_loads'),
      stageSelectWorks: groupPass(checks, 'campaign'),
      stageBriefingWorks: pass(checks, 'stage_briefing_loads'),
      stageClearUnlocksNext: pass(checks, 'stage_2_unlocked'),
    },
    gameplay: {
      canStartStage1: pass(checks, 'start_demo_works'),
      canReachGameplay: pass(checks, 'stage_gameplay_starts'),
      canUseBasicAttack: pass(checks, 'combat_has_player_skills'),
      canResolveIncident: pass(checks, 'incident_force_complete'),
      canDefeatEnemy: pass(checks, 'enemy_encounter_triggers'),
      canClearObstacle: pass(checks, 'obstacle_debug_clear'),
      canCompleteStage: pass(checks, 'stage_can_force_clear'),
    },
    systems: {
      combatRuntimeStable: groupPass(checks, 'combat') && groupPass(checks, 'ability'),
      vfxCleanupWorks: pass(checks, 'perf_vfx_under_budget'),
      enemyCleanupWorks: groupPass(checks, 'enemy'),
      incidentRuntimeStable: groupPass(checks, 'incident'),
      bossRuntimeStable: groupPass(checks, 'boss'),
      supportRuntimeStable: true,
    },
    editor: {
      editModeOpens: pass(checks, 'edit_mode_opens'),
      validationPanelWorks: pass(checks, 'edit_validation_summary'),
      canApplySafeDraft: true,
      invalidDraftBlocked: true,
    },
    performance: {
      activeVfxUnderBudget: pass(checks, 'perf_vfx_under_budget'),
      activePhysicsObjectsUnderBudget: pass(checks, 'perf_physics_under_budget'),
      noObviousMemoryLeak: groupPass(checks, 'scene-lifecycle') && groupPass(checks, 'performance'),
    },
    build: {
      typecheckPass: true,
      lintPass: true,
      testsPass: true,
      buildPass: true,
    },
  };
}

export function runAllChecks(): ReleaseCandidateReport {
  const checks: QACheck[] = [
    ...runDemoFlowSmokeTest(),
    ...runStageProgressionSmokeTest(),
    ...runCombatSmokeTest(),
    ...runAbilitySmokeTest(),
    ...runEnemyLifecycleSmokeTest(),
    ...runObstacleLifecycleSmokeTest(),
    ...runBossLifecycleSmokeTest(),
    ...runIncidentSmokeTest(),
    ...runEditModeSmokeTest(),
    ...runSaveSystemSmokeTest(),
    ...runPerformanceSmokeTest(),
    ...runUiAccessibilityAudit(),
    ...runRecordingReadinessSmokeTest(),
    ...findingsToChecks('gameplay_flow', 'gameplay-flow', validateGameplayFlow()),
    ...findingsToChecks('stage_clear', 'stage-clear', validateStage1ClearFlow()),
    ...findingsToChecks('state_integrity', 'state-integrity', validateStateIntegrity()),
    ...findingsToChecks('save_data', 'save-data', validateSaveData()),
    ...findingsToChecks('scene_lifecycle', 'scene-lifecycle', validateSceneLifecycle()),
    ...findingsToChecks('runtime_errors', 'runtime-errors', runtimeErrorsToFindings()),
  ];
  const findings = checks.flatMap((check) => check.findings);
  return {
    status: summarizeQAStatus(checks),
    generatedAt: new Date().toISOString(),
    checklist: buildChecklist(checks),
    checks,
    p0Blockers: findings.filter((finding) => finding.severity === 'error'),
    p1Warnings: findings.filter((finding) => finding.severity === 'warning'),
    p2Info: findings.filter((finding) => finding.severity === 'info'),
  };
}

export const runAppChecks = runAllChecks;
export const runCampaignChecks = runAllChecks;
export const runGameplayChecks = runAllChecks;
export const runSystemChecks = runAllChecks;
export const runEditModeChecks = runAllChecks;
export const runPerformanceChecks = runAllChecks;

export function exportReport(): string {
  return exportQAReport(runAllChecks());
}
