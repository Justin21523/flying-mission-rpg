import { useCampaignDefinitionStore } from '../../../stores/useStageEditorStore';

export const CampaignEditorTab = () => {
  const campaigns = useCampaignDefinitionStore((state) => state.items);
  return <div className="space-y-2 text-xs text-slate-300">{campaigns.map((campaign) => <div key={campaign.id} className="rounded border border-slate-700 p-2"><b>{campaign.name}</b><br />Stages: {campaign.stageIds.join(', ')}</div>)}</div>;
};
