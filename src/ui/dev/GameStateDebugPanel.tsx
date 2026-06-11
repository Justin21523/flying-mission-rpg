import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { GAME_PHASES } from '../../types/game/state';
import type { GamePhase } from '../../types/game/state';
import { TRANSITIONS } from '../../game/core/GameStateMachine';
import { gameEventBus } from '../../game/core/EventBus';
import { getEditorCharacter, getEditorCharacters } from '../../stores/game/editorCharacterStore';
import { getEditorMission, getEditorMissions } from '../../stores/game/editorMissionStore';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { focusCameraOn } from '../../game/edit/cameraFocus';
import { getPath } from '../../stores/editorPathStore';
import { getActivePathId } from '../../game/flight/world/worldRoute';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';

// On a dev jump, pan the EDIT camera to the new state's content so the screen visibly changes to that state
// (FollowCamera follows the player, which isn't where flight/world content is). Reuses focusCameraOn.
const FLY_AROUND = new Set<GamePhase>(['LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT']);
const WORLD = new Set<GamePhase>(['WORLD_FLIGHT', 'DESTINATION_APPROACH']);
function focusForPhase(p: GamePhase): void {
  const pathId = WORLD.has(p) ? getActivePathId() : FLY_AROUND.has(p) ? FLIGHT_PATH_ID : null;
  const node0 = pathId ? getPath(pathId)?.nodes?.[0]?.position : undefined;
  if (node0) focusCameraOn(node0[0], node0[1], node0[2]);
  else focusCameraOn(0, 1, 0); // base / console states
}

// One place to perform a dev jump: fill prereqs, switch phase, and move the edit camera to it.
function devJumpTo(jump: (p: GamePhase) => void, p: GamePhase): void {
  ensureJumpPrereqs();
  jump(p);
  focusForPhase(p);
}

// Jumping straight to a mid-game phase must Just Work — fill in a default mission + character if the
// player hasn't picked any yet (so the base/flight/mission scenes have the context they need).
function ensureJumpPrereqs(): void {
  const ms = useMissionStore.getState();
  if (!ms.currentMissionId) {
    const m = getEditorMissions()[0];
    if (m) ms.selectMission(m.id);
  }
  const cs = useCharacterStore.getState();
  if (!cs.selectedCharacterId) {
    const c = getEditorCharacters()[0];
    if (c) cs.selectCharacter(c.id);
  }
}

// The 3D-editable phases — one-click quick jump (each renders a distinct editable scene). Order = flow.
const QUICK_PHASES: GamePhase[] = [
  'MISSION_CONTROL',
  'HANGAR',
  'PLATFORM_ALIGNMENT',
  'LAUNCH_PREPARATION',
  'LAUNCH_TUNNEL',
  'BASE_FLY_AROUND',
  'CLOUD_ASCENT',
  'WORLD_FLIGHT',
  'DESTINATION_APPROACH',
];

// Dev-only console for the game state machine (toggled via the Leva DevPanel). Shows the current/previous
// phase + selection, advances via legal-only buttons, and surfaces blocked illegal moves. Not a play UI —
// the real Mission Control console is Batch 2.
export const GameStateDebugPanel = () => {
  const phase = useGameStore((s) => s.phase);
  const previousPhase = useGameStore((s) => s.previousPhase);
  const paused = useGameStore((s) => s.paused);
  const error = useGameStore((s) => s.error);
  const requestTransition = useGameStore((s) => s.requestTransition);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const jumpTo = useGameStore((s) => s.jumpTo);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const currentMissionId = useMissionStore((s) => s.currentMissionId);
  const currentLocationId = useFlightStore((s) => s.currentLocationId);
  const [blocked, setBlocked] = useState<string | null>(null);

  useEffect(() => gameEventBus.on('phase:blocked', (p) => setBlocked(p.reason)), []);

  const allowed = TRANSITIONS[phase];
  const charName = selectedCharacterId ? getEditorCharacter(selectedCharacterId)?.name ?? selectedCharacterId : '—';
  const missionName = currentMissionId ? getEditorMission(currentMissionId)?.name ?? currentMissionId : '—';
  const locName = currentLocationId ? getEditorLocation(currentLocationId)?.name ?? currentLocationId : '—';

  return (
    <div className="pointer-events-auto fixed bottom-2 right-2 z-[90] w-72 rounded-lg border border-sky-800/60 bg-slate-950/85 p-3 text-xs text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-1 font-bold text-sky-300">🎮 Game State (dev)</div>
      <div>
        Phase: <span className="font-mono text-emerald-300">{phase}</span>
        {paused && <span className="text-amber-300"> (paused)</span>}
      </div>
      <div className="text-slate-400">
        Prev: <span className="font-mono">{previousPhase ?? '—'}</span>
      </div>
      <div className="text-slate-400">Character: {charName}</div>
      <div className="text-slate-400">Mission: {missionName}</div>
      <div className="text-slate-400">Location: {locName}</div>
      {error && <div className="text-rose-400">Error: {error}</div>}

      <div className="mb-1 mt-2 text-[10px] uppercase tracking-wide text-slate-500">Legal transitions</div>
      <div className="flex flex-wrap gap-1">
        {allowed.length === 0 && <span className="text-slate-500">(none — pause/resume or jump)</span>}
        {allowed.map((to) => (
          <button
            key={to}
            onClick={() => {
              setBlocked(null);
              requestTransition(to);
            }}
            className="rounded bg-sky-700/30 px-1.5 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700/50"
          >
            {to}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button onClick={pause} disabled={paused} className="rounded bg-amber-700/25 px-2 py-0.5 text-[10px] text-amber-100 disabled:opacity-40">
          ⏸ Pause
        </button>
        <button onClick={resume} disabled={!paused} className="rounded bg-emerald-700/25 px-2 py-0.5 text-[10px] text-emerald-100 disabled:opacity-40">
          ▶ Resume
        </button>
        <button onClick={() => useGameStore.getState().reset()} className="rounded bg-slate-700/40 px-2 py-0.5 text-[10px]">
          ↺ Reset
        </button>
      </div>

      {/* One-click quick jump — switch the editable 3D scene instantly, back and forth (bypasses validation,
          auto-fills prereqs). The Scene re-renders on phase, so the state's edit objects appear immediately. */}
      <div className="mb-1 mt-2 text-[10px] uppercase tracking-wide text-slate-500">Quick jump (edit scenes)</div>
      <div className="grid grid-cols-2 gap-1">
        {QUICK_PHASES.map((p) => (
          <button
            key={p}
            onClick={() => { setBlocked(null); devJumpTo(jumpTo, p); }}
            className={`truncate rounded px-1.5 py-0.5 text-left text-[10px] ${p === phase ? 'bg-emerald-600/40 text-emerald-100' : 'bg-slate-800/70 text-slate-200 hover:bg-slate-700'}`}
          >
            {p === phase ? '● ' : ''}{p}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] text-slate-500">Dev jump</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              devJumpTo(jumpTo, e.target.value as GamePhase);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="flex-1 rounded bg-slate-800 px-1 py-0.5 text-[10px]"
        >
          <option value="" disabled>
            jump to…
          </option>
          {GAME_PHASES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {blocked && <div className="mt-2 rounded bg-rose-900/40 px-2 py-1 text-[10px] text-rose-200">⛔ {blocked}</div>}
    </div>
  );
};
