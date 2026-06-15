import { useState } from 'react';
import type { TransformationDefinition } from '../../../../types/game/transformation';
import type { EffectParameters, EffectTypeV2, TransformationEffectConfig } from '../../../../types/game/transformationEffects';
import { useTransformationPreviewStore } from '../../../../stores/game/transformationPreviewStore';
import { effectEntriesByCategory, getEffectEntry } from '../../../../game/transformation/effects/registry';
import { createDefaultEffectConfig } from '../../../../game/transformation/effects/createEffect';
import { inp, lbl, Check, MoveButtons } from '../../editorShared';
import { NumRow, SelectRow, ColorRow, TextRow } from '../CollectionEditor';

// Effect sound options — synth sfx (always audible) + a few audio cue ids.
const SOUND_OPTIONS = ['', 'transform', 'ability', 'boost', 'ring', 'warn', 'land', 'coin', 'blip', 'pickup', 'objective', 'fx.boost', 'fx.ring', 'fx.warn', 'ui.launch', 'ui.confirm'].map((v) => ({ value: v, label: v || '(none)' }));

// Registry-driven v2 effects editor. The effect-type dropdown + per-effect parameter panel are generated from
// the effect registry, so every registered effect is authorable with its own fields. Edits write straight to
// the transformation def → the runner re-evaluates at the current preview time → the 3D preview updates live.
export const EffectsV2Editor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const effects = def.effects ?? [];
  const time = useTransformationPreviewStore((s) => s.time);
  const scrub = useTransformationPreviewStore((s) => s.scrub);
  // Instant play, timeline-integrated: play just this effect's window, or the whole timeline.
  const playOne = (e: TransformationEffectConfig) => { const ps = useTransformationPreviewStore.getState(); ps.scrub(e.startTime); ps.playRange(e.startTime, e.startTime + Math.max(0.15, e.duration), false); };
  const playAll = () => { const ps = useTransformationPreviewStore.getState(); ps.stop(); ps.play(); };
  const [selId, setSelId] = useState<string | null>(effects[0]?.effectId ?? null);
  const [addType, setAddType] = useState<EffectTypeV2>('clone_burst_effect');
  const byCat = effectEntriesByCategory();
  const sel = effects.find((e) => e.effectId === selId) ?? null;

  const setEffects = (next: TransformationEffectConfig[]) => update({ effects: next });
  const patch = (id: string, p: Partial<TransformationEffectConfig>) => setEffects(effects.map((e) => (e.effectId === id ? { ...e, ...p } : e)));
  const patchParam = (id: string, key: keyof EffectParameters, val: unknown) => {
    const e = effects.find((x) => x.effectId === id);
    if (e) patch(id, { parameters: { ...e.parameters, [key]: val } });
  };
  const addEffect = () => {
    const cfg = createDefaultEffectConfig(addType, Math.round(time * 10) / 10, effects.length);
    setEffects([...effects, cfg]);
    setSelId(cfg.effectId);
  };

  return (
    <div className="space-y-2 rounded border border-fuchsia-700/40 bg-fuchsia-950/10 p-2">
      <div className="flex items-center gap-1">
        <span className={lbl}>🎬 Effects v2 · {effects.length}</span>
        <select value={addType} onChange={(e) => setAddType(e.target.value as EffectTypeV2)} className={inp + ' ml-auto w-40'}>
          {Object.entries(byCat).map(([cat, list]) => (
            <optgroup key={cat} label={cat}>
              {list.map((en) => <option key={en.type} value={en.type}>{en.label}</option>)}
            </optgroup>
          ))}
        </select>
        <button onClick={addEffect} className="rounded bg-fuchsia-700/40 px-2 py-1 text-[11px] text-fuchsia-100 hover:bg-fuchsia-700/60">+ Add</button>
        <button onClick={playAll} title="Play the whole transformation" className="rounded bg-emerald-700/40 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/60">▶ All</button>
      </div>

      <div className="space-y-0.5">
        {effects.map((e, i) => (
          <div key={e.effectId} className={`flex items-center gap-1 rounded border px-1.5 py-0.5 ${selId === e.effectId ? 'border-fuchsia-500/70 bg-fuchsia-950/30' : 'border-slate-800 bg-slate-900/50'} ${e.enabled ? '' : 'opacity-50'}`}>
            <input type="checkbox" checked={e.enabled} onChange={(ev) => patch(e.effectId, { enabled: ev.target.checked })} className="accent-fuchsia-500" />
            <button onClick={() => { setSelId(e.effectId); scrub(e.startTime + e.duration * 0.4); }} className="flex-1 truncate text-left text-[11px] text-slate-200 hover:text-fuchsia-200">{e.effectName} · {e.effectType}</button>
            <span className="font-mono text-[9px] text-slate-500">{e.startTime.toFixed(1)}s</span>
            <button onClick={() => playOne(e)} title="Play this effect now" className="rounded bg-emerald-800/50 px-1 text-[10px] text-emerald-100 hover:bg-emerald-700/60">▶</button>
            <MoveButtons index={i} count={effects.length} onMove={(d) => { const n = effects.slice(); const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setEffects(n); }} />
            <button onClick={() => { const copy = { ...createDefaultEffectConfig(e.effectType, e.startTime, e.layerOrder), ...e, effectId: createDefaultEffectConfig(e.effectType).effectId, effectName: `${e.effectName} copy` }; setEffects([...effects, copy]); setSelId(copy.effectId); }} title="Duplicate" className="rounded bg-slate-800 px-1 text-[10px] text-slate-300 hover:bg-slate-700">⧉</button>
            <button onClick={() => { setEffects(effects.filter((x) => x.effectId !== e.effectId)); if (selId === e.effectId) setSelId(null); }} title="Delete" className="rounded bg-rose-800/40 px-1 text-[10px] text-rose-200 hover:bg-rose-800/60">✕</button>
          </div>
        ))}
        {effects.length === 0 && <p className="text-[10px] text-slate-500">No v2 effects. Pick a type and Add — try <b>clone_burst_effect</b>.</p>}
      </div>

      {sel && (
        <div className="space-y-1 rounded border border-fuchsia-800/40 bg-slate-950/40 p-1.5">
          <TextRow label="Name" value={sel.effectName} onChange={(v) => patch(sel.effectId, { effectName: v })} />
          <div className="grid grid-cols-3 gap-1.5">
            <NumRow label="Start (s)" value={sel.startTime} step={0.1} min={0} onChange={(v) => patch(sel.effectId, { startTime: v })} />
            <NumRow label="Duration (s)" value={sel.duration} step={0.1} min={0.1} onChange={(v) => patch(sel.effectId, { duration: v })} />
            <NumRow label="Delay (s)" value={sel.delay} step={0.1} min={0} onChange={(v) => patch(sel.effectId, { delay: v })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <NumRow label="Opacity" value={sel.opacity} step={0.05} min={0} max={1} onChange={(v) => patch(sel.effectId, { opacity: v })} />
            <NumRow label="Intensity" value={sel.intensity} step={0.1} min={0} onChange={(v) => patch(sel.effectId, { intensity: v })} />
            <NumRow label="Layer" value={sel.layerOrder} step={1} onChange={(v) => patch(sel.effectId, { layerOrder: v })} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <ColorRow label="Colour" value={sel.color} onChange={(v) => patch(sel.effectId, { color: v })} />
            <SelectRow label="Sound" value={sel.soundId ?? ''} options={SOUND_OPTIONS} onChange={(v) => patch(sel.effectId, { soundId: v || undefined })} />
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-300">
            <Check label="Preview" checked={sel.previewEnabled} onChange={(v) => patch(sel.effectId, { previewEnabled: v })} />
            <Check label="Use character model" checked={sel.useCharacterModel} onChange={(v) => patch(sel.effectId, { useCharacterModel: v })} />
          </div>
          {/* registry-driven parameter panel */}
          <div className="mt-1 border-t border-slate-800 pt-1">
            <div className={lbl}>{getEffectEntry(sel.effectType)?.category} parameters</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(getEffectEntry(sel.effectType)?.editorFields ?? []).map((f) => {
                const val = sel.parameters[f.key];
                if (f.kind === 'text') return <TextRow key={String(f.key)} label={f.label} value={typeof val === 'string' ? val : ''} onChange={(v) => patchParam(sel.effectId, f.key, v || undefined)} />;
                if (f.kind === 'bool') return <Check key={String(f.key)} label={f.label} checked={Boolean(val)} onChange={(v) => patchParam(sel.effectId, f.key, v)} />;
                if (f.kind === 'color') return <ColorRow key={String(f.key)} label={f.label} value={typeof val === 'string' ? val : '#ffffff'} onChange={(v) => patchParam(sel.effectId, f.key, v)} />;
                if (f.kind === 'select') return <SelectRow key={String(f.key)} label={f.label} value={String(val ?? f.options?.[0] ?? '')} options={(f.options ?? []).map((o) => ({ value: o, label: o }))} onChange={(v) => patchParam(sel.effectId, f.key, v)} />;
                return <NumRow key={String(f.key)} label={f.label} value={typeof val === 'number' ? val : 0} step={f.step ?? 1} min={f.min} max={f.max} onChange={(v) => patchParam(sel.effectId, f.key, v)} />;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
