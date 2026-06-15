import { useState } from 'react';
import {
  useEditorCombatStatsStore,
  useEditorCombatSkillStore,
  useEditorDamageableStore,
  useEditorCombatEffectStore,
  getCombatEffect,
} from '../../../stores/game/editorCombatStore';
import { DAMAGE_TYPES } from '../../../types/game/combat';
import type {
  CombatStatsPreset,
  HitVolumeShape, GeometryType, GeometryRenderMode, GeometryAnimate, CombatSkillType, CombatEffectType, ArmorType, OnHpZero,
} from '../../../types/game/combat';
import { validateCombatStats, validateSkill, validateDamageable, validateCombatEffect } from '../../../game/combat/CombatValidation';
import { Field, inp, lbl, Check, csv, parseCsv } from '../editorShared';

// ⚔ Combat — one tab, four sub-sections (Player Stats / Skills / Dummy Targets / Effects). Each edits its
// createEditorCollection; a Validate line surfaces errors. Form-based (no gizmo) per the batch scope.
const num = (v: string) => parseFloat(v) || 0;
const SECTIONS = ['Player Stats', 'Skills', 'Dummy Targets', 'Effects'] as const;
type Section = (typeof SECTIONS)[number];

const HIT_SHAPES: HitVolumeShape[] = ['sphere', 'box', 'capsule', 'cone', 'cylinder', 'ring', 'arc', 'line', 'spline-placeholder'];
const SKILL_TYPES: CombatSkillType[] = ['basic', 'special', 'aoe', 'defense', 'dash', 'utility', 'ultimate-placeholder'];
const GEO_TYPES: GeometryType[] = ['sphere', 'box', 'cone', 'cylinder', 'torus', 'arc', 'ring', 'line', 'tube', 'plane'];
const RENDER_MODES: GeometryRenderMode[] = ['solid', 'wireframe', 'transparent', 'additive', 'outline'];
const ANIMATES: GeometryAnimate[] = ['none', 'expand', 'pulse', 'rotate', 'sweep', 'contract'];
const EFFECT_TYPES: CombatEffectType[] = ['geometry-range', 'ring-burst', 'energy-field', 'model-component-motion', 'shield-wall', 'lock-line', 'placeholder-basic-mesh'];
const ARMOR_TYPES: ArmorType[] = ['none', 'light', 'medium', 'heavy', 'shielded'];
const ON_HP_ZERO: OnHpZero[] = ['destroy', 'disable', 'down', 'complete-condition', 'debug-log'];

const ValidationLine = ({ res }: { res: { ok: boolean; errors: string[]; warnings: string[] } }) => (
  <div className="text-[10px]">
    {res.errors.map((e, i) => <div key={`e${i}`} className="text-rose-400">✗ {e}</div>)}
    {res.warnings.map((w, i) => <div key={`w${i}`} className="text-amber-400">⚠ {w}</div>)}
    {res.ok && res.warnings.length === 0 && <div className="text-emerald-400">✓ valid</div>}
  </div>
);

// Generic list rail.
function Rail<T extends { id: string }>({ items, sel, onSelect, onAdd, label, name }: { items: T[]; sel: string | null; onSelect: (id: string) => void; onAdd: () => void; label: (t: T) => string; name: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-1">
        {items.map((t) => (
          <button key={t.id} onClick={() => onSelect(t.id)} className={`rounded px-2 py-1 text-[11px] ${t.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{label(t)}</button>
        ))}
      </div>
      <button onClick={onAdd} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ {name}</button>
    </div>
  );
}

const StatsSection = () => {
  const items = useEditorCombatStatsStore((s) => s.items);
  const update = useEditorCombatStatsStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const p = items.find((x) => x.id === sel);
  const numField = (label: string, key: keyof CombatStatsPreset) => (
    <Field label={label}><input type="number" step={1} value={(p?.[key] as unknown as number) ?? 0} onChange={(e) => p && update(p.id, { [key]: num(e.target.value) } as Partial<CombatStatsPreset>)} className={inp} /></Field>
  );
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorCombatStatsStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.editorMeta?.displayName ?? t.id} name="Preset" />
      {p && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Character id"><input value={p.characterId ?? ''} onChange={(e) => update(p.id, { characterId: e.target.value || undefined })} className={inp} placeholder="default / char_jett" /></Field>
            {numField('Max HP', 'maxHp')}
            {numField('Max Shield', 'maxShield')}
            {numField('Shield regen/s', 'shieldRegenPerSecond')}
            {numField('Shield delay (s)', 'shieldRegenDelaySeconds')}
            {numField('Max Energy', 'maxEnergy')}
            {numField('Energy regen/s', 'energyRegenPerSecond')}
            {numField('Stagger resist', 'staggerResistance')}
            {numField('Move speed ×', 'moveSpeedMultiplier')}
          </div>
          <ValidationLine res={validateCombatStats(p)} />
          <DetailButtons store={useEditorCombatStatsStore} id={p.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const SkillsSection = () => {
  const items = useEditorCombatSkillStore((s) => s.items);
  const update = useEditorCombatSkillStore((s) => s.update);
  const effects = useEditorCombatEffectStore((s) => s.items);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const s = items.find((x) => x.id === sel);
  const hv = s?.hitVolume;
  const dmg = s?.damageEvents?.[0];
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorCombatSkillStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.editorMeta?.displayName ?? t.name} name="Skill" />
      {s && hv && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Input binding"><input value={s.inputBinding} onChange={(e) => update(s.id, { inputBinding: e.target.value })} className={inp} placeholder="KeyJ" /></Field>
            <Field label="Type"><select value={s.skillType} onChange={(e) => update(s.id, { skillType: e.target.value as CombatSkillType })} className={inp}>{SKILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Energy cost"><input type="number" value={s.energyCost} onChange={(e) => update(s.id, { energyCost: num(e.target.value) })} className={inp} /></Field>
            <Field label="Cooldown (s)"><input type="number" step={0.1} value={s.cooldownSeconds} onChange={(e) => update(s.id, { cooldownSeconds: num(e.target.value) })} className={inp} /></Field>
            <Field label="Effect def id"><select value={s.effectDefinitionId ?? ''} onChange={(e) => update(s.id, { effectDefinitionId: e.target.value || undefined })} className={inp}><option value="">(none)</option>{effects.map((e) => <option key={e.id} value={e.id}>{e.id}</option>)}</select></Field>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hit volume</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Shape"><select value={hv.shape} onChange={(e) => update(s.id, { hitVolume: { ...hv, shape: e.target.value as HitVolumeShape } })} className={inp}>{HIT_SHAPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Radius"><input type="number" step={0.5} value={hv.radius ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, radius: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Length"><input type="number" step={0.5} value={hv.length ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, length: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Width"><input type="number" step={0.5} value={hv.width ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, width: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Angle°"><input type="number" step={5} value={hv.angleDegrees ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, angleDegrees: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Active (s)"><input type="number" step={0.05} value={hv.activeDurationSeconds} onChange={(e) => update(s.id, { hitVolume: { ...hv, activeDurationSeconds: num(e.target.value) } })} className={inp} /></Field>
          </div>
          {dmg && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Damage</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Amount"><input type="number" value={dmg.amount} onChange={(e) => update(s.id, { damageEvents: [{ ...dmg, amount: num(e.target.value) }] })} className={inp} /></Field>
                <Field label="Type"><select value={dmg.damageType} onChange={(e) => update(s.id, { damageEvents: [{ ...dmg, damageType: e.target.value as typeof dmg.damageType }] })} className={inp}>{DAMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                <Field label="Tags (csv)"><input value={csv(dmg.attackTags)} onChange={(e) => update(s.id, { damageEvents: [{ ...dmg, attackTags: parseCsv(e.target.value) }] })} className={inp} /></Field>
              </div>
            </>
          )}
          <Check label="Enabled" checked={s.enabled !== false} onChange={(v) => update(s.id, { enabled: v })} />
          <ValidationLine res={validateSkill(s, getCombatEffect)} />
          <DetailButtons store={useEditorCombatSkillStore} id={s.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const DummySection = () => {
  const items = useEditorDamageableStore((s) => s.items);
  const update = useEditorDamageableStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const d = items.find((x) => x.id === sel);
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorDamageableStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.editorMeta?.displayName ?? t.id} name="Target" />
      {d && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Max HP"><input type="number" value={d.maxHp} onChange={(e) => update(d.id, { maxHp: num(e.target.value) })} className={inp} /></Field>
            <Field label="Max Shield"><input type="number" value={d.maxShield ?? 0} onChange={(e) => update(d.id, { maxShield: num(e.target.value) || undefined })} className={inp} /></Field>
            <Field label="Armor"><select value={d.armorType ?? 'none'} onChange={(e) => update(d.id, { armorType: e.target.value as ArmorType })} className={inp}>{ARMOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="On HP zero"><select value={d.onHpZero} onChange={(e) => update(d.id, { onHpZero: e.target.value as OnHpZero })} className={inp}>{ON_HP_ZERO.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Weakness tags (csv)"><input value={csv(d.weaknessTags)} onChange={(e) => update(d.id, { weaknessTags: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Resistance tags (csv)"><input value={csv(d.resistanceTags)} onChange={(e) => update(d.id, { resistanceTags: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Immune tags (csv)"><input value={csv(d.immuneTags)} onChange={(e) => update(d.id, { immuneTags: parseCsv(e.target.value) })} className={inp} /></Field>
          </div>
          <Check label="Shield enabled" checked={d.shieldRules?.enabled ?? false} onChange={(v) => update(d.id, { shieldRules: { enabled: v, shieldHp: d.shieldRules?.shieldHp ?? (d.maxShield ?? 50), shieldWeaknessTags: d.shieldRules?.shieldWeaknessTags ?? ['shield-break'], shieldBreakStaggerSeconds: d.shieldRules?.shieldBreakStaggerSeconds ?? 1.5 } })} />
          {d.shieldRules?.enabled && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Shield HP"><input type="number" value={d.shieldRules.shieldHp} onChange={(e) => update(d.id, { shieldRules: { ...d.shieldRules!, shieldHp: num(e.target.value) } })} className={inp} /></Field>
              <Field label="Shield weakness (csv)"><input value={csv(d.shieldRules.shieldWeaknessTags)} onChange={(e) => update(d.id, { shieldRules: { ...d.shieldRules!, shieldWeaknessTags: parseCsv(e.target.value) } })} className={inp} /></Field>
            </div>
          )}
          <ValidationLine res={validateDamageable(d)} />
          <DetailButtons store={useEditorDamageableStore} id={d.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const EffectsSection = () => {
  const items = useEditorCombatEffectStore((s) => s.items);
  const update = useEditorCombatEffectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const e = items.find((x) => x.id === sel);
  const g = e?.geometry;
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorCombatEffectStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.id} name="Effect" />
      {e && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Effect type"><select value={e.effectType} onChange={(ev) => update(e.id, { effectType: ev.target.value as CombatEffectType })} className={inp}>{EFFECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Color"><input type="color" value={e.color ?? '#ffffff'} onChange={(ev) => update(e.id, { color: ev.target.value })} className="h-7 w-16 rounded bg-slate-800" /></Field>
            <Field label="Duration (s)"><input type="number" step={0.1} value={e.timing.durationSeconds} onChange={(ev) => update(e.id, { timing: { ...e.timing, durationSeconds: num(ev.target.value) } })} className={inp} /></Field>
            <Field label="Fade out (s)"><input type="number" step={0.05} value={e.timing.fadeOutSeconds ?? 0} onChange={(ev) => update(e.id, { timing: { ...e.timing, fadeOutSeconds: num(ev.target.value) } })} className={inp} /></Field>
          </div>
          {g && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="Geometry"><select value={g.geometryType} onChange={(ev) => update(e.id, { geometry: { ...g, geometryType: ev.target.value as GeometryType } })} className={inp}>{GEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Render"><select value={g.renderMode} onChange={(ev) => update(e.id, { geometry: { ...g, renderMode: ev.target.value as GeometryRenderMode } })} className={inp}>{RENDER_MODES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Animate"><select value={g.animate} onChange={(ev) => update(e.id, { geometry: { ...g, animate: ev.target.value as GeometryAnimate } })} className={inp}>{ANIMATES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Radius"><input type="number" step={0.5} value={g.dimensions.radius ?? 0} onChange={(ev) => update(e.id, { geometry: { ...g, dimensions: { ...g.dimensions, radius: num(ev.target.value) } } })} className={inp} /></Field>
              <Field label="Length"><input type="number" step={0.5} value={g.dimensions.length ?? 0} onChange={(ev) => update(e.id, { geometry: { ...g, dimensions: { ...g.dimensions, length: num(ev.target.value) } } })} className={inp} /></Field>
              <Field label="Angle°"><input type="number" step={5} value={g.dimensions.angleDegrees ?? 0} onChange={(ev) => update(e.id, { geometry: { ...g, dimensions: { ...g.dimensions, angleDegrees: num(ev.target.value) } } })} className={inp} /></Field>
            </div>
          )}
          <ValidationLine res={validateCombatEffect(e)} />
          <DetailButtons store={useEditorCombatEffectStore} id={e.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

// Shared duplicate/delete buttons for any editor collection store.
function DetailButtons({ store, id, onSel }: { store: { getState: () => { duplicate: (id: string) => string | null; remove: (id: string) => void } }; id: string; onSel: (id: string | null) => void }) {
  return (
    <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
      <button onClick={() => { const nid = store.getState().duplicate(id); if (nid) onSel(nid); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
      <button onClick={() => { store.getState().remove(id); onSel(null); }} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
      <span className="ml-auto self-center text-[10px] text-slate-500">id: {id}</span>
    </div>
  );
}

export const CombatEditorTab = () => {
  const [section, setSection] = useState<Section>('Player Stats');
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-1">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`rounded px-2 py-1 text-[11px] ${s === section ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>
        ))}
      </div>
      <div className={lbl}>⚔ Combat Runtime · {section}</div>
      {section === 'Player Stats' && <StatsSection />}
      {section === 'Skills' && <SkillsSection />}
      {section === 'Dummy Targets' && <DummySection />}
      {section === 'Effects' && <EffectsSection />}
    </div>
  );
};
