import { useState } from 'react';
import { useAbilityLoadoutStore } from '../../../stores/game/useAbilityLoadoutStore';
import { useCinematicAbilityEditorStore, getAbilityBySlot } from '../../../stores/game/useCinematicAbilityEditorStore';
import type { AbilityLoadoutDefinition } from '../../../types/abilityArsenalTypes';
import { validateLoadout } from '../../../game/character-abilities/cinematicAbilityValidation';
import { ABILITY_PAGES, PAGE_LABELS, ACTION_KEY_LABELS } from '../../../game/character-skills/abilityPages';
import { Field, inp, lbl } from '../editorShared';

// 🎬 Ability loadout editor (Batch F.6) — choose which arsenal abilities sit on each keyed slot per hero, and
// review the 3-page (4/5/Z/X) skill-page map that Ctrl cycles in combat. The per-page slot → ability binding
// is driven by each ability's abilitySlot (edit it in the 🎬 Cinematic Abilities tab).
const CHARS = ['char_jett', 'char_jerome', 'char_paul', 'char_donnie', 'char_todd', 'char_flip', 'char_bello', 'char_chase'];
const KEYED: { key: keyof AbilityLoadoutDefinition; label: string; cat: 'attack' | 'defense' | 'ultimate' }[] = [
  { key: 'basic', label: 'Basic (Z)', cat: 'attack' }, { key: 'special1', label: 'Special1 (X)', cat: 'attack' }, { key: 'special2', label: 'Special2 (Y)', cat: 'attack' },
  { key: 'aoe', label: 'AOE (H)', cat: 'attack' }, { key: 'defense', label: 'Defense (B)', cat: 'defense' }, { key: 'utility', label: 'Utility (N)', cat: 'attack' }, { key: 'ultimate', label: 'Ultimate (U)', cat: 'ultimate' },
];

export const AbilityLoadoutEditorTab = () => {
  const loadouts = useAbilityLoadoutStore((s) => s.items);
  const update = useAbilityLoadoutStore((s) => s.update);
  const abilities = useCinematicAbilityEditorStore((s) => s.items);
  const [char, setChar] = useState(CHARS[0]);
  const lo = loadouts.find((l) => l.characterId === char);
  const catOf = (id: string) => abilities.find((a) => a.id === id)?.abilityCategory;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {CHARS.map((c) => <button key={c} onClick={() => setChar(c)} className={`rounded px-2 py-1 text-[11px] ${c === char ? 'bg-pink-600/30 text-pink-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{c.replace('char_', '')}</button>)}
      </div>
      {lo && (
        <>
          <div className={lbl}>🎬 {char.replace('char_', '')} loadout</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            {KEYED.map((s) => (
              <Field key={s.key} label={s.label}>
                <select value={lo[s.key] as string} onChange={(ev) => update(lo.id, { [s.key]: ev.target.value } as Partial<AbilityLoadoutDefinition>)} className={inp}>
                  {abilities.filter((a) => a.characterId === char && a.abilityCategory === s.cat).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
            ))}
          </div>
          <div className="text-[10px]">
            {validateLoadout(lo, catOf).errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
            {validateLoadout(lo, catOf).ok && <div className="text-emerald-400">✓ loadout valid</div>}
          </div>

          <div className={lbl}>⟳ Skill pages (Ctrl cycles · keys 4 / 5 / Z / X)</div>
          <div className="space-y-1 rounded-lg border border-slate-800 p-2">
            {ABILITY_PAGES.map((slots, p) => (
              <div key={p} className="flex items-center gap-1">
                <span className="w-28 shrink-0 text-[10px] text-sky-300">Page {p + 1} · {PAGE_LABELS[p]}</span>
                <div className="grid grow grid-cols-4 gap-1">
                  {ACTION_KEY_LABELS.map((keyLabel, i) => {
                    const ab = slots[i] ? getAbilityBySlot(char, slots[i]) : undefined;
                    return (
                      <span key={keyLabel} className={`truncate rounded px-1.5 py-0.5 text-[9px] ${ab ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 text-rose-400'}`} title={ab ? `${slots[i]} → ${ab.name}` : `${slots[i] ?? '—'} (no ability)`}>
                        <b className="text-sky-300">{keyLabel}</b> {ab?.name ?? '—'}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
