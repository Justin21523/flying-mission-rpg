import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { GAME_PHASES } from '../../types/game/state';
import type { GamePhase } from '../../types/game/state';
import { TRANSITIONS } from '../../game/core/GameStateMachine';
import { gameEventBus } from '../../game/core/EventBus';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { getEditorLocation } from '../../stores/game/editorLocationStore';

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

      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] text-slate-500">Dev jump</span>
        <select
          onChange={(e) => {
            if (e.target.value) {
              jumpTo(e.target.value as GamePhase);
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
