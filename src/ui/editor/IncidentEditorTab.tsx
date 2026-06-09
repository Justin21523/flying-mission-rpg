import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { useEditorRandomEventStore, incidentCfg } from '../../stores/editorRandomEventStore';
import type { ReactionMode } from '../../stores/editorRandomEventStore';
import { editorSpawn } from '../../stores/sceneEditStore';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { objKey } from '../../game/edit/sceneEditMerge';
import { spawnRandomIncident } from '../../game/incident/spawnIncident';
import { Field, inp, lbl, csv, parseCsv, useAreaOptions, useNpcOptions } from './editorShared';
import { getEditorTools } from '../../stores/editorToolStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import type { IncidentType, RescueStageType } from '../../types/incident';

const TIME_OPTS = ['any', 'dawn', 'day', 'evening', 'night'];
const WEATHER_OPTS = ['any', 'clear', 'rain', 'fog', 'storm'];

const INCIDENT_TYPES: IncidentType[] = ['fire', 'lost_person', 'road_hazard', 'fallen_cargo', 'flat_tire', 'fallen_tree', 'lost_pet', 'broken_signal', 'road_water'];
const STAGE_TYPES: RescueStageType[] = ['action', 'waypoints'];
const REACTION_MODES: ReactionMode[] = ['watch', 'approach', 'flee'];
const camPos = (): [number, number, number] => [Math.round(editorSpawn.x * 100) / 100, 1, Math.round(editorSpawn.z * 100) / 100];

// 🚨 Incidents tab — edit incident definitions (fields + stages), plus the random director config and
// nearby-NPC reaction settings. Everything auto-saves.
export const IncidentEditorTab = () => {
  const incidents = useEditorIncidentStore((s) => s.incidents);
  const selectedId = useEditorIncidentStore((s) => s.selectedId);
  const s = useEditorIncidentStore.getState();
  const sel = incidents.find((d) => d.id === selectedId) ?? null;
  const areaOptions = useAreaOptions();
  const npcOptions = useNpcOptions();
  const re = useEditorRandomEventStore();

  return (
    <div className="flex h-full gap-3 text-xs">
      {/* ── Left: list + director config ── */}
      <div className="w-52 shrink-0 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className={lbl}>Incidents ({incidents.length})</span>
          <button onClick={() => s.addIncident('rescue_hq')} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕</button>
        </div>
        {incidents.map((d) => (
          <button key={d.id} onClick={() => s.selectIncident(d.id)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${selectedId === d.id ? 'bg-violet-700/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>
            <span className="flex-1 truncate">{d.title}</span>
            <span className="text-[9px] text-slate-500">{d.spawnAreaId}</span>
          </button>
        ))}

        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className={lbl}>Random Director</div>
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={re.enabled} onChange={(e) => re.setEnabled(e.target.checked)} />
            <span className="text-[11px]">{re.enabled ? 'Director ON' : 'Director off'}</span>
          </label>
          <Field label="interval (sec)"><input type="number" min={1} value={re.intervalSec} onChange={(e) => re.setIntervalSec(parseInt(e.target.value, 10) || 1)} className={inp} /></Field>
          <Field label="max concurrent"><input type="number" min={1} value={re.maxConcurrent} onChange={(e) => re.setMaxConcurrent(parseInt(e.target.value, 10) || 1)} className={inp} /></Field>
          <button onClick={() => spawnRandomIncident()} className="w-full rounded bg-amber-700/30 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-700/50">⚡ Spawn random now</button>

          <div className="mt-1 text-[10px] text-slate-500">Per-incident enable / weight:</div>
          {incidents.map((d) => {
            const c = incidentCfg(d.id);
            return (
              <div key={d.id} className="flex items-center gap-1">
                <input type="checkbox" checked={c.enabled} onChange={(e) => re.setIncidentCfg(d.id, { enabled: e.target.checked })} />
                <span className="flex-1 truncate text-[10px] text-slate-300">{d.title}</span>
                <input type="number" min={0} step={0.5} value={c.weight} onChange={(e) => re.setIncidentCfg(d.id, { weight: parseFloat(e.target.value) || 0 })} className={inp + ' w-12'} title="weight" />
              </div>
            );
          })}
        </div>

        <div className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className={lbl}>NPC Reactions</div>
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={re.reaction.enabled} onChange={(e) => re.setReaction({ enabled: e.target.checked })} />
            <span className="text-[11px]">{re.reaction.enabled ? 'React ON' : 'off'}</span>
          </label>
          <Field label="radius"><input type="number" min={1} value={re.reaction.radius} onChange={(e) => re.setReaction({ radius: parseFloat(e.target.value) || 1 })} className={inp} /></Field>
          <Field label="mode">
            <select value={re.reaction.mode} onChange={(e) => re.setReaction({ mode: e.target.value as ReactionMode })} className={inp}>
              {REACTION_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* ── Right: selected incident ── */}
      <div className="flex-1 overflow-y-auto">
        {!sel ? <div className="pt-4 text-slate-500">Select or add an incident.</div> : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-100">{sel.title}</div>
              <div className="flex gap-1">
                <button onClick={() => s.duplicateIncident(sel.id)} className="rounded border border-emerald-700/50 bg-emerald-700/15 px-2 py-1 text-[10px] text-emerald-200">⧉ Dup</button>
                <button onClick={() => s.removeIncident(sel.id)} className="rounded border border-red-700/50 bg-red-700/15 px-2 py-1 text-[10px] text-red-200">🗑 Del</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="title"><input value={sel.title} onChange={(e) => s.updateIncident(sel.id, { title: e.target.value })} className={inp} /></Field>
              <Field label="type">
                <select value={sel.type} onChange={(e) => s.updateIncident(sel.id, { type: e.target.value as IncidentType })} className={inp}>
                  {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="spawn area">
                <select value={sel.spawnAreaId} onChange={(e) => s.updateIncident(sel.id, { spawnAreaId: e.target.value })} className={inp}>
                  {areaOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="reward exp"><input type="number" value={sel.reward.exp} onChange={(e) => s.updateIncident(sel.id, { reward: { ...sel.reward, exp: parseInt(e.target.value, 10) || 0 } })} className={inp} /></Field>
              <Field label="reward coins 🪙"><input type="number" min={0} value={sel.reward.coins ?? 0} onChange={(e) => s.updateIncident(sel.id, { reward: { ...sel.reward, coins: parseInt(e.target.value, 10) || 0 } })} className={inp} /></Field>
            </div>
            <Field label="description"><textarea value={sel.description} onChange={(e) => s.updateIncident(sel.id, { description: e.target.value })} className={inp + ' min-h-[44px] resize-y'} /></Field>
            <Field label="reward flags (, — e.g. trust:harbor_worker:10)"><input value={csv(sel.reward.flags)} onChange={(e) => s.updateIncident(sel.id, { reward: { ...sel.reward, flags: parseCsv(e.target.value) } })} className={inp} /></Field>

            {/* Gameplay tuning + target/condition dropdowns */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
              <Field label="rescue target (NPC)">
                <select value={sel.targetNpcId ?? ''} onChange={(e) => s.updateIncident(sel.id, { targetNpcId: e.target.value || undefined })} className={inp}>
                  <option value="">(none)</option>{npcOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="recommended responder">
                <select value={sel.responderCharId ?? ''} onChange={(e) => s.updateIncident(sel.id, { responderCharId: e.target.value || undefined })} className={inp}>
                  <option value="">(any)</option>{CORE_TEAM.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="required tool">
                <select value={sel.requiredToolId ?? ''} onChange={(e) => s.updateIncident(sel.id, { requiredToolId: e.target.value || undefined })} className={inp}>
                  <option value="">(none)</option>{getEditorTools().map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                </select>
              </Field>
              <Field label="difficulty (1–5)"><input type="number" min={1} max={5} value={sel.difficulty ?? 1} onChange={(e) => s.updateIncident(sel.id, { difficulty: parseInt(e.target.value, 10) || 1 })} className={inp} /></Field>
              <Field label="spawn time">
                <select value={sel.spawnTimeOfDay ?? 'any'} onChange={(e) => s.updateIncident(sel.id, { spawnTimeOfDay: e.target.value })} className={inp}>
                  {TIME_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="spawn weather">
                <select value={sel.spawnWeather ?? 'any'} onChange={(e) => s.updateIncident(sel.id, { spawnWeather: e.target.value })} className={inp}>
                  {WEATHER_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="cooldown (s)"><input type="number" min={0} value={sel.cooldownSec ?? 0} onChange={(e) => s.updateIncident(sel.id, { cooldownSec: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
              <Field label="required rescues"><input type="number" min={0} value={sel.requiredRescues ?? 0} onChange={(e) => s.updateIncident(sel.id, { requiredRescues: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
              <Field label="research reward"><input type="number" min={0} value={sel.rewardResearchPoints ?? 0} onChange={(e) => s.updateIncident(sel.id, { rewardResearchPoints: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
              <Field label="victims"><input type="number" min={0} value={sel.victimCount ?? 0} onChange={(e) => s.updateIncident(sel.id, { victimCount: parseInt(e.target.value, 10) || 0 })} className={inp} /></Field>
            </div>

            <Field label="marker position (x / y / z) — live with the gizmo">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={sel.markerPosition[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                    const next = [...sel.markerPosition] as [number, number, number];
                    next[a] = parseFloat(e.target.value) || 0;
                    s.updateIncident(sel.id, { markerPosition: next });
                  }} />
                ))}
                <button onClick={() => useWorldSelectStore.getState().select(objKey(sel.spawnAreaId, 'trigger', sel.id))} title="Select gizmo in 3D (in the incident's area)" className="rounded px-1 text-[10px] text-sky-300 hover:bg-slate-800">🎯</button>
                <button onClick={() => s.updateIncident(sel.id, { markerPosition: camPos() })} className="rounded px-1 text-[10px] text-sky-300 hover:bg-slate-800">cam</button>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="safety title"><input value={sel.safetyLesson.title} onChange={(e) => s.updateIncident(sel.id, { safetyLesson: { ...sel.safetyLesson, title: e.target.value } })} className={inp} /></Field>
              <Field label="safety lesson"><input value={sel.safetyLesson.lesson} onChange={(e) => s.updateIncident(sel.id, { safetyLesson: { ...sel.safetyLesson, lesson: e.target.value } })} className={inp} /></Field>
            </div>

            {/* Stages */}
            <div className="flex items-center justify-between pt-1">
              <span className={lbl}>Stages ({sel.stages.length})</span>
              <button onClick={() => s.addStage()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ stage</button>
            </div>
            {sel.stages.map((stage, i) => (
              <div key={stage.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">#{i + 1}</span>
                  <select value={stage.type} onChange={(e) => s.updateStage(i, { type: e.target.value as RescueStageType })} className={inp + ' w-28'}>
                    {STAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={stage.title} onChange={(e) => s.updateStage(i, { title: e.target.value })} className={inp + ' flex-1'} placeholder="title" />
                  <button onClick={() => s.removeStage(i)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">✕</button>
                </div>
                <input value={stage.description} onChange={(e) => s.updateStage(i, { description: e.target.value })} className={inp} placeholder="description" />
                <input value={stage.retryHint} onChange={(e) => s.updateStage(i, { retryHint: e.target.value })} className={inp} placeholder="retry hint" />
                {stage.type === 'action' ? (
                  <div className="flex gap-2">
                    <Field label="action count"><input type="number" min={1} value={stage.actionCount ?? 8} onChange={(e) => s.updateStage(i, { actionCount: parseInt(e.target.value, 10) || 1 })} className={inp} /></Field>
                    <Field label="time limit (s)"><input type="number" min={1} value={stage.timeLimitSeconds ?? 20} onChange={(e) => s.updateStage(i, { timeLimitSeconds: parseInt(e.target.value, 10) || 1 })} className={inp} /></Field>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Waypoints ({stage.waypointPositions?.length ?? 0})</span>
                      <button onClick={() => s.addWaypoint(i, camPos())} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">➕ at cam</button>
                    </div>
                    {(stage.waypointPositions ?? []).map((wp, wi) => (
                      <div key={wi} className="flex items-center gap-1">
                        {([0, 1, 2] as const).map((a) => (
                          <input key={a} type="number" step={0.5} value={wp[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                            const next = [...wp] as [number, number, number];
                            next[a] = parseFloat(e.target.value) || 0;
                            s.updateWaypoint(i, wi, next);
                          }} />
                        ))}
                        <button onClick={() => s.removeWaypoint(i, wi)} className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-800">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
