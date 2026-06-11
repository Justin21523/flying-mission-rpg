import { usePoll } from '../usePoll';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { getEditorGameNpc } from '../../stores/game/editorGameNpcStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { usePhaserOverlayStore } from '../../game/phaser/phaserBridge';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { robotHandle } from '../../game/destination/robotHandle';

// Mission HUD (NPC_GREETING + MISSION_GAMEPLAY) — mission/NPC names, objective list with live progress +
// hints, the [E] interaction prompt and the mini-game state.
export const MissionHud = () => {
  usePoll(150);
  const phase = useGameStore((s) => s.phase);
  const missionId = useMissionStore((s) => s.currentMissionId);
  const runtime = useMissionStore((s) => s.runtime);
  const prompt = useDestinationRuntimeStore((s) => s.prompt);
  const carryingId = useDestinationRuntimeStore((s) => s.carryingId);
  const miniGameOpen = usePhaserOverlayStore((s) => s.openId);
  const mission = missionId ? getEditorMission(missionId) : undefined;
  const npc = mission?.npcId ? getEditorGameNpc(mission.npcId) : undefined;
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  const canFly = !!(charId && getEditorCharacter(charId)?.canFly);

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-[60] w-64 rounded-xl border border-emerald-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-bold text-emerald-200">{mission ? mission.name : 'MISSION'}</span>
          <span className="font-mono text-[10px] text-slate-500">{phase === 'NPC_GREETING' ? 'greeting' : 'gameplay'}</span>
        </div>
        {npc && <div className="text-[11px] text-slate-400">Contact: {npc.name} ({npc.role})</div>}
        {canFly && (
          <div className="mt-1 text-[10px] text-sky-300">{robotHandle.flying ? '✈ Flying · Space up · Shift down · Shift+move fast · F land' : '✈ Press F to fly (Space up · Shift down · Shift+move fast)'}</div>
        )}
        {phase === 'NPC_GREETING' && <div className="mt-1 text-[11px] text-amber-200">Find the NPC with the ⭑ marker and talk to them.</div>}
        {phase === 'MISSION_GAMEPLAY' && mission && (
          <div className="mt-1 space-y-1">
            {mission.objectives.map((o) => {
              const p = runtime?.objectiveProgress[o.id];
              const done = p?.done ?? false;
              return (
                <div key={o.id} className={done ? 'text-emerald-300 line-through' : ''}>
                  {done ? '✓' : '○'} {o.description}
                  {!done && o.hintText && <div className="pl-4 text-[10px] text-slate-500">{o.hintText}</div>}
                </div>
              );
            })}
            {carryingId && <div className="text-amber-200">📦 Carrying — find the dropoff zone!</div>}
            {miniGameOpen && <div className="text-sky-300">🔧 Mini-game in progress…</div>}
          </div>
        )}
      </div>

      {prompt && (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[60] flex justify-center">
          <div className="rounded-full bg-emerald-950/85 px-5 py-2 text-sm font-bold text-emerald-100 backdrop-blur">{prompt}</div>
        </div>
      )}
    </>
  );
};
