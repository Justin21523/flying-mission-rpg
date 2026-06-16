import { useState } from 'react';
import { useCinematicAbilityEditorStore } from '../../../stores/game/useCinematicAbilityEditorStore';
import { ABILITY_CATEGORIES, ABILITY_SLOTS } from '../../../types/abilityArsenalTypes';
import type { CinematicAbilityDefinition, AbilityVisualScale, CinematicModelScalePreset } from '../../../types/abilityArsenalTypes';
import { validateAbility } from '../../../game/character-abilities/cinematicAbilityValidation';
import { getCinematicEffect } from '../../../stores/game/useCinematicEffectStore';
import { MODEL_SCALE_PRESETS, visualScaleForCategory } from '../../../data/cinematic-vfx/modelScalePresets';
import { Field, inp, lbl, csv, parseCsv } from '../editorShared';

const SCALE_PRESETS: CinematicModelScalePreset[] = ['small', 'medium', 'large', 'hero', 'ultimate'];

// 🎬 Cinematic Abilities — Ability editor (Batch F.6). Edits the combat numbers + slot/category + balance +
// model scale tier of each of the 96 abilities. VFX layers live in the VFX/Particle/Fog/Model tabs.
const CHARS = ['char_jett', 'char_jerome', 'char_paul', 'char_donnie', 'char_todd', 'char_flip', 'char_bello', 'char_chase'];

export const CinematicAbilityEditorTab = () => {
  const items = useCinematicAbilityEditorStore((s) => s.items);
  const update = useCinematicAbilityEditorStore((s) => s.update);
  const [char, setChar] = useState(CHARS[0]);
  const list = items.filter((a) => a.characterId === char);
  const [sel, setSel] = useState<string | null>(list[0]?.id ?? null);
  const a = items.find((x) => x.id === sel) as CinematicAbilityDefinition | undefined;
  const effectExists = (id: string) => !!getCinematicEffect(id);
  const setVisualScale = (patch: Partial<AbilityVisualScale>) => {
    if (!a) return;
    const base = a.visualScale ?? visualScaleForCategory(a.abilityCategory);
    update(a.id, { visualScale: { ...base, ...patch } });
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {CHARS.map((c) => <button key={c} onClick={() => { setChar(c); setSel(items.find((x) => x.characterId === c)?.id ?? null); }} className={`rounded px-2 py-1 text-[11px] ${c === char ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{c.replace('char_', '')}</button>)}
      </div>
      <div className="flex flex-wrap gap-1">
        {list.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.name}</button>)}
      </div>
      {a && (
        <>
          <div className={lbl}>🎬 {a.name} · {a.abilityCategory} · {a.abilitySlot}</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Field label="Name"><input value={a.name} onChange={(e) => update(a.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Category"><select value={a.abilityCategory} onChange={(e) => update(a.id, { abilityCategory: e.target.value as CinematicAbilityDefinition['abilityCategory'] })} className={inp}>{ABILITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Slot"><select value={a.abilitySlot} onChange={(e) => update(a.id, { abilitySlot: e.target.value as CinematicAbilityDefinition['abilitySlot'] })} className={inp}>{ABILITY_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Cooldown (s)"><input type="number" step={0.1} value={a.combat.cooldownSeconds} onChange={(e) => update(a.id, { combat: { ...a.combat, cooldownSeconds: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Energy cost"><input type="number" value={a.combat.energyCost} onChange={(e) => update(a.id, { combat: { ...a.combat, energyCost: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Base damage"><input type="number" value={a.balance.baseDamage ?? 0} onChange={(e) => update(a.id, { balance: { ...a.balance, baseDamage: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Shield damage"><input type="number" value={a.balance.shieldDamage ?? 0} onChange={(e) => update(a.id, { balance: { ...a.balance, shieldDamage: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Hit radius"><input type="number" step={0.5} value={a.combat.hitVolume.radius ?? 0} onChange={(e) => update(a.id, { combat: { ...a.combat, hitVolume: { ...a.combat.hitVolume, radius: parseFloat(e.target.value) || 0 } } })} className={inp} /></Field>
            <Field label="Attack tags (csv)"><input value={csv(a.combat.attackTags)} onChange={(e) => update(a.id, { combat: { ...a.combat, attackTags: parseCsv(e.target.value) } })} className={inp} /></Field>
            <Field label="Visual intensity"><input type="number" min={1} max={5} value={a.editorMeta?.visualIntensity ?? 2} onChange={(e) => update(a.id, { editorMeta: { ...a.editorMeta, visualIntensity: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) as 1 | 2 | 3 | 4 | 5 } })} className={inp} /></Field>
            <Field label="Model scale preset"><select value={(a.visualScale ?? visualScaleForCategory(a.abilityCategory)).modelScalePreset} onChange={(e) => { const p = e.target.value as CinematicModelScalePreset; setVisualScale({ modelScalePreset: p, modelScaleMultiplier: MODEL_SCALE_PRESETS[p] }); }} className={inp}>{SCALE_PRESETS.map((p) => <option key={p} value={p}>{p} (×{MODEL_SCALE_PRESETS[p]})</option>)}</select></Field>
            <Field label="Model scale ×"><input type="number" step={0.1} min={0.1} value={(a.visualScale ?? visualScaleForCategory(a.abilityCategory)).modelScaleMultiplier} onChange={(e) => setVisualScale({ modelScaleMultiplier: Math.max(0.1, parseFloat(e.target.value) || 0.1) })} className={inp} /></Field>
            <Field label="Cinematic effect id"><input value={a.vfx.cinematicEffectId} disabled className={inp} /></Field>
          </div>
          <div className="text-[10px]">
            {validateAbility(a, effectExists).errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
            {validateAbility(a, effectExists).ok && <div className="text-emerald-400">✓ ability valid</div>}
          </div>
        </>
      )}
    </div>
  );
};
