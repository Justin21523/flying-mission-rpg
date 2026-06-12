import { getStuckMs } from './StateMachineDiagnostics';
import { getSceneResidual, type SceneResidual } from './SceneCleanupDiagnostics';
import { readGauges } from './SubscriptionLeakDetector';
import { getSaveHealth, type SaveHealth } from '../save/SaveManager';
import { useGameStore } from '../../stores/game/useGameStore';
import { useAutoPlaytesterStore } from '../../stores/game/autoPlaytesterStore';

// Batch 13 — aggregates diagnostics into a single ok/warning/error health report for the panel + e2e.
export type HealthStatus = 'ok' | 'warning' | 'error';

export interface HealthReport {
  status: HealthStatus;
  warnings: string[];
  errors: string[];
  phase: string;
  stuckSeconds: number;
  residual: SceneResidual;
  save: SaveHealth;
  gauges: Record<string, number>;
  autoStatus: string;
}

const LONG_OK_PHASES = new Set(['PAUSED', 'ERROR', 'MISSION_CONTROL', 'HANGAR']);

export function collectHealth(): HealthReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const phase = useGameStore.getState().phase;
  const stuckMs = getStuckMs();
  const residual = getSceneResidual();
  const save = getSaveHealth();
  const auto = useAutoPlaytesterStore.getState().snap;

  if (stuckMs > 25_000 && !LONG_OK_PHASES.has(phase)) warnings.push(`stuck in ${phase} for ${Math.round(stuckMs / 1000)}s`);
  if (!save.lastSaveOk) errors.push(save.lastError ?? 'last save failed');
  if (!save.storageAvailable) warnings.push('localStorage unavailable — progress will not persist');
  if (residual.phaserOpen && !['MISSION_GAMEPLAY', 'NPC_GREETING', 'SUPPORT_SELECTION'].includes(phase)) {
    warnings.push('Phaser overlay open outside a mission phase');
  }
  if (auto.status === 'failed') errors.push(`auto playtester failed: ${auto.failureReason ?? 'unknown'}`);

  const status: HealthStatus = errors.length ? 'error' : warnings.length ? 'warning' : 'ok';
  return { status, warnings, errors, phase, stuckSeconds: Math.round(stuckMs / 1000), residual, save, gauges: readGauges(), autoStatus: auto.status };
}
