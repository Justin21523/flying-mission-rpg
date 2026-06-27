import type { StageBalanceFinding } from '../../types/stageBalanceTypes';
import type { StageDefinition } from '../../types/stageTypes';
import { getStageContentPack } from '../../stores/useStageContentEditorStore';

export function analyzeCharacterCoverage(stage: StageDefinition): StageBalanceFinding[] {
  const pack = getStageContentPack(stage.id);
  if (!pack) return [{ severity: 'fatal', stageId: stage.id, message: 'Missing stage content pack.' }];
  const solutions = new Set([...stage.recommendedCharacterIds, ...(stage.recommendedSupportIds ?? []), ...pack.recommendedSupportAbilityTypes]);
  const findings: StageBalanceFinding[] = [];
  if (solutions.size < 2) findings.push({ severity: 'fatal', stageId: stage.id, message: 'Stage has fewer than two viable role solutions.' });
  if (pack.requiredGameplaySystems.scan && !solutions.has('char_chase') && !solutions.has('scan-support')) findings.push({ severity: 'warning', stageId: stage.id, message: 'Scan stage lacks Chase or scan support recommendation.' });
  if (pack.requiredGameplaySystems.repair && !solutions.has('char_donnie') && !solutions.has('repair-support')) findings.push({ severity: 'warning', stageId: stage.id, message: 'Repair stage lacks Donnie or repair support recommendation.' });
  if (pack.requiredGameplaySystems.defense && !solutions.has('char_paul') && !solutions.has('shield-support')) findings.push({ severity: 'warning', stageId: stage.id, message: 'Defense stage lacks Paul or shield support recommendation.' });
  if (pack.requiredGameplaySystems.heavyBreak && !solutions.has('char_todd') && !solutions.has('break-support')) findings.push({ severity: 'warning', stageId: stage.id, message: 'Heavy-break stage lacks Todd or break support recommendation.' });
  return findings;
}
