import type { StageBalanceFinding } from '../../types/stageBalanceTypes';
import type { StageDefinition } from '../../types/stageTypes';
import { analyzeCharacterCoverage } from './CharacterCoverageAnalyzer';
import { analyzeEncounterBudget } from './EncounterBudgetAnalyzer';
import { analyzeStagePacing } from './StagePacingAnalyzer';
import { getStageBalanceProfile, getStageContentPack } from '../../stores/useStageContentEditorStore';

export function analyzeStageBalance(stage: StageDefinition): StageBalanceFinding[] {
  const findings: StageBalanceFinding[] = [];
  const content = getStageContentPack(stage.id);
  const profile = getStageBalanceProfile(stage.id);
  if (!content) findings.push({ severity: 'fatal', stageId: stage.id, message: 'Missing content pack.' });
  if (!profile) findings.push({ severity: 'fatal', stageId: stage.id, message: 'Missing balance profile.' });
  if (profile && profile.resourceBudget.supplyStations <= 0 && (stage.editorMeta?.difficultyRating ?? 1) >= 3) findings.push({ severity: 'warning', stageId: stage.id, message: 'Medium or harder stage should have at least one supply station.' });
  if (stage.requiredSystems.boss && content && content.pacing.restPoints.length === 0) findings.push({ severity: 'warning', stageId: stage.id, message: 'Boss stage should have a rest or support beacon before final pressure.' });
  findings.push(...analyzeEncounterBudget(stage));
  findings.push(...analyzeCharacterCoverage(stage));
  findings.push(...analyzeStagePacing(stage));
  return findings;
}

export function hasFatalBalanceFindings(stage: StageDefinition): boolean {
  return analyzeStageBalance(stage).some((finding) => finding.severity === 'fatal');
}
