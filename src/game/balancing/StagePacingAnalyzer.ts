import type { StageBalanceFinding } from '../../types/stageBalanceTypes';
import type { StageDefinition } from '../../types/stageTypes';
import { getStageContentPack } from '../../stores/useStageContentEditorStore';

export function analyzeStagePacing(stage: StageDefinition): StageBalanceFinding[] {
  const pack = getStageContentPack(stage.id);
  if (!pack) return [{ severity: 'fatal', stageId: stage.id, message: 'Missing stage content pack.' }];
  const beats = pack.pacing.beats;
  const findings: StageBalanceFinding[] = [];
  if (!beats.some((beat) => beat.beatType === 'intro')) findings.push({ severity: 'fatal', stageId: stage.id, message: 'Pacing lacks intro beat.' });
  if (!beats.some((beat) => beat.beatType === 'combat' || beat.beatType === 'incident' || beat.beatType === 'obstacle')) findings.push({ severity: 'warning', stageId: stage.id, message: 'Pacing lacks a clear middle interaction.' });
  if (!beats.some((beat) => beat.beatType === 'final-objective' || beat.beatType === 'boss' || beat.beatType === 'extraction')) findings.push({ severity: 'fatal', stageId: stage.id, message: 'Pacing lacks final objective beat.' });
  if (pack.pacing.intensityCurve[0]?.intensity && pack.pacing.intensityCurve[0].intensity > 2) findings.push({ severity: 'warning', stageId: stage.id, message: 'Opening intensity starts too high.' });
  const last = pack.pacing.intensityCurve[pack.pacing.intensityCurve.length - 1]?.intensity ?? 1;
  const mid = Math.max(...pack.pacing.intensityCurve.slice(1, -1).map((item) => item.intensity), 1);
  if (last < mid && stage.stageIndex > 1) findings.push({ severity: 'warning', stageId: stage.id, message: 'Final intensity is lower than middle pressure.' });
  return findings;
}
