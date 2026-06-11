import type { ReactNode } from 'react';
import type { MissionDefinition } from '../../../types/game/mission';

// Read-only summary of a mission's flow: requires → location/NPC → objectives → rewards → next.
// Mirrors the POLI QuestFlowPreview. Name lookups are passed in (id → name).
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex gap-2 text-[11px]"><span className="w-20 shrink-0 font-semibold uppercase tracking-wide text-slate-500">{label}</span><span className="flex-1 text-slate-300">{children}</span></div>
);

export const MissionFlowPreview = ({ mission, missionName, locationName, npcName }: {
  mission: MissionDefinition;
  missionName: (id: string) => string;
  locationName: (id: string) => string;
  npcName: (id: string) => string;
}) => {
  const rewards = mission.rewards ?? [];
  return (
    <div className="space-y-1 rounded bg-slate-900/60 p-2">
      {(mission.requiredMissionIds?.length ?? 0) > 0 && <Row label="Requires">{mission.requiredMissionIds!.map(missionName).join(', ')}</Row>}
      <Row label="Where">{locationName(mission.locationId) || '(no location)'}{mission.npcId ? ` · ${npcName(mission.npcId)}` : ''}</Row>
      <Row label="Objectives">
        <ol className="list-decimal space-y-0.5 pl-4">
          {mission.objectives.map((o) => <li key={o.id}>{o.description || o.kind}{o.optional ? ' (optional)' : ''}</li>)}
          {mission.objectives.length === 0 && <li className="list-none text-slate-500">(none)</li>}
        </ol>
        {mission.ordered && <span className="text-[10px] text-amber-300">ordered — must be done in sequence</span>}
      </Row>
      <Row label="Rewards">{rewards.length ? rewards.map((r) => `${r.type}${r.amount ? ` ×${r.amount}` : ''}${r.targetId ? ` (${r.targetId})` : ''}`).join(', ') : '(none)'}</Row>
      {(mission.nextMissionIds?.length ?? 0) > 0 && <Row label="Leads to">{mission.nextMissionIds!.map(missionName).join(', ')}</Row>}
    </div>
  );
};
