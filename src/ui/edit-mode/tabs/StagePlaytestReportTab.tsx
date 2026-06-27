import { useMemo, useState } from 'react';
import { getStagesForCampaign } from '../../../stores/useStageEditorStore';
import { RESCUE_VANGUARD_CAMPAIGN_ID } from '../../../data/campaigns/campaignDefinitions';
import { getStagePlaytestScenario } from '../../../stores/useStageContentEditorStore';
import { buildStagePlaytestReport } from '../../../game/playtest/StagePlaytestAssertions';

export const StagePlaytestReportTab = () => {
  const stages = useMemo(() => getStagesForCampaign(RESCUE_VANGUARD_CAMPAIGN_ID), []);
  const [selectedId, setSelectedId] = useState(stages[0]?.id ?? '');
  const stage = stages.find((item) => item.id === selectedId);
  const report = stage ? buildStagePlaytestReport(stage, getStagePlaytestScenario(stage.id)) : undefined;
  return (
    <div className="space-y-3 text-xs text-slate-300">
      <h2 className="text-sm font-bold text-sky-200">Stage Playtest Report</h2>
      <select className="rounded border border-slate-700 bg-slate-950 p-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
        {stages.map((item) => <option key={item.id} value={item.id}>{item.stageIndex}. {item.name}</option>)}
      </select>
      {report && (
        <div className="rounded border border-slate-700 bg-slate-950/50 p-3">
          <div className="font-bold text-slate-100">Status: {report.validationStatus}</div>
          <div>Estimated difficulty: {report.estimatedDifficulty}</div>
          <div>Estimated duration: {report.estimatedDurationMinutes}m</div>
          <div className="mt-2 grid grid-cols-2 gap-1">{Object.entries(report.checks).map(([key, value]) => <div key={key} className={value ? 'text-emerald-300' : 'text-red-300'}>{key}: {String(value)}</div>)}</div>
          {report.balanceWarnings.map((warning) => <div key={warning} className="mt-1 text-amber-300">{warning}</div>)}
          {report.contentWarnings.map((warning) => <div key={warning} className="mt-1 text-red-300">{warning}</div>)}
        </div>
      )}
    </div>
  );
};
