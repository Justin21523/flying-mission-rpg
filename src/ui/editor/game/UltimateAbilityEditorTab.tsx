import { useState } from 'react';
import { useCinematicAbilityEditorStore } from '../../../stores/game/useCinematicAbilityEditorStore';
import type { CinematicAbilityDefinition } from '../../../types/abilityArsenalTypes';
import { Field, inp, lbl } from '../editorShared';

// 🎬 Ultimate ability editor (Batch F.5) — tune the 16 ultimates (2 per hero).
export const UltimateAbilityEditorTab = () => {
  const items = useCinematicAbilityEditorStore((s) => s.items);
  const update = useCinematicAbilityEditorStore((s) => s.update);
  const ults = items.filter((a) => a.abilityCategory === 'ultimate');
  const [sel, setSel] = useState<string | null>(ults[0]?.id ?? null);
  const a = items.find((x) => x.id === sel) as CinematicAbilityDefinition | undefined;
  return (
    <div className="space-y-3 text-xs">
      <div className="flex max-h-24 flex-wrap gap-1 overflow-auto">
        {ults.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-0.5 text-[10px] ${x.id === sel ? 'bg-fuchsia-600/30 text-fuchsia-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.characterId.replace('char_', '')}: {x.name}</button>)}
      </div>
      {a && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <div className={lbl + ' col-span-2'}>🎬 {a.name}</div>
          <Field label="Cooldown (s)"><input type="number" value={a.combat.cooldownSeconds} onChange={(e) => update(a.id, { combat: { ...a.combat, cooldownSeconds: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Energy cost"><input type="number" value={a.combat.energyCost} onChange={(e) => update(a.id, { combat: { ...a.combat, energyCost: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Base damage"><input type="number" value={a.balance.baseDamage ?? 0} onChange={(e) => update(a.id, { balance: { ...a.balance, baseDamage: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Visual intensity"><input type="number" min={1} max={5} value={a.editorMeta?.visualIntensity ?? 5} onChange={(e) => update(a.id, { editorMeta: { ...a.editorMeta, visualIntensity: Math.min(5, Math.max(1, parseInt(e.target.value) || 5)) as 1 | 2 | 3 | 4 | 5 } })} className={inp} /></Field>
        </div>
      )}
    </div>
  );
};
