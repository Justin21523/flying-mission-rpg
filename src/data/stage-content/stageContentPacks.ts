import type { StageContentPackDefinition } from '../../types/stageContentTypes';
import { SEED_STAGES } from '../campaigns/stageDefinitions';
import { SEED_STAGE_PACING_DEFINITIONS } from './stagePacingDefinitions';

function supportTypes(stageIndex: number): string[] {
  if (stageIndex <= 1) return ['repair-support', 'scan-support'];
  if (stageIndex === 2) return ['shield-support', 'scan-support'];
  if (stageIndex === 3) return ['repair-support', 'scan-support'];
  if (stageIndex === 4) return ['break-support', 'shield-support'];
  if (stageIndex >= 5) return ['scan-support', 'shield-support', 'repair-support', 'strike-support'];
  return ['scan-support'];
}

const FIRST_THREE_CONTENT_OVERRIDES: Record<string, Pick<StageContentPackDefinition, 'recommendedSupportAbilityTypes' | 'requiredGameplaySystems' | 'editorMeta'>> = {
  stage_sunny_harbor_emergency: {
    recommendedSupportAbilityTypes: ['repair-support', 'break-support'],
    requiredGameplaySystems: { combat: true, incident: true, support: true, boss: false, repair: true, scan: false, defense: false, heavyBreak: true },
    editorMeta: { contentStatus: 'polished', notes: 'Batch N authored tutorial flow: movement, incident, cracked wall, one enemy, repair clear.', stageType: 'tutorial' },
  },
  stage_downtown_traffic_collapse: {
    recommendedSupportAbilityTypes: ['shield-support', 'scan-support'],
    requiredGameplaySystems: { combat: true, incident: true, support: true, boss: false, repair: true, scan: false, defense: true, heavyBreak: false },
    editorMeta: { contentStatus: 'polished', notes: 'Batch N authored defense/control flow with shield support and evacuation pressure.', stageType: 'mixed' },
  },
  stage_factory_core_breakdown: {
    recommendedSupportAbilityTypes: ['repair-support', 'scan-support'],
    requiredGameplaySystems: { combat: true, incident: true, support: true, boss: false, repair: true, scan: true, defense: false, heavyBreak: false },
    editorMeta: { contentStatus: 'polished', notes: 'Batch N authored scan/repair/support-enemy flow with hazard and mini elite.', stageType: 'incident' },
  },
};

export const SEED_STAGE_CONTENT_PACKS: StageContentPackDefinition[] = SEED_STAGES.map((stage) => {
  const override = FIRST_THREE_CONTENT_OVERRIDES[stage.id];
  return ({
  id: `content_${stage.id}`,
  stageId: stage.id,
  name: `${stage.name} Content Pack`,
  description: stage.description,
  environmentThemeId: stage.environmentThemeId,
  levelLayoutId: stage.levelLayoutId,
  encounterPackIds: stage.encounterPackIds,
  incidentTemplateIds: stage.incidentTemplateIds,
  obstaclePackIds: stage.obstaclePackIds,
  bossEncounterId: stage.bossEncounterId,
  eliteEncounterIds: stage.encounterPackIds.filter((id) => id.includes('elite') || stage.stageIndex >= 4),
  recommendedCharacterIds: stage.recommendedCharacterIds,
  recommendedSupportAbilityTypes: override?.recommendedSupportAbilityTypes ?? supportTypes(stage.stageIndex),
  requiredGameplaySystems: override?.requiredGameplaySystems ?? {
    combat: stage.requiredSystems.combat,
    incident: stage.requiredSystems.incidents,
    support: stage.requiredSystems.support,
    boss: stage.requiredSystems.boss,
    repair: stage.incidentTemplateIds.some((id) => id.includes('mechanical') || id.includes('power') || id.includes('flood')) || stage.obstaclePackIds.some((id) => id.includes('factory') || id.includes('blackout') || id.includes('flood') || id.includes('tower')),
    scan: stage.recommendedCharacterIds.includes('char_chase') || stage.stageIndex >= 5,
    defense: stage.recommendedCharacterIds.includes('char_paul') || stage.stageIndex === 2,
    heavyBreak: stage.recommendedCharacterIds.includes('char_todd') || stage.stageIndex === 4,
  },
  pacing: SEED_STAGE_PACING_DEFINITIONS[stage.id],
  balanceProfileId: `balance_${stage.id}`,
  editorMeta: override?.editorMeta ?? { contentStatus: stage.stageIndex <= 10 ? 'polished' : 'playable', notes: `Batch I authored content for ${stage.name}.`, stageType: stage.stageType },
  });
});
