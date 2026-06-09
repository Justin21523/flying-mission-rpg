import { Check, inp, lbl } from './editorShared';
import { ANIM_TRIGGERS } from '../../types/character';
import type { AnimRule, AnimTrigger } from '../../types/character';

// Shared editor for a list of animation rules (used by the POLI character tab + the NPC inspector). Each
// rule: a free name, a trigger, a clip chosen from the model's discovered clips, speed gates, key, priority,
// loop/once, crossfade. `clips` is the model's clip-name list (may be empty while loading).
const ruid = () => `anim_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export const AnimRuleList = ({ rules, clips, onChange }: { rules: AnimRule[]; clips: string[]; onChange: (next: AnimRule[]) => void }) => {
  const upd = (id: string, patch: Partial<AnimRule>) => onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <div className="rounded-lg border border-violet-700/40 bg-violet-950/15 p-2">
      <div className="flex items-center justify-between">
        <span className={lbl}>🎬 Animations ({rules.length})</span>
        <button onClick={() => onChange([...rules, { id: ruid(), name: `Anim ${rules.length + 1}`, clip: clips[0] ?? '', trigger: 'idle', priority: 0, loop: true, crossfadeSec: 0.2 }])} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">➕ rule</button>
      </div>
      {clips.length === 0 && <div className="mt-1 text-[10px] text-slate-500">This model has no animation clips (or is still loading).</div>}
      {rules.map((r) => (
        <div key={r.id} className="mt-1.5 space-y-1 rounded border border-slate-700/60 bg-slate-900/40 p-1.5">
          <div className="flex items-center gap-1">
            <input value={r.name ?? ''} onChange={(e) => upd(r.id, { name: e.target.value })} className={inp + ' flex-1'} placeholder="rule name (your label)" />
            <button onClick={() => onChange(rules.filter((x) => x.id !== r.id))} className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
          <div className="flex items-center gap-1">
            <select value={r.trigger} onChange={(e) => upd(r.id, { trigger: e.target.value as AnimTrigger })} className={inp} title="when this rule fires">
              {ANIM_TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {/* Track: a free-text field with the model's detected clips as datalist suggestions, so you can
                pick a real clip OR type any track name even when none were auto-detected. */}
            <input
              value={r.clip}
              onChange={(e) => upd(r.id, { clip: e.target.value })}
              list={`clips_${r.id}`}
              placeholder={clips.length ? 'pick / type track' : 'type track name'}
              className={inp}
              title="animation track (clip name in the model)"
            />
            <datalist id={`clips_${r.id}`}>
              {clips.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <label className="text-[9px] text-slate-400">spdMin<input type="number" step={0.5} value={r.speedMin ?? ''} onChange={(e) => upd(r.id, { speedMin: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={inp} /></label>
            <label className="text-[9px] text-slate-400">spdMax<input type="number" step={0.5} value={r.speedMax ?? ''} onChange={(e) => upd(r.id, { speedMax: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={inp} /></label>
            <label className="text-[9px] text-slate-400">prio<input type="number" value={r.priority ?? 0} onChange={(e) => upd(r.id, { priority: parseInt(e.target.value, 10) || 0 })} className={inp} /></label>
            <label className="text-[9px] text-slate-400">cf<input type="number" step={0.05} value={r.crossfadeSec ?? 0.2} onChange={(e) => upd(r.id, { crossfadeSec: parseFloat(e.target.value) || 0 })} className={inp} /></label>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-300">
            {r.trigger === 'key' && <label className="flex items-center gap-1">key<input value={r.key ?? ''} onChange={(e) => upd(r.id, { key: e.target.value })} placeholder="KeyV" className={inp + ' w-16'} /></label>}
            <Check label="once" checked={!!r.once} onChange={(v) => upd(r.id, { once: v })} />
            <Check label="loop" checked={r.loop !== false} onChange={(v) => upd(r.id, { loop: v })} />
          </div>
        </div>
      ))}
    </div>
  );
};
