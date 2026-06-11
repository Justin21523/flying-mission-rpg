import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorMissionStore } from '../../stores/game/editorMissionStore';
import { useEditorLocationStore } from '../../stores/game/editorLocationStore';
import { useEditorRouteStore } from '../../stores/game/editorRouteStore';
import { useEditorTransformationStore } from '../../stores/game/editorTransformationStore';
import { GAME_PHASES, type GamePhase } from '../../types/game/state';
import { TRANSITIONS } from '../../game/core/GameStateMachine';
import { gameEventBus } from '../../game/core/EventBus';
import { focusCameraOn } from '../../game/edit/cameraFocus';
import { getPath } from '../../stores/editorPathStore';
import { FLIGHT_PATH_ID } from '../../data/game/flightPath';
import { getEditorRoute } from '../../stores/game/editorRouteStore';
import { applyDevScenario, jumpToDevScenario, resetDevScenarioRuntime, resolveDevScenario, type DevMissionRuntimeMode, type DevScenarioInput } from '../../game/debug/devScenario';
import { useWorldFlightRuntimeStore } from '../../stores/game/worldFlightRuntimeStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useTransformationPreviewStore } from '../../stores/game/transformationPreviewStore';
import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { devJumpU } from '../../game/flight/world/worldFlightDev';
import type { TransformationMode } from '../../types/game/transformation';

const AUTO_VALUE = '__auto__';
const PANEL_STORAGE_KEY = 'aero-gamestate-console-v1';

interface PanelLayout { collapsed: boolean; width?: number; height?: number }
function loadPanelLayout(): PanelLayout {
  try {
    const raw = localStorage.getItem(PANEL_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PanelLayout;
  } catch { /* ignore */ }
  return { collapsed: false };
}
function savePanelLayout(layout: PanelLayout): void {
  try { localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
}
const TRANSFORMATION_MODES: readonly TransformationMode[] = ['full', 'interactive', 'quick'];
const RUNTIME_MODES: readonly DevMissionRuntimeMode[] = ['auto', 'none', 'active', 'complete', 'failed'];
const FLY_AROUND = new Set<GamePhase>(['LAUNCH_TUNNEL', 'BASE_FLY_AROUND', 'CLOUD_ASCENT']);
const WORLD = new Set<GamePhase>(['WORLD_FLIGHT', 'DESTINATION_APPROACH']);

function valueOrNull(value: string): string | null {
  return value === AUTO_VALUE ? null : value;
}

function phaseOrNull(value: string): GamePhase | null {
  return value === AUTO_VALUE ? null : (value as GamePhase);
}

function formatLabel(id: string, label: string): string {
  return `${label} (${id})`;
}

function focusForPhase(phase: GamePhase, routeId: string | null): void {
  const routePathId = routeId ? getEditorRoute(routeId)?.pathId : undefined;
  const pathId = WORLD.has(phase) ? routePathId : FLY_AROUND.has(phase) ? FLIGHT_PATH_ID : null;
  const node0 = pathId ? getPath(pathId)?.nodes?.[0]?.position : undefined;
  if (node0) focusCameraOn(node0[0], node0[1], node0[2]);
  else focusCameraOn(0, 1, 0);
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2">
    <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
    {children}
  </label>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2">
    <span className="text-slate-400">{label}</span>
    <span className="truncate text-right font-mono text-slate-200">{value}</span>
  </div>
);

const Button = ({ onClick, disabled, children, tone = 'slate' }: { onClick: () => void; disabled?: boolean; children: ReactNode; tone?: 'slate' | 'sky' | 'emerald' | 'amber' | 'rose' }) => {
  const color =
    tone === 'sky'
      ? 'bg-sky-700/35 text-sky-100 hover:bg-sky-700/55'
      : tone === 'emerald'
        ? 'bg-emerald-700/35 text-emerald-100 hover:bg-emerald-700/55'
        : tone === 'amber'
          ? 'bg-amber-700/35 text-amber-100 hover:bg-amber-700/55'
          : tone === 'rose'
            ? 'bg-rose-700/35 text-rose-100 hover:bg-rose-700/55'
            : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700';
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded px-2 py-1 text-[10px] disabled:opacity-40 ${color}`}>
      {children}
    </button>
  );
};

const Select = ({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-sky-500">
    {children}
  </select>
);

export const GameStateDebugPanel = () => {
  const phase = useGameStore((s) => s.phase);
  const previousPhase = useGameStore((s) => s.previousPhase);
  const paused = useGameStore((s) => s.paused);
  const error = useGameStore((s) => s.error);
  const requestTransition = useGameStore((s) => s.requestTransition);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const resetGame = useGameStore((s) => s.reset);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const currentMissionId = useMissionStore((s) => s.currentMissionId);
  const missionRuntime = useMissionStore((s) => s.runtime);
  const currentLocationId = useFlightStore((s) => s.currentLocationId);
  const currentRouteId = useFlightStore((s) => s.currentRouteId);
  const flightProgress = useFlightStore((s) => s.progress);
  const worldRuntime = useWorldFlightRuntimeStore();
  const destinationRuntime = useDestinationRuntimeStore();
  const transformationPreview = useTransformationPreviewStore();
  const baseRuntime = useBaseRuntimeStore();
  const flightRuntime = useFlightRuntimeStore();
  const characters = useEditorCharacterStore((s) => s.items);
  const missions = useEditorMissionStore((s) => s.items);
  const locations = useEditorLocationStore((s) => s.items);
  const routes = useEditorRouteStore((s) => s.items);
  const transformations = useEditorTransformationStore((s) => s.items);

  const [blocked, setBlocked] = useState<string | null>(null);
  const [targetPhase, setTargetPhase] = useState<GamePhase>('MISSION_CONTROL');
  const [previousChoice, setPreviousChoice] = useState<string>(previousPhase ?? AUTO_VALUE);
  const [characterChoice, setCharacterChoice] = useState<string>(selectedCharacterId ?? AUTO_VALUE);
  const [missionChoice, setMissionChoice] = useState<string>(currentMissionId ?? AUTO_VALUE);
  const [locationChoice, setLocationChoice] = useState<string>(currentLocationId ?? AUTO_VALUE);
  const [routeChoice, setRouteChoice] = useState<string>(currentRouteId ?? AUTO_VALUE);
  const [timelineChoice, setTimelineChoice] = useState<string>(transformationPreview.timelineId ?? AUTO_VALUE);
  const [transformationMode, setTransformationMode] = useState<TransformationMode>(transformationPreview.mode);
  const [runtimeMode, setRuntimeMode] = useState<DevMissionRuntimeMode>('auto');
  const [routeProgress, setRouteProgress] = useState<number>(flightProgress);
  const [objectiveId, setObjectiveId] = useState<string>('');

  useEffect(() => gameEventBus.on('phase:blocked', (p) => setBlocked(p.reason)), []);

  // Resizable + collapsible console (persisted) so it never blocks the editor inspector / gizmos.
  const panelRef = useRef<HTMLDivElement>(null);
  const [layout] = useState<PanelLayout>(loadPanelLayout);
  const [collapsed, setCollapsed] = useState<boolean>(layout.collapsed);
  const collapsedRef = useRef(collapsed);
  useEffect(() => { collapsedRef.current = collapsed; }, [collapsed]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (layout.width) el.style.width = `${layout.width}px`;
    if (layout.height && !collapsed) el.style.height = `${layout.height}px`;
    const ro = new ResizeObserver(() => {
      if (collapsedRef.current) return; // don't persist the collapsed (header-only) size
      savePanelLayout({ collapsed: collapsedRef.current, width: el.offsetWidth, height: el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.width, layout.height, collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      const el = panelRef.current;
      savePanelLayout({ collapsed: next, width: el?.offsetWidth, height: next ? layout.height : el?.offsetHeight });
      return next;
    });
  };

  const makeInput = (): DevScenarioInput => ({
    characterId: valueOrNull(characterChoice),
    missionId: valueOrNull(missionChoice),
    locationId: valueOrNull(locationChoice),
    routeId: valueOrNull(routeChoice),
    previousPhase: phaseOrNull(previousChoice),
    routeProgress,
    transformationTimelineId: valueOrNull(timelineChoice),
    transformationMode,
    missionRuntimeMode: runtimeMode,
  });

  const resolved = resolveDevScenario(makeInput());
  const resolvedMission = resolved.missionId ? missions.find((m) => m.id === resolved.missionId) : undefined;
  const effectiveObjectiveId = resolvedMission?.objectives.some((o) => o.id === objectiveId) ? objectiveId : resolvedMission?.objectives[0]?.id ?? '';
  const allowed = TRANSITIONS[phase];

  const applyScenarioToPhase = (p: GamePhase, jump: boolean): void => {
    setBlocked(null);
    const input = { ...makeInput(), routeProgress };
    const applied = jump ? jumpToDevScenario(input, p) : applyDevScenario(input, p);
    focusForPhase(p, applied.routeId);
  };

  const setLiveRouteProgress = (value: number): void => {
    const next = Math.max(0, Math.min(1, value));
    setRouteProgress(next);
    useFlightStore.getState().setProgress(next);
    if (WORLD.has(phase)) devJumpU(next);
  };

  const markObjective = (done: boolean): void => {
    if (!effectiveObjectiveId) return;
    const target = resolvedMission?.objectives.find((o) => o.id === effectiveObjectiveId);
    useMissionStore.getState().setObjective(effectiveObjectiveId, done, done ? target?.targetCount ?? 1 : 0);
  };

  return (
    <div
      ref={panelRef}
      style={{ resize: collapsed ? 'none' : 'both', overflow: 'auto', width: '28rem', maxWidth: '96vw', maxHeight: '85vh' }}
      className="pointer-events-auto fixed bottom-2 right-2 z-[70] min-w-[18rem] rounded-lg border border-sky-800/60 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-xl backdrop-blur"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-bold text-sky-300">Game State Scenario Console</div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-[10px] text-emerald-300">{phase}{paused ? ' paused' : ''}</div>
          <button onClick={toggleCollapsed} aria-label={collapsed ? 'Expand' : 'Collapse'} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">{collapsed ? '▢' : '—'}</button>
        </div>
      </div>

      {collapsed ? null : <>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded bg-slate-900/60 p-2 text-[10px]">
        <Row label="Previous" value={previousPhase ?? '-'} />
        <Row label="Character" value={selectedCharacterId ?? '-'} />
        <Row label="Mission" value={currentMissionId ?? '-'} />
        <Row label="Location" value={currentLocationId ?? '-'} />
        <Row label="Route" value={currentRouteId ?? '-'} />
        <Row label="Mission state" value={missionRuntime?.status ?? '-'} />
        <Row label="World energy" value={`${Math.round(worldRuntime.energy)}`} />
        <Row label="World stars" value={`${worldRuntime.collectibles}`} />
        <Row label="Base lift" value={baseRuntime.liftPhase} />
        <Row label="Flight nav" value={`${flightRuntime.navIndex}`} />
        <Row label="Landing" value={destinationRuntime.evaluation?.quality ?? '-'} />
        <Row label="Transform" value={transformationPreview.timelineId ?? '-'} />
      </div>

      {error && <div className="mt-2 rounded bg-rose-900/40 px-2 py-1 text-[10px] text-rose-200">Error: {error}</div>}

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Scenario inputs</div>
        <div className="space-y-1.5">
          <Field label="Target phase">
            <Select value={targetPhase} onChange={(v) => setTargetPhase(v as GamePhase)}>
              {GAME_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Previous">
            <Select value={previousChoice} onChange={setPreviousChoice}>
              <option value={AUTO_VALUE}>Current phase</option>
              {GAME_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Mission">
            <Select value={missionChoice} onChange={setMissionChoice}>
              <option value={AUTO_VALUE}>Auto mission</option>
              {missions.map((m) => <option key={m.id} value={m.id}>{formatLabel(m.id, m.name)}</option>)}
            </Select>
          </Field>
          <Field label="Character">
            <Select value={characterChoice} onChange={setCharacterChoice}>
              <option value={AUTO_VALUE}>Auto character</option>
              {characters.map((c) => <option key={c.id} value={c.id}>{formatLabel(c.id, c.name)}</option>)}
            </Select>
          </Field>
          <Field label="Location">
            <Select value={locationChoice} onChange={setLocationChoice}>
              <option value={AUTO_VALUE}>Auto location</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{formatLabel(l.id, l.name)}</option>)}
            </Select>
          </Field>
          <Field label="Route">
            <Select value={routeChoice} onChange={setRouteChoice}>
              <option value={AUTO_VALUE}>Auto route</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{formatLabel(r.id, r.name)}</option>)}
            </Select>
          </Field>
          <Field label="Timeline">
            <Select value={timelineChoice} onChange={setTimelineChoice}>
              <option value={AUTO_VALUE}>Auto timeline</option>
              {transformations.map((t) => <option key={t.id} value={t.id}>{formatLabel(t.id, t.name)}</option>)}
            </Select>
          </Field>
          <Field label="Transform">
            <Select value={transformationMode} onChange={(v) => setTransformationMode(v as TransformationMode)}>
              {TRANSFORMATION_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Mission run">
            <Select value={runtimeMode} onChange={(v) => setRuntimeMode(v as DevMissionRuntimeMode)}>
              {RUNTIME_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Route u">
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={1} step={0.01} value={routeProgress} onChange={(e) => setLiveRouteProgress(parseFloat(e.target.value))} className="min-w-0 flex-1" />
              <input type="number" min={0} max={1} step={0.01} value={routeProgress.toFixed(2)} onChange={(e) => setLiveRouteProgress(parseFloat(e.target.value))} className="w-16 rounded bg-slate-800 px-1 py-0.5 text-right text-[10px]" />
            </div>
          </Field>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
          <Row label="Resolved character" value={resolved.characterId ?? '-'} />
          <Row label="Resolved mission" value={resolved.missionId ?? '-'} />
          <Row label="Resolved location" value={resolved.locationId ?? '-'} />
          <Row label="Resolved route" value={resolved.routeId ?? '-'} />
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <Button tone="sky" onClick={() => applyScenarioToPhase(targetPhase, false)}>Apply Scenario</Button>
          <Button tone="emerald" onClick={() => applyScenarioToPhase(targetPhase, true)}>Jump + Apply</Button>
          <Button tone="amber" onClick={resetDevScenarioRuntime}>Reset Runtime</Button>
        </div>
      </div>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2">
        <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">Mission objective probe</div>
        <div className="flex gap-1">
          <select value={effectiveObjectiveId} onChange={(e) => setObjectiveId(e.target.value)} disabled={!resolvedMission || !missionRuntime} className="min-w-0 flex-1 rounded bg-slate-800 px-2 py-1 text-[10px] disabled:opacity-40">
            {!resolvedMission && <option value="">No mission</option>}
            {resolvedMission?.objectives.map((o) => <option key={o.id} value={o.id}>{formatLabel(o.id, o.kind)}</option>)}
          </select>
          <Button disabled={!effectiveObjectiveId || !missionRuntime} onClick={() => markObjective(true)}>Done</Button>
          <Button disabled={!effectiveObjectiveId || !missionRuntime} onClick={() => markObjective(false)}>Clear</Button>
        </div>
      </div>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Legal transitions</div>
        <div className="flex flex-wrap gap-1">
          {allowed.length === 0 && <span className="text-[10px] text-slate-500">(none)</span>}
          {allowed.map((to) => (
            <Button key={to} tone="sky" onClick={() => { setBlocked(null); requestTransition(to); }}>{to}</Button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <Button tone="amber" onClick={pause} disabled={paused}>Pause</Button>
          <Button tone="emerald" onClick={resume} disabled={!paused}>Resume</Button>
          <Button tone="rose" onClick={() => { resetGame(); resetDevScenarioRuntime(); }}>Reset FSM + Runtime</Button>
        </div>
      </div>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/60 p-2">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Scenario jump grid</div>
        <div className="grid grid-cols-2 gap-1">
          {GAME_PHASES.map((p) => (
            <button
              key={p}
              onClick={() => {
                setTargetPhase(p);
                applyScenarioToPhase(p, true);
              }}
              className={`truncate rounded px-1.5 py-0.5 text-left text-[10px] ${p === phase ? 'bg-emerald-600/40 text-emerald-100' : 'bg-slate-800/70 text-slate-200 hover:bg-slate-700'}`}
            >
              {p === phase ? '- ' : ''}{p}
            </button>
          ))}
        </div>
      </div>

      {blocked && <div className="mt-2 rounded bg-rose-900/40 px-2 py-1 text-[10px] text-rose-200">{blocked}</div>}
      </>}
    </div>
  );
};
