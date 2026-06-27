import type { StageDefinition } from '../../types/stageTypes';
import { getStageContentPack } from '../../stores/useStageContentEditorStore';

export const StageThreatPreview = ({ stage }: { stage: StageDefinition }) => {
  const content = getStageContentPack(stage.id);
  const threats = [
    ...(stage.briefing.threatSummary?.split(',').map((item) => item.trim()).filter(Boolean) ?? []),
    ...(content?.eliteEncounterIds?.length ? ['elite pressure'] : []),
    ...(stage.bossEncounterId ? ['boss encounter'] : []),
  ].slice(0, 5);
  return (
    <div className="mt-2">
      <div className="text-[10px] font-bold uppercase text-slate-500">Threats</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {(threats.length ? threats : ['light patrol']).map((threat) => (
          <span key={threat} className="rounded border border-rose-500/30 bg-rose-950/30 px-2 py-0.5 text-[10px] text-rose-100">{threat}</span>
        ))}
      </div>
    </div>
  );
};
