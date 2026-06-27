import { useMemo, useState } from 'react';
import { getStagesForCampaign } from '../../../stores/useStageEditorStore';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../../data/campaigns/campaignDefinitions';
import { getStageContentPack } from '../../../stores/useStageContentEditorStore';

export const StageContentBuilderTab = () => {
  const stages = useMemo(() => getStagesForCampaign(RESCUE_VANGUARD_CAMPAIGN_ID), []);
  const [selectedId, setSelectedId] = useState(stages[0]?.id ?? '');
  const pack = getStageContentPack(selectedId);
  return (
    <div className="space-y-3 text-xs text-slate-300">
      <h2 className="text-sm font-bold text-sky-200">Stage Content Builder</h2>
      <select className="rounded border border-slate-700 bg-slate-950 p-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
        {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.stageIndex}. {stage.name}</option>)}
      </select>
      <div className="rounded border border-slate-700 bg-slate-950/50 p-3">
        <div className="font-bold text-slate-100">Draft suggestions</div>
        <div>Theme: {pack?.environmentThemeId}</div>
        <div>Pacing: {pack?.pacing.pacingType}</div>
        <div>Encounters: {pack?.encounterPackIds.join(', ')}</div>
        <div>Incidents: {pack?.incidentTemplateIds.join(', ')}</div>
        <div>Obstacles: {pack?.obstaclePackIds.join(', ')}</div>
        <div className="mt-2 text-slate-400">Use duplicate/apply in the content pack tab after review. This builder intentionally creates draft suggestions only.</div>
      </div>
    </div>
  );
};
