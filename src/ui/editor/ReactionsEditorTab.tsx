import { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useWorldSelectStore } from '../../stores/worldSelectStore';
import { useEditorCollisionStore } from '../../stores/editorCollisionStore';
import { useEditorAnimationStore } from '../../stores/editorAnimationStore';
import { COLLISION_OBJECT_TYPES, type CollisionObjectType, type CollisionPhase, type ReactionAction } from '../../types/collision';
import { ANIMATION_LAYERS, type AnimationLayer } from '../../types/animationDef';
import { SURFACE_TYPES, type SurfaceType } from '../../types/surface';
import { Field, inp, lbl, Check, csv, parseCsv, usePathOptions, useAnimationOptions, useAreaOptions } from './editorShared';
import { focusCameraOn } from '../../game/edit/cameraFocus';
import { IdSelect } from './idPickers';
import { ActionEditor } from './ActionEditor';

// 💥 Reactions tab — authoring for the collision-reaction systems (Rules · Objects · Animation mapping). Pure
// data editing; the reaction engine + CollisionTestLayer read the same stores. 🎯 focuses an object's 3D handle.
type Section = 'rules' | 'objects' | 'animations';
const focus = (key: string, pos?: [number, number, number]) => {
  useWorldSelectStore.getState().select(key);
  if (pos) focusCameraOn(pos[0], pos[1], pos[2]);
};
const AreaSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const areas = useAreaOptions();
  return <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>{areas.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>;
};
const PHASES: CollisionPhase[] = ['enter', 'stay', 'exit', 'impact'];
const num = (v: string, d = 0) => { const n = parseFloat(v); return Number.isNaN(n) ? d : n; };
const numU = (v: string) => { const n = parseFloat(v); return Number.isNaN(n) ? undefined : n; };

// Compact multi-select as toggle chips.
function MultiToggle<T extends string>({ all, value, onChange }: { all: readonly T[]; value: T[]; onChange: (v: T[]) => void }) {
  const toggle = (t: T) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  return (
    <div className="flex flex-wrap gap-1">
      {all.map((t) => (
        <button key={t} onClick={() => toggle(t)} className={`rounded px-1.5 py-0.5 text-[10px] ${value.includes(t) ? 'bg-sky-600/40 text-sky-100' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{t}</button>
      ))}
    </div>
  );
}

export const ReactionsEditorTab = () => {
  const [section, setSection] = useState<Section>('rules');
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-1">
        {(['rules', 'objects', 'animations'] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`rounded px-2.5 py-1 text-[11px] font-semibold ${section === s ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}>
            {s === 'rules' ? '⚙ Rules' : s === 'objects' ? '🧱 Objects' : '🎞 Animations'}
          </button>
        ))}
      </div>
      {section === 'rules' ? <RulesSection /> : section === 'objects' ? <ObjectsSection /> : <AnimationsSection />}
    </div>
  );
};

// ── Rules ──────────────────────────────────────────────────────────────────────
const RulesSection = () => {
  const rules = useEditorCollisionStore((s) => s.rules);
  const st = useEditorCollisionStore.getState();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>⚙ Collision Rules ({rules.length})</span>
        <button onClick={() => st.addRule()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ rule</button>
      </div>
      {rules.map((r) => (
        <div key={r.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <Check label="" checked={r.enabled} onChange={(v) => st.updateRule(r.id, { enabled: v })} />
            <input value={r.name} onChange={(e) => st.updateRule(r.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="rule name" />
            <span className="text-[10px] text-slate-500">prio</span>
            <input type="number" step={1} value={r.priority} onChange={(e) => st.updateRule(r.id, { priority: num(e.target.value) })} className={inp + ' w-14'} />
            <button onClick={() => st.removeRule(r.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <Field label="source types"><MultiToggle all={COLLISION_OBJECT_TYPES} value={r.sourceTypes} onChange={(v) => st.updateRule(r.id, { sourceTypes: v })} /></Field>
          <Field label="target types"><MultiToggle all={COLLISION_OBJECT_TYPES} value={r.targetTypes} onChange={(v) => st.updateRule(r.id, { targetTypes: v })} /></Field>
          <Field label="phases"><MultiToggle all={PHASES} value={r.phases} onChange={(v) => st.updateRule(r.id, { phases: v })} /></Field>
          <div className="grid grid-cols-4 gap-2">
            <Field label="min speed"><input type="number" step={0.5} value={r.minImpactSpeed ?? ''} onChange={(e) => st.updateRule(r.id, { minImpactSpeed: numU(e.target.value) })} className={inp} /></Field>
            <Field label="max speed"><input type="number" step={0.5} value={r.maxImpactSpeed ?? ''} onChange={(e) => st.updateRule(r.id, { maxImpactSpeed: numU(e.target.value) })} className={inp} /></Field>
            <Field label="cooldown"><input type="number" step={0.5} value={r.cooldown} onChange={(e) => st.updateRule(r.id, { cooldown: num(e.target.value) })} className={inp} /></Field>
            <Field label="once/contact"><div className="pt-1"><Check label="" checked={r.oncePerContact} onChange={(v) => st.updateRule(r.id, { oncePerContact: v })} /></div></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="required target tags"><input value={csv(r.requiredTargetTags)} onChange={(e) => st.updateRule(r.id, { requiredTargetTags: parseCsv(e.target.value) })} className={inp} placeholder="(any)" /></Field>
            <Field label="blocked target tags"><input value={csv(r.blockedTargetTags)} onChange={(e) => st.updateRule(r.id, { blockedTargetTags: parseCsv(e.target.value) })} className={inp} placeholder="(none)" /></Field>
          </div>

          <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
            <div className="flex items-center justify-between"><span className={lbl}>actions ({r.actions.length})</span>
              <button onClick={() => st.updateRule(r.id, { actions: [...r.actions, { type: 'emitGameEvent', event: '' }] })} className="rounded bg-sky-700/30 px-1.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕ action</button></div>
            <div className="mt-1 space-y-1">
              {r.actions.map((a, i) => (
                <ActionEditor
                  key={i}
                  value={a}
                  onChange={(na: ReactionAction) => st.updateRule(r.id, { actions: r.actions.map((x, j) => (j === i ? na : x)) })}
                  onRemove={() => st.updateRule(r.id, { actions: r.actions.filter((_, j) => j !== i) })}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Objects ──────────────────────────────────────────────────────────────────
const ObjectsSection = () => {
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const objects = useEditorCollisionStore((s) => s.objects);
  const st = useEditorCollisionStore.getState();
  const pathOpts = usePathOptions();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🧱 Collision Objects ({objects.length})</span>
        <button onClick={() => st.addObject(areaId)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ at cam</button>
      </div>
      {objects.map((o) => (
        <div key={o.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <input type="color" value={o.color ?? '#94a3b8'} onChange={(e) => st.updateObject(o.id, { color: e.target.value })} className="h-6 w-7 shrink-0 rounded bg-slate-800" />
            <input value={o.label ?? ''} onChange={(e) => st.updateObject(o.id, { label: e.target.value })} className={inp + ' flex-1'} placeholder="label" />
            <button onClick={() => focus(`${o.id}#collobj`, o.position)} title="Select gizmo in 3D" className="rounded px-1 text-[11px] text-sky-300 hover:bg-slate-800">🎯</button>
            <button onClick={() => st.removeObject(o.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="map area"><AreaSelect value={o.areaId} onChange={(v) => st.updateObject(o.id, { areaId: v })} /></Field>
            <Field label="object type"><select value={o.objectType} onChange={(e) => st.updateObject(o.id, { objectType: e.target.value as CollisionObjectType })} className={inp}>{COLLISION_OBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="surface type"><select value={o.surfaceType ?? ''} onChange={(e) => st.updateObject(o.id, { surfaceType: (e.target.value || undefined) as SurfaceType | undefined })} className={inp}><option value="">(none)</option>{SURFACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          </div>
          <Field label="size (x / y / z)">
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((a) => (
                <input key={a} type="number" step={0.5} value={o.size[a]} className={inp + ' w-0 flex-1'} onChange={(e) => { const next = [...o.size] as [number, number, number]; next[a] = num(e.target.value, 1); st.updateObject(o.id, { size: next }); }} />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Check label="solid (player bumps)" checked={o.solid} onChange={(v) => st.updateObject(o.id, { solid: v })} />
            <Check label="enabled" checked={o.enabled} onChange={(v) => st.updateObject(o.id, { enabled: v })} />
            <Field label="impact speed"><input type="number" step={0.5} value={o.impactSpeed ?? ''} onChange={(e) => st.updateObject(o.id, { impactSpeed: numU(e.target.value) })} className={inp} placeholder="4" /></Field>
            <Field label="linked path"><IdSelect value={o.pathId} onChange={(v) => st.updateObject(o.id, { pathId: v })} options={pathOpts} placeholder="(none)" /></Field>
          </div>
          <Field label="tags (comma-separated)"><input value={csv(o.tags)} onChange={(e) => st.updateObject(o.id, { tags: parseCsv(e.target.value) })} className={inp} /></Field>
        </div>
      ))}
    </div>
  );
};

// ── Animations ─────────────────────────────────────────────────────────────────
const AnimationsSection = () => {
  const definitions = useEditorAnimationStore((s) => s.definitions);
  const profiles = useEditorAnimationStore((s) => s.profiles);
  const st = useEditorAnimationStore.getState();
  const animOpts = useAnimationOptions();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🎞 Animation Definitions ({definitions.length})</span>
        <button onClick={() => st.addDefinition()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ animation</button>
      </div>
      {definitions.map((d) => (
        <div key={d.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <input value={d.displayName} onChange={(e) => st.updateDefinition(d.id, { displayName: e.target.value })} className={inp + ' flex-1'} placeholder="display name" />
            <button onClick={() => st.removeDefinition(d.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="clip name (in the GLB)"><input value={d.clipName} onChange={(e) => st.updateDefinition(d.id, { clipName: e.target.value })} className={inp} placeholder="e.g. Wave" /></Field>
            <Field label="layer"><select value={d.layer} onChange={(e) => st.updateDefinition(d.id, { layer: e.target.value as AnimationLayer })} className={inp}>{ANIMATION_LAYERS.map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
            <Field label="fade in"><input type="number" step={0.05} value={d.fadeIn} onChange={(e) => st.updateDefinition(d.id, { fadeIn: num(e.target.value) })} className={inp} /></Field>
            <Field label="fade out"><input type="number" step={0.05} value={d.fadeOut} onChange={(e) => st.updateDefinition(d.id, { fadeOut: num(e.target.value) })} className={inp} /></Field>
            <Field label="speed"><input type="number" step={0.1} value={d.speed} onChange={(e) => st.updateDefinition(d.id, { speed: num(e.target.value, 1) })} className={inp} /></Field>
            <Field label="priority"><input type="number" step={1} value={d.priority} onChange={(e) => st.updateDefinition(d.id, { priority: num(e.target.value) })} className={inp} /></Field>
          </div>
          <div className="flex gap-3">
            <Check label="loop" checked={d.loop} onChange={(v) => st.updateDefinition(d.id, { loop: v })} />
            <Check label="interruptible" checked={d.interruptible} onChange={(v) => st.updateDefinition(d.id, { interruptible: v })} />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/40 px-2 py-1.5">
        <span className={lbl}>🔗 Reaction Profiles ({profiles.length})</span>
        <button onClick={() => st.addProfile()} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ profile</button>
      </div>
      {profiles.map((p) => (
        <div key={p.id} className="space-y-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
          <div className="flex items-center gap-1.5">
            <input value={p.name} onChange={(e) => st.updateProfile(p.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="profile name" />
            <select value={p.forKind} onChange={(e) => st.updateProfile(p.id, { forKind: e.target.value as 'humanoid' | 'vehicle' })} className={inp + ' w-28'}><option value="humanoid">humanoid</option><option value="vehicle">vehicle</option></select>
            <button onClick={() => st.removeProfile(p.id)} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
            <div className="flex items-center justify-between"><span className={lbl}>reaction → animation</span>
              <button onClick={() => st.updateProfile(p.id, { entries: [...p.entries, { reaction: '', animationId: '' }] })} className="rounded bg-sky-700/30 px-1.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕ row</button></div>
            {p.entries.map((en, i) => (
              <div key={i} className="mt-1 flex items-center gap-1">
                <input value={en.reaction} onChange={(e) => st.updateProfile(p.id, { entries: p.entries.map((x, j) => (j === i ? { ...x, reaction: e.target.value } : x)) })} className={inp + ' flex-1'} placeholder="reaction key" />
                <div className="min-w-[8rem] flex-1"><IdSelect value={en.animationId} onChange={(v) => st.updateProfile(p.id, { entries: p.entries.map((x, j) => (j === i ? { ...x, animationId: v ?? '' } : x)) })} options={animOpts} placeholder="(animation)" /></div>
                <button onClick={() => st.updateProfile(p.id, { entries: p.entries.filter((_, j) => j !== i) })} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
