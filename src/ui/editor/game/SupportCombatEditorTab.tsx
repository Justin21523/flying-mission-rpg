import { useState } from 'react';
import { useSupportCombatEditorStore, useSupportSynergyEditorStore } from '../../../stores/game/useSupportCombatEditorStore';
import { useEditorCombatEffectStore } from '../../../stores/game/editorCombatStore';
import {
  SUPPORT_COMBAT_TYPES, SUPPORT_TRIGGER_MODES, SUPPORT_TARGET_TYPES, SUPPORT_RANGE_SHAPES, SUPPORT_SYNERGY_TRIGGERS,
} from '../../../types/game/supportCombat';
import type { SupportCombatAbilityDefinition } from '../../../types/game/supportCombat';
import { validateAbility } from '../../../game/support-combat/SupportCombatValidation';
import { Field, inp, lbl, csv, parseCsv } from '../editorShared';

// 🤝 Support Combat — one tab, sub-sections (Ability / Targeting / Synergy / Visual). Backed by the support
// ability + synergy editor collections (Batch E). Form-based (no gizmo this batch).
const SECTIONS = ['Ability', 'Targeting', 'Synergy', 'Visual'] as const;
type Section = (typeof SECTIONS)[number];

export const SupportCombatEditorTab = () => {
  const items = useSupportCombatEditorStore((s) => s.items);
  const update = useSupportCombatEditorStore((s) => s.update);
  const synergies = useSupportSynergyEditorStore((s) => s.items);
  const updateSynergy = useSupportSynergyEditorStore((s) => s.update);
  const effectIds = useEditorCombatEffectStore((s) => s.items).map((e) => e.id);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const [section, setSection] = useState<Section>('Ability');
  const a = items.find((x) => x.id === sel) as SupportCombatAbilityDefinition | undefined;
  const setTargeting = (patch: Partial<SupportCombatAbilityDefinition['targeting']>) => a && update(a.id, { targeting: { ...a.targeting, ...patch } });
  const effectVisualExists = (id: string) => effectIds.includes(id);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[11px] ${x.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.editorMeta?.displayName ?? x.name}</button>
        ))}
      </div>
      {a && (
        <>
          <div className="flex gap-1">
            {SECTIONS.map((s) => <button key={s} onClick={() => setSection(s)} className={`rounded px-2 py-1 text-[11px] ${s === section ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>)}
          </div>
          <div className={lbl}>🤝 {a.editorMeta?.displayName ?? a.name} · {section}</div>

          {section === 'Ability' && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
              <Field label="Name"><input value={a.name} onChange={(e) => update(a.id, { name: e.target.value })} className={inp} /></Field>
              <Field label="Support character id"><input value={a.supportCharacterId} onChange={(e) => update(a.id, { supportCharacterId: e.target.value })} className={inp} /></Field>
              <Field label="Support type"><select value={a.supportType} onChange={(e) => update(a.id, { supportType: e.target.value as SupportCombatAbilityDefinition['supportType'] })} className={inp}>{SUPPORT_COMBAT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Trigger mode"><select value={a.triggerMode} onChange={(e) => update(a.id, { triggerMode: e.target.value as SupportCombatAbilityDefinition['triggerMode'] })} className={inp}>{SUPPORT_TRIGGER_MODES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Cooldown (s)"><input type="number" step={0.5} value={a.cooldownSeconds} onChange={(e) => update(a.id, { cooldownSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Support energy cost"><input type="number" value={a.resourceCost.supportEnergy ?? 0} onChange={(e) => update(a.id, { resourceCost: { ...a.resourceCost, supportEnergy: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
              <Field label="Cast delay (s)"><input type="number" step={0.1} value={a.castDelaySeconds ?? 0} onChange={(e) => update(a.id, { castDelaySeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Duration (s)"><input type="number" step={0.5} value={a.durationSeconds ?? 0} onChange={(e) => update(a.id, { durationSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Requires status"><select value={a.requiresSupportStatus ?? 'any'} onChange={(e) => update(a.id, { requiresSupportStatus: e.target.value as SupportCombatAbilityDefinition['requiresSupportStatus'] })} className={inp}>{['any', 'active-at-scene', 'standby-at-scene', 'remote-support'].map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Valid segment types (csv)"><input value={csv(a.validZoneSegmentTypes)} onChange={(e) => update(a.id, { validZoneSegmentTypes: parseCsv(e.target.value) })} className={inp} /></Field>
              <Field label="Valid target tags (csv)"><input value={csv(a.validTargetTags)} onChange={(e) => update(a.id, { validTargetTags: parseCsv(e.target.value) })} className={inp} /></Field>
              <Field label="Theme color"><input type="color" value={a.editorMeta?.themeColor ?? '#60a5fa'} onChange={(e) => update(a.id, { editorMeta: { ...a.editorMeta, themeColor: e.target.value } })} className="h-7 w-16 rounded bg-slate-800" /></Field>
            </div>
          )}

          {section === 'Targeting' && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
              <Field label="Target type"><select value={a.targeting.targetType} onChange={(e) => setTargeting({ targetType: e.target.value as SupportCombatAbilityDefinition['targeting']['targetType'] })} className={inp}>{SUPPORT_TARGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Range shape"><select value={a.targeting.rangeShape} onChange={(e) => setTargeting({ rangeShape: e.target.value as SupportCombatAbilityDefinition['targeting']['rangeShape'] })} className={inp}>{SUPPORT_RANGE_SHAPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Max range"><input type="number" value={a.targeting.maxRange ?? 0} onChange={(e) => setTargeting({ maxRange: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Radius"><input type="number" value={a.targeting.radius ?? 0} onChange={(e) => setTargeting({ radius: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Width"><input type="number" value={a.targeting.width ?? 0} onChange={(e) => setTargeting({ width: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Length"><input type="number" value={a.targeting.length ?? 0} onChange={(e) => setTargeting({ length: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Angle (°)"><input type="number" value={a.targeting.angleDegrees ?? 0} onChange={(e) => setTargeting({ angleDegrees: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
              <Field label="Priority"><select value={a.targeting.targetPriority ?? 'nearest'} onChange={(e) => setTargeting({ targetPriority: e.target.value as SupportCombatAbilityDefinition['targeting']['targetPriority'] })} className={inp}>{['nearest', 'lowest-hp', 'highest-threat', 'shielded', 'objective-linked', 'scanned', 'manual'].map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            </div>
          )}

          {section === 'Visual' && (
            <div className="space-y-1 rounded-lg border border-slate-800 p-2">
              {a.effects.map((ef, i) => (
                <div key={ef.id} className="grid grid-cols-2 gap-2 rounded border border-slate-800 p-1.5">
                  <Field label={`Effect ${ef.id} type`}><input value={ef.effectType} disabled className={inp} /></Field>
                  <Field label="Amount"><input type="number" value={ef.amount ?? 0} onChange={(e) => { const arr = [...a.effects]; arr[i] = { ...ef, amount: parseFloat(e.target.value) || 0 }; update(a.id, { effects: arr }); }} className={inp} /></Field>
                  <Field label="Visual effect id"><select value={ef.modelFirstEffect?.effectDefinitionId ?? ''} onChange={(e) => { const arr = [...a.effects]; arr[i] = { ...ef, modelFirstEffect: { effectDefinitionId: e.target.value, attachTo: ef.modelFirstEffect?.attachTo ?? 'target' } }; update(a.id, { effects: arr }); }} className={inp}><option value="">(none)</option>{effectIds.filter((id) => id.startsWith('fx_')).map((id) => <option key={id} value={id}>{id}</option>)}</select></Field>
                  <Field label="Attack tags (csv)"><input value={csv(ef.attackTags)} onChange={(e) => { const arr = [...a.effects]; arr[i] = { ...ef, attackTags: parseCsv(e.target.value) }; update(a.id, { effects: arr }); }} className={inp} /></Field>
                </div>
              ))}
            </div>
          )}

          {section === 'Synergy' && (
            <div className="space-y-1 rounded-lg border border-slate-800 p-2">
              {synergies.map((c) => (
                <div key={c.id} className="grid grid-cols-2 gap-2 rounded border border-slate-800 p-1.5">
                  <Field label="Name"><input value={c.name} onChange={(e) => updateSynergy(c.id, { name: e.target.value })} className={inp} /></Field>
                  <Field label="Trigger"><select value={c.triggerCondition} onChange={(e) => updateSynergy(c.id, { triggerCondition: e.target.value as typeof c.triggerCondition })} className={inp}>{SUPPORT_SYNERGY_TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                  <Field label="Primary char"><input value={c.primaryCharacterId} onChange={(e) => updateSynergy(c.id, { primaryCharacterId: e.target.value })} className={inp} /></Field>
                  <Field label="Support char"><input value={c.supportCharacterId} onChange={(e) => updateSynergy(c.id, { supportCharacterId: e.target.value })} className={inp} /></Field>
                  <Field label="Required support ability id"><input value={c.requiredSupportAbilityId ?? ''} onChange={(e) => updateSynergy(c.id, { requiredSupportAbilityId: e.target.value || undefined })} className={inp} /></Field>
                  <Field label="Cooldown (s)"><input type="number" value={c.cooldownSeconds} onChange={(e) => updateSynergy(c.id, { cooldownSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
                </div>
              ))}
            </div>
          )}

          <div className="text-[10px]">
            {validateAbility(a, effectVisualExists).errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
            {validateAbility(a, effectVisualExists).warnings.map((w, i) => <div key={i} className="text-amber-400">⚠ {w}</div>)}
            {validateAbility(a, effectVisualExists).ok && <div className="text-emerald-400">✓ ability valid</div>}
          </div>
        </>
      )}
    </div>
  );
};
