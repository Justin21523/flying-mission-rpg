import { useMemo, useState, type ReactNode } from 'react';
import { useGameStore } from '../../../stores/game/useGameStore';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorSupportStore } from '../../../stores/game/editorSupportStore';
import { applyDevScenario, jumpToDevScenario, resetDevScenarioRuntime, type DevMissionRuntimeMode } from '../../../game/debug/devScenario';
import { requestSupport, forceSupportArrival } from '../../../game/support/SupportDispatchDirector';
import { beginFullControlDispatch } from '../../../game/support/FullControlDispatchService';
import { switchControlToCharacter } from '../../../game/characters/control/ControlOwnershipService';
import { phaserBridge, usePhaserOverlayStore } from '../../../game/phaser/phaserBridge';
import { MINI_GAME_IDS } from '../../../data/game/miniGames';
import { GAME_PHASES, type GamePhase } from '../../../types/game/state';
import type { MissionObjective } from '../../../types/game/mission';

const AUTO = '__auto__';
const RUNTIME_MODES: readonly DevMissionRuntimeMode[] = ['auto', 'none', 'active', 'complete', 'failed'];

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
    <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);

const Select = ({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500">
    {children}
  </select>
);

const Button = ({ onClick, disabled, tone = 'slate', children }: { onClick: () => void; disabled?: boolean; tone?: 'slate' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet'; children: ReactNode }) => {
  const cls = tone === 'sky'
    ? 'bg-sky-700/35 text-sky-100 hover:bg-sky-700/55'
    : tone === 'emerald'
      ? 'bg-emerald-700/35 text-emerald-100 hover:bg-emerald-700/55'
      : tone === 'amber'
        ? 'bg-amber-700/35 text-amber-100 hover:bg-amber-700/55'
        : tone === 'rose'
          ? 'bg-rose-700/35 text-rose-100 hover:bg-rose-700/55'
          : tone === 'violet'
            ? 'bg-violet-700/35 text-violet-100 hover:bg-violet-700/55'
            : 'bg-slate-800 text-slate-200 hover:bg-slate-700';
  return <button onClick={onClick} disabled={disabled} className={`rounded px-2 py-1 text-[10px] disabled:opacity-40 ${cls}`}>{children}</button>;
};

const valueOrNull = (value: string): string | null => (value === AUTO ? null : value);

export const MissionStudioTab = () => {
  const phase = useGameStore((s) => s.phase);
  const missionRuntime = useMissionStore((s) => s.runtime);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const supportRuntime = useSupportRuntimeStore();
  const miniGameOpen = usePhaserOverlayStore((s) => s.openId);
  const characters = useEditorCharacterStore((s) => s.items);
  const missions = useEditorMissionStore((s) => s.items);
  const locations = useEditorLocationStore((s) => s.items);
  const routes = useEditorRouteStore((s) => s.items);
  const supportProfiles = useEditorSupportStore((s) => s.profiles);
  const currentMissionId = useMissionStore((s) => s.currentMissionId);
  const currentLocationId = useFlightStore((s) => s.currentLocationId);
  const currentRouteId = useFlightStore((s) => s.currentRouteId);

  const [phaseChoice, setPhaseChoice] = useState<GamePhase>('MISSION_GAMEPLAY');
  const [runtimeMode, setRuntimeMode] = useState<DevMissionRuntimeMode>('auto');
  const [missionChoice, setMissionChoice] = useState(currentMissionId ?? AUTO);
  const [characterChoice, setCharacterChoice] = useState(selectedCharacterId ?? AUTO);
  const [locationChoice, setLocationChoice] = useState(currentLocationId ?? AUTO);
  const [routeChoice, setRouteChoice] = useState(currentRouteId ?? AUTO);
  const [supportChoice, setSupportChoice] = useState(supportProfiles[0]?.characterId ?? AUTO);
  const [objectiveChoice, setObjectiveChoice] = useState('');
  const [miniGameChoice, setMiniGameChoice] = useState<string>(MINI_GAME_IDS[0] ?? '');

  const mission = useMemo(() => missions.find((m) => m.id === valueOrNull(missionChoice)) ?? missions.find((m) => m.id === currentMissionId) ?? missions[0], [currentMissionId, missionChoice, missions]);
  const objective: MissionObjective | undefined = mission?.objectives.find((o) => o.id === objectiveChoice) ?? mission?.objectives[0];

  const scenarioInput = () => ({
    characterId: valueOrNull(characterChoice),
    missionId: valueOrNull(missionChoice),
    locationId: valueOrNull(locationChoice),
    routeId: valueOrNull(routeChoice),
    previousPhase: phase,
    routeProgress: useFlightStore.getState().progress,
    transformationTimelineId: null,
    transformationMode: 'full' as const,
    missionRuntimeMode: runtimeMode,
  });

  const markObjective = (done: boolean): void => {
    if (!objective) return;
    useMissionStore.getState().setObjective(objective.id, done, done ? objective.targetCount : 0);
  };

  const supportPresent = supportChoice !== AUTO && supportRuntime.presences.some((p) => p.characterId === supportChoice);
  const supportDispatching = supportChoice !== AUTO && supportRuntime.dispatches.some((d) => d.characterId === supportChoice);
  const canUseSupport = supportChoice !== AUTO && !supportPresent && !supportDispatching;

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="text-sm font-bold text-sky-200">Mission Studio</div>
        <div className="text-[10px] text-slate-500">One place to simulate mission, support dispatch, objective, NPC, mini-game, and phase state.</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Scenario</div>
          <Field label="Phase">
            <Select value={phaseChoice} onChange={(v) => setPhaseChoice(v as GamePhase)}>
              {GAME_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Mission">
            <Select value={missionChoice} onChange={setMissionChoice}>
              <option value={AUTO}>Auto mission</option>
              {missions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Character">
            <Select value={characterChoice} onChange={setCharacterChoice}>
              <option value={AUTO}>Auto character</option>
              {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Location">
            <Select value={locationChoice} onChange={setLocationChoice}>
              <option value={AUTO}>Auto location</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
          <Field label="Route">
            <Select value={routeChoice} onChange={setRouteChoice}>
              <option value={AUTO}>Auto route</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </Field>
          <Field label="Runtime">
            <Select value={runtimeMode} onChange={(v) => setRuntimeMode(v as DevMissionRuntimeMode)}>
              {RUNTIME_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-1">
            <Button tone="sky" onClick={() => applyDevScenario(scenarioInput(), phaseChoice)}>Apply</Button>
            <Button tone="emerald" onClick={() => jumpToDevScenario(scenarioInput(), phaseChoice)}>Jump + Apply</Button>
            <Button tone="amber" onClick={resetDevScenarioRuntime}>Reset Runtime</Button>
          </div>
        </div>

        <div className="space-y-2 rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Live State</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            <span className="text-slate-500">Phase</span><span className="truncate font-mono text-slate-200">{phase}</span>
            <span className="text-slate-500">Controlled</span><span className="truncate font-mono text-slate-200">{supportRuntime.ownership.controlledCharacterId ?? selectedCharacterId ?? '-'}</span>
            <span className="text-slate-500">Mission</span><span className="truncate font-mono text-slate-200">{currentMissionId ?? '-'}</span>
            <span className="text-slate-500">Runtime</span><span className="truncate font-mono text-slate-200">{missionRuntime?.status ?? '-'}</span>
            <span className="text-slate-500">Full control</span><span className="truncate font-mono text-slate-200">{supportRuntime.fullControl?.dispatchCharacterId ?? '-'}</span>
            <span className="text-slate-500">Mini-game</span><span className="truncate font-mono text-slate-200">{miniGameOpen ?? '-'}</span>
          </div>
          <div className="max-h-28 overflow-y-auto rounded bg-slate-900/50 p-1 text-[10px]">
            {supportRuntime.presences.length === 0 && <div className="text-slate-500">No support characters at scene.</div>}
            {supportRuntime.presences.map((p) => (
              <button key={p.characterId} onClick={() => switchControlToCharacter(p.characterId)} className="mb-1 flex w-full justify-between rounded bg-slate-800/70 px-2 py-1 text-left hover:bg-slate-700">
                <span>{characters.find((c) => c.id === p.characterId)?.name ?? p.characterId}</span>
                <span className="font-mono text-sky-200">{p.tier} · {p.aiState}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2 rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Support Dispatch</div>
          <Field label="Support">
            <Select value={supportChoice} onChange={setSupportChoice}>
              <option value={AUTO}>Select support</option>
              {supportProfiles.map((p) => <option key={p.id} value={p.characterId}>{characters.find((c) => c.id === p.characterId)?.name ?? p.characterId}</option>)}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-1">
            <Button disabled={!canUseSupport} tone="emerald" onClick={() => requestSupport(supportChoice, 'quick-simulated')}>Quick</Button>
            <Button disabled={!canUseSupport} tone="sky" onClick={() => beginFullControlDispatch(supportChoice)}>Full Control</Button>
            <Button disabled={supportChoice === AUTO} tone="amber" onClick={() => forceSupportArrival(supportChoice)}>Force Arrival</Button>
            <Button disabled={supportChoice === AUTO || !supportPresent} tone="violet" onClick={() => switchControlToCharacter(supportChoice)}>Switch</Button>
          </div>
        </div>

        <div className="space-y-2 rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Objective Probe</div>
          <Field label="Objective">
            <Select value={objective?.id ?? ''} onChange={setObjectiveChoice}>
              {!mission && <option value="">No mission</option>}
              {mission?.objectives.map((o) => <option key={o.id} value={o.id}>{o.kind} · {o.id}</option>)}
            </Select>
          </Field>
          <div className="text-[10px] text-slate-500">{objective?.description ?? 'No objective selected.'}</div>
          <div className="flex flex-wrap gap-1">
            <Button disabled={!objective || !missionRuntime} tone="emerald" onClick={() => markObjective(true)}>Mark Done</Button>
            <Button disabled={!objective || !missionRuntime} tone="amber" onClick={() => markObjective(false)}>Clear</Button>
            <Button disabled={!missionRuntime} tone="rose" onClick={() => useMissionStore.getState().failMission()}>Fail Mission</Button>
          </div>
        </div>

        <div className="space-y-2 rounded border border-slate-800 bg-slate-950/50 p-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Mini-game Probe</div>
          <Field label="Mini-game">
            <Select value={miniGameChoice} onChange={setMiniGameChoice}>
              {MINI_GAME_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
            </Select>
          </Field>
          <div className="flex flex-wrap gap-1">
            <Button disabled={!miniGameChoice || !!miniGameOpen} tone="sky" onClick={() => phaserBridge.openMiniGame(miniGameChoice)}>Open</Button>
            <Button disabled={!miniGameOpen} tone="emerald" onClick={() => miniGameOpen && phaserBridge.emitResult({ type: 'mini-game-success', miniGameId: miniGameOpen, score: 100 })}>Success</Button>
            <Button disabled={!miniGameOpen} tone="rose" onClick={() => miniGameOpen && phaserBridge.emitResult({ type: 'mini-game-failed', miniGameId: miniGameOpen, reason: 'Studio failure probe' })}>Fail</Button>
            <Button disabled={!miniGameOpen} tone="amber" onClick={() => miniGameOpen && phaserBridge.emitResult({ type: 'mini-game-cancelled', miniGameId: miniGameOpen })}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
