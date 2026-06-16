import { useState } from 'react';
import { useFusionEditorStore } from '../../../stores/game/useFusionEditorStore';
import type { PartnerFusionDefinition } from '../../../types/game/supportCombat';
import { Field, inp, lbl, csv, parseCsv } from '../editorShared';

// 🤝 Partner Fusion editor (Batch I) — tune the synchronized combos (primary + support, charges/cooldown/sync,
// AOE damage + the cinematic effect to play).
const CHARS = ['char_jett', 'char_jerome', 'char_paul', 'char_donnie', 'char_todd', 'char_flip', 'char_bello', 'char_chase'];
export const PartnerFusionEditorTab = () => {
  const items = useFusionEditorStore((s) => s.items);
  const update = useFusionEditorStore((s) => s.update);
  const duplicate = useFusionEditorStore((s) => s.duplicate);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const f = items.find((x) => x.id === sel) as PartnerFusionDefinition | undefined;
  const setCombo = (p: Partial<PartnerFusionDefinition['combo']>) => f && update(f.id, { combo: { ...f.combo, ...p } });

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-fuchsia-600/30 text-fuchsia-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.name}</button>)}
      </div>
      {f && (
        <>
          <div className={lbl}>⚡ {f.name} · {f.primaryCharacterId.replace('char_', '')} + {f.supportCharacterId.replace('char_', '')}</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Field label="Name"><input value={f.name} onChange={(e) => update(f.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Required support"><select value={f.requiredSupportStatus ?? 'standby'} onChange={(e) => update(f.id, { requiredSupportStatus: e.target.value as 'active' | 'standby' })} className={inp}><option value="standby">standby+</option><option value="active">active</option></select></Field>
            <Field label="Primary"><select value={f.primaryCharacterId} onChange={(e) => update(f.id, { primaryCharacterId: e.target.value })} className={inp}>{CHARS.map((c) => <option key={c} value={c}>{c.replace('char_', '')}</option>)}</select></Field>
            <Field label="Support"><select value={f.supportCharacterId} onChange={(e) => update(f.id, { supportCharacterId: e.target.value })} className={inp}>{CHARS.map((c) => <option key={c} value={c}>{c.replace('char_', '')}</option>)}</select></Field>
            <Field label="Charges / zone"><input type="number" min={1} value={f.chargesPerZone} onChange={(e) => update(f.id, { chargesPerZone: Math.max(1, parseInt(e.target.value) || 1) })} className={inp} /></Field>
            <Field label="Cooldown (s)"><input type="number" value={f.cooldownSeconds} onChange={(e) => update(f.id, { cooldownSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Sync required"><input type="number" value={f.sync.requiredGauge} onChange={(e) => update(f.id, { sync: { ...f.sync, requiredGauge: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
            <Field label="Sync max"><input type="number" value={f.sync.gaugeMax} onChange={(e) => update(f.id, { sync: { ...f.sync, gaugeMax: parseFloat(e.target.value) || 100 } })} className={inp} /></Field>
          </div>
          <div className={lbl}>Combo</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Field label="Damage"><input type="number" value={f.combo.damage} onChange={(e) => setCombo({ damage: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Radius"><input type="number" step={0.5} value={f.combo.radius} onChange={(e) => setCombo({ radius: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="Attack tags (csv)"><input value={csv(f.combo.attackTags)} onChange={(e) => setCombo({ attackTags: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Cinematic effect id"><input value={f.combo.cinematicEffectId} onChange={(e) => setCombo({ cinematicEffectId: e.target.value })} className={inp} /></Field>
          </div>
          <button onClick={() => duplicate(f.id)} className="rounded bg-slate-700 px-2 py-1 text-[11px] text-white hover:bg-slate-600">Duplicate fusion</button>
        </>
      )}
    </div>
  );
};
