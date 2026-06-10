import { useState } from 'react';
import { useEditorTrafficScenarioStore } from '../../stores/editorTrafficScenarioStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { startScenario } from '../../game/incident/trafficIncidentRunner';
import { INCIDENT_CATEGORIES, type IncidentCategory, type IncidentAction, type IncidentResolutionCondition, type IncidentTimelineStep } from '../../types/trafficIncident';
import { SOURCE_CONFIDENCES, type SourceConfidence } from '../../types/character';
import { Field, inp, lbl } from './editorShared';
import { IdSelect } from './idPickers';
import { IncidentActionEditor } from './IncidentActionEditor';

// 🚧 Traffic Scenarios — full in-UI authoring for the Traffic Incident Director: director config + per-scenario
// fields, setup / timeline / cleanup action chains, and resolution conditions (no more JSON-only deep edits).
const num = (v: string, d = 0) => { const n = parseFloat(v); return Number.isNaN(n) ? d : n; };
const WEATHERS = ['clear', 'rain', 'fog', 'storm'];

// Reusable list of IncidentActions with add / change / remove.
const ActionList = ({ label, actions, onChange }: { label: string; actions: IncidentAction[]; onChange: (a: IncidentAction[]) => void }) => (
  <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
    <div className="flex items-center justify-between"><span className={lbl}>{label} ({actions.length})</span>
      <button onClick={() => onChange([...actions, { type: 'emitEvent', event: '' }])} className="rounded bg-sky-700/30 px-1.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕</button></div>
    <div className="mt-1 space-y-1">
      {actions.map((a, i) => (
        <IncidentActionEditor key={i} value={a} onChange={(na) => onChange(actions.map((x, j) => (j === i ? na : x)))} onRemove={() => onChange(actions.filter((_, j) => j !== i))} />
      ))}
    </div>
  </div>
);

type CondKind = IncidentResolutionCondition['type'];
const COND_LABEL: Record<CondKind, string> = { victimRescued: 'victim rescued', timeout: 'timeout (s)', flagSet: 'flag set', playerReached: 'player reached (radius)' };
function condDefault(k: CondKind): IncidentResolutionCondition {
  if (k === 'timeout') return { type: 'timeout', seconds: 60 };
  if (k === 'flagSet') return { type: 'flagSet', flag: '' };
  if (k === 'playerReached') return { type: 'playerReached', radius: 4 };
  return { type: 'victimRescued' };
}

const ConditionRow = ({ c, onChange, onRemove }: { c: IncidentResolutionCondition; onChange: (v: IncidentResolutionCondition) => void; onRemove: () => void }) => (
  <div className="flex items-end gap-1.5">
    <select value={c.type} onChange={(e) => onChange(condDefault(e.target.value as CondKind))} className={inp}>
      {(Object.keys(COND_LABEL) as CondKind[]).map((k) => <option key={k} value={k}>{COND_LABEL[k]}</option>)}
    </select>
    {c.type === 'timeout' && <input type="number" step={1} value={c.seconds} onChange={(e) => onChange({ type: 'timeout', seconds: num(e.target.value) })} className={inp + ' w-20'} />}
    {c.type === 'flagSet' && <input value={c.flag} onChange={(e) => onChange({ type: 'flagSet', flag: e.target.value })} placeholder="flag" className={inp + ' flex-1'} />}
    {c.type === 'playerReached' && <input type="number" step={0.5} value={c.radius} onChange={(e) => onChange({ type: 'playerReached', radius: num(e.target.value) })} className={inp + ' w-20'} />}
    <button onClick={onRemove} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
  </div>
);

export const TrafficScenarioEditor = () => {
  const ts = useEditorTrafficScenarioStore();
  const rescueOptions = useEditorIncidentStore((s) => s.incidents).map((d) => ({ id: d.id, label: d.title }));
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🚧 Traffic Scenarios ({ts.scenarios.length})</span>
        <button onClick={() => setOpenId(ts.addScenario())} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ scenario</button>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <label className="flex items-center gap-1.5 text-slate-300"><input type="checkbox" checked={ts.enabled} onChange={(e) => ts.setDirector({ enabled: e.target.checked })} className="accent-sky-500" /><span className="text-[11px]">{ts.enabled ? 'Director ON' : 'Director off'}</span></label>
        <Field label="interval (s)"><input type="number" min={1} value={ts.intervalSec} onChange={(e) => ts.setDirector({ intervalSec: num(e.target.value, 1) })} className={inp + ' w-20'} /></Field>
        <Field label="max concurrent"><input type="number" min={1} value={ts.maxConcurrent} onChange={(e) => ts.setDirector({ maxConcurrent: num(e.target.value, 1) })} className={inp + ' w-20'} /></Field>
      </div>

      {ts.scenarios.map((d) => {
        const open = openId === d.id;
        return (
          <div key={d.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
            <div className="flex items-center gap-1.5">
              <input type="checkbox" checked={d.enabled} onChange={(e) => ts.updateScenario(d.id, { enabled: e.target.checked })} className="accent-sky-500" />
              <input value={d.name} onChange={(e) => ts.updateScenario(d.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="scenario name" />
              <button onClick={() => startScenario(d.id)} title="Trigger now" className="rounded px-1 text-[11px] text-sky-300 hover:bg-slate-800">▶</button>
              <button onClick={() => setOpenId(open ? null : d.id)} className="rounded px-1 text-[11px] text-slate-300 hover:bg-slate-800">{open ? '▾' : '▸'}</button>
              <button onClick={() => ts.removeScenario(d.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
            </div>

            {open && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="category"><select value={d.category} onChange={(e) => ts.updateScenario(d.id, { category: e.target.value as IncidentCategory })} className={inp}>{INCIDENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
                  <Field label="severity"><input type="number" min={1} max={5} value={d.severity} onChange={(e) => ts.updateScenario(d.id, { severity: num(e.target.value, 1) })} className={inp} /></Field>
                  <Field label="weight"><input type="number" step={0.5} value={d.weight} onChange={(e) => ts.updateScenario(d.id, { weight: num(e.target.value) })} className={inp} /></Field>
                  <Field label="cooldown (s)"><input type="number" value={d.cooldown} onChange={(e) => ts.updateScenario(d.id, { cooldown: num(e.target.value) })} className={inp} /></Field>
                  <Field label="max instances"><input type="number" min={1} value={d.maxConcurrentInstances} onChange={(e) => ts.updateScenario(d.id, { maxConcurrentInstances: num(e.target.value, 1) })} className={inp} /></Field>
                  <Field label="rescue incident"><IdSelect value={d.rescueIncidentId} onChange={(v) => ts.updateScenario(d.id, { rescueIncidentId: v })} options={rescueOptions} placeholder="(none)" /></Field>
                  <Field label="source confidence"><select value={d.sourceConfidence ?? 'GameAdaptation'} onChange={(e) => ts.updateScenario(d.id, { sourceConfidence: e.target.value as SourceConfidence })} className={inp}>{SOURCE_CONFIDENCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="reward coins (×sev)"><input type="number" value={d.rewardCoins ?? ''} placeholder={`${d.severity * 10}`} onChange={(e) => ts.updateScenario(d.id, { rewardCoins: e.target.value === '' ? undefined : num(e.target.value) })} className={inp} /></Field>
                  <Field label="req. rescues (license)"><input type="number" value={d.requiredLicense ?? ''} placeholder="0" onChange={(e) => ts.updateScenario(d.id, { requiredLicense: e.target.value === '' ? undefined : num(e.target.value) })} className={inp} /></Field>
                  <Field label="onlookers (def=sev)"><input type="number" value={d.onlookerCount ?? ''} placeholder={`${d.severity}`} onChange={(e) => ts.updateScenario(d.id, { onlookerCount: e.target.value === '' ? undefined : num(e.target.value) })} className={inp} /></Field>
                  <Field label="affects character"><input value={d.affectsCharacterId ?? ''} onChange={(e) => ts.updateScenario(d.id, { affectsCharacterId: e.target.value || undefined })} className={inp} placeholder="(none)" /></Field>
                  <Field label="trust lost if missed"><input type="number" value={d.failTrust ?? ''} placeholder="1" onChange={(e) => ts.updateScenario(d.id, { failTrust: e.target.value === '' ? undefined : num(e.target.value) })} className={inp} /></Field>
                </div>
                {/* Spawn gating (the director honours these) — editable here, not just via JSON. */}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="min world-time (min, 0–1440)"><input type="number" value={d.minWorldTime ?? ''} placeholder="(any)" onChange={(e) => ts.updateScenario(d.id, { minWorldTime: e.target.value === '' ? undefined : num(e.target.value) })} className={inp} /></Field>
                  <Field label="max world-time (min, 0–1440)"><input type="number" value={d.maxWorldTime ?? ''} placeholder="(any)" onChange={(e) => ts.updateScenario(d.id, { maxWorldTime: e.target.value === '' ? undefined : num(e.target.value) })} className={inp} /></Field>
                </div>
                <Field label="weather (none = any)">
                  <div className="flex flex-wrap gap-1">
                    {WEATHERS.map((w) => {
                      const on = (d.weatherConditions ?? []).includes(w);
                      return <button key={w} onClick={() => ts.updateScenario(d.id, { weatherConditions: on ? (d.weatherConditions ?? []).filter((x) => x !== w) : [...(d.weatherConditions ?? []), w] })} className={`rounded px-1.5 py-0.5 text-[10px] ${on ? 'bg-sky-600/40 text-sky-100' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{w}</button>;
                    })}
                  </div>
                </Field>

                <ActionList label="setup actions" actions={d.setupActions} onChange={(a) => ts.updateScenario(d.id, { setupActions: a })} />

                <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
                  <div className="flex items-center justify-between"><span className={lbl}>timeline ({d.timeline.length} steps)</span>
                    <button onClick={() => ts.updateScenario(d.id, { timeline: [...d.timeline, { atSeconds: 0, actions: [] }] })} className="rounded bg-sky-700/30 px-1.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕ step</button></div>
                  {d.timeline.map((step, si) => {
                    const setStep = (patch: Partial<IncidentTimelineStep>) => ts.updateScenario(d.id, { timeline: d.timeline.map((x, j) => (j === si ? { ...x, ...patch } : x)) });
                    return (
                      <div key={si} className="mt-1 rounded border border-slate-700/40 p-1">
                        <div className="flex items-center gap-1.5">
                          <span className={lbl}>at (s)</span>
                          <input type="number" step={0.5} value={step.atSeconds} onChange={(e) => setStep({ atSeconds: num(e.target.value) })} className={inp + ' w-20'} />
                          <button onClick={() => ts.updateScenario(d.id, { timeline: d.timeline.filter((_, j) => j !== si) })} className="ml-auto rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑 step</button>
                        </div>
                        <div className="mt-1"><ActionList label="actions" actions={step.actions} onChange={(a) => setStep({ actions: a })} /></div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
                  <div className="flex items-center justify-between"><span className={lbl}>resolution (any) ({d.resolutionConditions.length})</span>
                    <button onClick={() => ts.updateScenario(d.id, { resolutionConditions: [...d.resolutionConditions, { type: 'timeout', seconds: 60 }] })} className="rounded bg-sky-700/30 px-1.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕</button></div>
                  <div className="mt-1 space-y-1">
                    {d.resolutionConditions.map((c, ci) => (
                      <ConditionRow key={ci} c={c} onChange={(nc) => ts.updateScenario(d.id, { resolutionConditions: d.resolutionConditions.map((x, j) => (j === ci ? nc : x)) })} onRemove={() => ts.updateScenario(d.id, { resolutionConditions: d.resolutionConditions.filter((_, j) => j !== ci) })} />
                    ))}
                  </div>
                </div>

                <ActionList label="cleanup actions" actions={d.cleanupActions} onChange={(a) => ts.updateScenario(d.id, { cleanupActions: a })} />
              </>
            )}
          </div>
        );
      })}
      <div className="text-[9px] text-slate-500">Director picks a path in the player's area, runs setup, advances the timeline, and resolves on any condition (player-reached / timeout / flag) → cleanup restores the road.</div>
    </div>
  );
};
