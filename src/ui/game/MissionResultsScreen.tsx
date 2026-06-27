import { ScreenFrame, Btn, panel } from './screenChrome';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { useFlightScoreStore } from '../../stores/game/flightScoreStore';
import { useGameStore } from '../../stores/game/useGameStore';
import type { MissionReward } from '../../types/game/mission';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { StageRewardPanel } from '../campaign/StageRewardPanel';

const GRADE_COLOR: Record<string, string> = { S: '#fde68a', A: '#86efac', B: '#7dd3fc', C: '#cbd5e1' };

function rewardLabel(r: MissionReward): string {
  switch (r.type) {
    case 'coins': return `🪙 ${r.amount ?? 0} coins`;
    case 'item': return `🎁 ${r.targetId ?? 'item'}${r.amount && r.amount > 1 ? ` ×${r.amount}` : ''}`;
    case 'trust': return `💛 +${r.amount ?? 0} trust${r.characterId ? ` · ${r.characterId}` : ''}`;
    case 'unlockTool': return `🛠 Unlock ${r.targetId ?? 'tool'}`;
    case 'worldFlag': return `🚩 ${r.targetId ?? 'flag'}`;
    default: return r.type;
  }
}

// MISSION_RESULTS — the debrief screen that closes the dispatch loop. Summarises the just-finished mission
// (objectives + rewards) and the return-flight grade, then returns to Mission Control for the next dispatch.
export const MissionResultsScreen = () => {
  const missionId = useMissionStore((s) => s.currentMissionId);
  const activeStageId = useStageProgressionStore((s) => s.activeStageId);
  const runtime = useMissionStore((s) => s.runtime);
  const mission = missionId ? getEditorMission(missionId) : undefined;
  const flight = useFlightScoreStore((s) => s.lastResult);

  const progress = runtime?.objectiveProgress ?? {};
  const total = mission?.objectives.length ?? 0;
  const doneCount = Object.values(progress).filter((p) => p.done).length;
  const rewards = mission?.rewards ?? [];

  const backToControl = () => {
    useMissionStore.getState().reset(); // clear the finished mission so the next dispatch starts clean
    useGameStore.getState().requestTransition('MISSION_CONTROL');
  };

  if (activeStageId) {
    return (
      <ScreenFrame title="Stage Debrief" subtitle="campaign clear">
        <StageRewardPanel />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame title="Mission Debrief" subtitle={mission?.name ?? 'dispatch complete'}>
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`flex flex-col gap-3 ${panel} p-5`}>
          <div className="text-sm font-bold text-emerald-200">✓ Mission Complete</div>
          {mission && <div className="text-xs text-slate-400">{mission.name}</div>}
          <div className="mt-1 text-[13px] text-slate-200">
            Objectives <span className="font-mono text-emerald-300">{doneCount}/{total}</span>
          </div>

          <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">Rewards</div>
          {rewards.length > 0 ? (
            <ul className="flex flex-col gap-1 text-[13px] text-slate-200">
              {rewards.map((r) => <li key={r.id}>{rewardLabel(r)}</li>)}
            </ul>
          ) : (
            <div className="text-[12px] text-slate-500">No bonus rewards on this mission.</div>
          )}
        </div>

        <div className={`flex flex-col gap-3 ${panel} p-5`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Return Flight</div>
          {flight ? (
            <div className="flex items-center gap-4">
              <span className="text-6xl font-black" style={{ color: GRADE_COLOR[flight.grade] }}>{flight.grade}</span>
              <div className="text-[12px] text-slate-300">
                <div>Score <span className="font-mono text-amber-200">{flight.score}</span></div>
                <div>✦ {flight.collected} collected</div>
                <div>best ×{flight.bestCombo} combo</div>
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-slate-500">No flight score recorded.</div>
          )}
          <div className="mt-auto flex justify-end pt-4">
            <Btn tone="primary" onClick={backToControl}>Back to Mission Control ▶</Btn>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
};
