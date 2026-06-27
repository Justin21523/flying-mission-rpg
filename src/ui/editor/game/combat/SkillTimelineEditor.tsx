import { useState } from 'react';
import { nanoid } from 'nanoid';
import type { CombatSkillDefinition, SkillTimelineEvent } from '../../../../types/game/combat';
import { deriveSkillPhases } from '../../../../game/combat/skillToTimeline';
import { playSkillTimelinePreview } from '../../../../game/combat/skillTimelinePreview';
import { previewEffect } from '../../../../game/vfx/CinematicVfxDirector';
import { playTimelineSound } from '../../../../game/audio/playTimelineSound';
import { SOUND_OPTIONS } from '../../../../game/audio/soundOptions';
import { useEditorCombatEffectStore } from '../../../../stores/game/editorCombatStore';
import { rekeySkillEvent } from '../../../../game/editor/timelineAdapters';
import { inp, lbl, Check, MoveButtons } from '../../editorShared';
import { NumRow, SelectRow, TextRow } from '../CollectionEditor';
import { PresetBar } from '../../timeline/PresetBar';

const KIND_OPTIONS = [{ value: 'effect', label: 'effect' }, { value: 'sound', label: 'sound' }];

// Edit-Mode timeline of timed VFX/SFX triggers for a combat skill. The top bar VISUALIZES the skill's phases
// (windup / active / recovery) derived from its existing scalar timing; below, authored events fire effects or
// sounds at a time during the cast. ▶ plays the whole thing in the live scene (real-time, fire-and-forget).
export const SkillTimelineEditor = ({ def, update }: { def: CombatSkillDefinition; update: (p: Partial<CombatSkillDefinition>) => void }) => {
  const effects = useEditorCombatEffectStore((s) => s.items);
  const events = def.timelineEvents ?? [];
  const [selId, setSelId] = useState<string | null>(events[0]?.eventId ?? null);
  const [addKind, setAddKind] = useState<'effect' | 'sound'>('effect');
  const sel = events.find((e) => e.eventId === selId) ?? null;
  const phases = deriveSkillPhases(def);

  const setEvents = (next: SkillTimelineEvent[]) => update({ timelineEvents: next });
  const patch = (id: string, p: Partial<SkillTimelineEvent>) => setEvents(events.map((e) => (e.eventId === id ? { ...e, ...p } : e)));
  const addEvent = () => {
    const e: SkillTimelineEvent = {
      eventId: `sev_${nanoid(6)}`,
      name: addKind === 'effect' ? 'Effect' : 'Sound',
      timeSeconds: Math.round(phases.windupEnd * 10) / 10,
      kind: addKind,
      effectDefinitionId: addKind === 'effect' ? (effects[0]?.id ?? undefined) : undefined,
      soundId: addKind === 'sound' ? 'boost' : undefined,
      enabled: true,
    };
    setEvents([...events, e]);
    setSelId(e.eventId);
  };
  const previewOne = (e: SkillTimelineEvent) => {
    if (e.kind === 'effect' && e.effectDefinitionId) previewEffect(e.effectDefinitionId);
    else if (e.kind === 'sound' && e.soundId) playTimelineSound(e.soundId);
  };

  const pct = (t: number) => `${Math.max(0, Math.min(100, (t / phases.total) * 100))}%`;

  return (
    <div className="space-y-2 rounded border border-cyan-700/40 bg-cyan-950/10 p-2">
      <div className="flex items-center gap-1">
        <span className={lbl}>🎞 Skill Timeline · {events.length}</span>
        <select value={addKind} onChange={(e) => setAddKind(e.target.value as 'effect' | 'sound')} className={inp + ' ml-auto w-24'}>
          {KIND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={addEvent} className="rounded bg-cyan-700/40 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-700/60">+ Add</button>
        <button onClick={() => playSkillTimelinePreview(def)} title="Play the whole timeline in the live scene" className="rounded bg-emerald-700/40 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/60">▶ Play</button>
      </div>

      {/* Derived phase bar (read-only): windup → active → recovery, with event markers. */}
      <div className="relative h-4 w-full overflow-hidden rounded bg-slate-900/70" title={`total ${phases.total.toFixed(2)}s`}>
        <div className="absolute inset-y-0 bg-slate-700/50" style={{ left: 0, width: pct(phases.windupEnd) }} title="windup" />
        <div className="absolute inset-y-0 bg-rose-700/50" style={{ left: pct(phases.windupEnd), width: pct(phases.activeEnd - phases.windupEnd) }} title="active (hits land)" />
        <div className="absolute inset-y-0 bg-slate-800/40" style={{ left: pct(phases.activeEnd), right: 0 }} title="recovery" />
        {events.map((e) => (
          <div key={e.eventId} className={`absolute inset-y-0 w-0.5 ${e.kind === 'effect' ? 'bg-cyan-300' : 'bg-amber-300'} ${e.enabled ? '' : 'opacity-30'}`} style={{ left: pct(e.timeSeconds) }} title={`${e.name} @ ${e.timeSeconds}s`} />
        ))}
      </div>
      <p className="text-[9px] text-slate-500">windup {phases.windupEnd.toFixed(2)}s · active→{phases.activeEnd.toFixed(2)}s · total {phases.total.toFixed(2)}s — bars: <span className="text-cyan-300">effect</span> / <span className="text-amber-300">sound</span></p>

      <PresetBar
        docKind="skill"
        docId={def.id}
        docLabel={def.name}
        characterId={def.ownerCharacterId}
        eventPresetKind="skill.event"
        fullPresetKind="skill.full"
        eventNoun="event"
        events={events}
        setEvents={(next) => setEvents(next as SkillTimelineEvent[])}
        selectedEvent={sel}
        selectedName={sel?.name}
        rekeyEvent={(e) => rekeySkillEvent(e as SkillTimelineEvent)}
        getDoc={() => def}
        applyDoc={(doc) => update(doc as Partial<CombatSkillDefinition>)}
      />

      <div className="space-y-0.5">
        {events.map((e, i) => (
          <div key={e.eventId} className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${selId === e.eventId ? 'border-cyan-500/70 bg-cyan-950/30' : 'border-slate-800 bg-slate-900/50'} ${e.enabled ? '' : 'opacity-50'}`}>
            <input type="checkbox" checked={e.enabled} onChange={(ev) => patch(e.eventId, { enabled: ev.target.checked })} className="accent-cyan-500" />
            <button onClick={() => setSelId(e.eventId)} className="flex-1 truncate text-left text-[11px] text-slate-200 hover:text-cyan-200">{e.name} · {e.kind}</button>
            <span className="font-mono text-[9px] text-slate-500">{e.timeSeconds.toFixed(1)}s</span>
            <button onClick={() => previewOne(e)} title="Preview this trigger now" className="rounded bg-emerald-800/50 px-1 text-[10px] text-emerald-100 hover:bg-emerald-700/60">▶</button>
            <MoveButtons index={i} count={events.length} onMove={(d) => { const n = events.slice(); const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setEvents(n); }} />
            <button onClick={() => { const copy = { ...rekeySkillEvent(e), name: `${e.name} copy` }; setEvents([...events, copy]); setSelId(copy.eventId); }} title="Duplicate" className="rounded bg-slate-800 px-1 text-[10px] text-slate-300 hover:bg-slate-700">⧉</button>
            <button onClick={() => { setEvents(events.filter((x) => x.eventId !== e.eventId)); if (selId === e.eventId) setSelId(null); }} title="Delete" className="rounded bg-rose-800/40 px-1 text-[10px] text-rose-200 hover:bg-rose-800/60">✕</button>
          </div>
        ))}
        {events.length === 0 && <p className="text-[10px] text-slate-500">No timeline events — this skill fires its single Effect def id as before. Add an effect/sound trigger to author a timeline.</p>}
      </div>

      {sel && (
        <div className="space-y-1 rounded border border-cyan-800/40 bg-slate-950/40 p-1.5">
          <TextRow label="Name" value={sel.name} onChange={(v) => patch(sel.eventId, { name: v })} />
          <div className="grid grid-cols-2 gap-1.5">
            <NumRow label="Time (s)" value={sel.timeSeconds} step={0.05} min={0} onChange={(v) => patch(sel.eventId, { timeSeconds: v })} />
            <SelectRow label="Kind" value={sel.kind} options={KIND_OPTIONS} onChange={(v) => patch(sel.eventId, { kind: v as 'effect' | 'sound' })} />
          </div>
          {sel.kind === 'effect' ? (
            <SelectRow label="Effect def id" value={sel.effectDefinitionId ?? ''} options={[{ value: '', label: '(none)' }, ...effects.map((e) => ({ value: e.id, label: e.id }))]} onChange={(v) => patch(sel.eventId, { effectDefinitionId: v || undefined })} />
          ) : (
            <SelectRow label="Sound" value={sel.soundId ?? ''} options={SOUND_OPTIONS} onChange={(v) => patch(sel.eventId, { soundId: v || undefined })} />
          )}
          <Check label="Enabled" checked={sel.enabled} onChange={(v) => patch(sel.eventId, { enabled: v })} />
        </div>
      )}
    </div>
  );
};
