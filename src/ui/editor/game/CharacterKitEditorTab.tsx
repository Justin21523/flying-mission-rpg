import { useState } from 'react';
import { useEditorCharacterKitStore } from '../../../stores/game/editorCharacterKitStore';
import { useEditorCombatSkillStore } from '../../../stores/game/editorCombatStore';
import type { CharacterCombatKitDefinition, SkillSlotName, CharacterCombatRoleType } from '../../../types/game/characterKit';
import { validateKit } from '../../../game/character-skills/CharacterSkillValidation';
import { Field, inp, lbl, csv, parseCsv } from '../editorShared';

// 🦸 Character Kits — one tab, sub-sections (Kit / Loadout / Combo / Utility / Socket). Backed by the kit
// editor collection; combos/utility/sockets are nested in the kit. Loadout edits named-slot → skill ids.
const SECTIONS = ['Kit', 'Loadout', 'Combo', 'Utility', 'Socket'] as const;
type Section = (typeof SECTIONS)[number];
const SLOTS: SkillSlotName[] = ['basic', 'special1', 'special2', 'aoe', 'defense', 'utility', 'ultimatePlaceholder'];

export const CharacterKitEditorTab = () => {
  const items = useEditorCharacterKitStore((s) => s.items);
  const update = useEditorCharacterKitStore((s) => s.update);
  const skillExists = (id: string) => useEditorCombatSkillStore.getState().items.some((s) => s.id === id);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const [section, setSection] = useState<Section>('Kit');
  const k = items.find((x) => x.id === sel) as CharacterCombatKitDefinition | undefined;
  const setLoadout = (slot: SkillSlotName, id: string) => k && update(k.id, { defaultSkillIds: { ...k.defaultSkillIds, [slot]: id || undefined } });

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {items.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[11px] ${x.id === sel ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.displayName}</button>
        ))}
      </div>
      {k && (
        <>
          <div className="flex gap-1">
            {SECTIONS.map((s) => <button key={s} onClick={() => setSection(s)} className={`rounded px-2 py-1 text-[11px] ${s === section ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>)}
          </div>
          <div className={lbl}>🦸 {k.displayName} · {section}</div>

          {section === 'Kit' && (
            <div className="space-y-2 rounded-lg border border-slate-800 p-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Character id"><input value={k.characterId} onChange={(e) => update(k.id, { characterId: e.target.value })} className={inp} /></Field>
                <Field label="Display name"><input value={k.displayName} onChange={(e) => update(k.id, { displayName: e.target.value })} className={inp} /></Field>
                <Field label="Role types (csv)"><input value={csv(k.roleTypes)} onChange={(e) => update(k.id, { roleTypes: parseCsv(e.target.value) as CharacterCombatRoleType[] })} className={inp} /></Field>
                <Field label="Theme color"><input type="color" value={k.editorMeta?.themeColor ?? '#cbd5e1'} onChange={(e) => update(k.id, { editorMeta: { ...k.editorMeta, themeColor: e.target.value } })} className="h-7 w-16 rounded bg-slate-800" /></Field>
                <Field label="Recommended enemy types (csv)"><input value={csv(k.recommendedAgainst.enemyTypes)} onChange={(e) => update(k.id, { recommendedAgainst: { ...k.recommendedAgainst, enemyTypes: parseCsv(e.target.value) } })} className={inp} /></Field>
                <Field label="Weak vs (notes)"><input value={k.weakAgainst?.notes ?? ''} onChange={(e) => update(k.id, { weakAgainst: { ...k.weakAgainst, notes: e.target.value } })} className={inp} /></Field>
              </div>
            </div>
          )}

          {section === 'Loadout' && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
              {SLOTS.map((slot) => (
                <Field key={slot} label={slot}>
                  <select value={k.defaultSkillIds[slot] ?? ''} onChange={(e) => setLoadout(slot, e.target.value)} className={inp}>
                    <option value="">(none)</option>
                    {useEditorCombatSkillStore.getState().items.filter((s) => s.ownerCharacterId === k.characterId).map((s) => <option key={s.id} value={s.id}>{s.editorMeta?.displayName ?? s.name}</option>)}
                  </select>
                </Field>
              ))}
            </div>
          )}

          {section === 'Combo' && (
            <div className="space-y-1 rounded-lg border border-slate-800 p-2">
              {(k.combos ?? []).map((c, i) => (
                <div key={c.id} className="rounded border border-slate-800 p-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Name"><input value={c.name} onChange={(e) => { const arr = [...(k.combos ?? [])]; arr[i] = { ...c, name: e.target.value }; update(k.id, { combos: arr }); }} className={inp} /></Field>
                    <Field label="Max gap (s)"><input type="number" step={0.1} value={c.maxInputGapSeconds} onChange={(e) => { const arr = [...(k.combos ?? [])]; arr[i] = { ...c, maxInputGapSeconds: parseFloat(e.target.value) || 1 }; update(k.id, { combos: arr }); }} className={inp} /></Field>
                    <Field label="Input sequence (skill ids, csv)"><input value={csv(c.inputSequence)} onChange={(e) => { const arr = [...(k.combos ?? [])]; arr[i] = { ...c, inputSequence: parseCsv(e.target.value) }; update(k.id, { combos: arr }); }} className={inp} /></Field>
                    <Field label="Result skill id"><input value={c.resultSkillId} onChange={(e) => { const arr = [...(k.combos ?? [])]; arr[i] = { ...c, resultSkillId: e.target.value }; update(k.id, { combos: arr }); }} className={inp} /></Field>
                  </div>
                </div>
              ))}
              {(k.combos ?? []).length === 0 && <div className="text-slate-500">No combos.</div>}
            </div>
          )}

          {section === 'Utility' && (
            <div className="space-y-1 rounded-lg border border-slate-800 p-2">
              {k.stageUtilityRules.map((u, i) => (
                <div key={u.id} className="grid grid-cols-2 gap-2 rounded border border-slate-800 p-1.5">
                  <Field label="Utility type"><input value={u.utilityType} onChange={(e) => { const arr = [...k.stageUtilityRules]; arr[i] = { ...u, utilityType: e.target.value as typeof u.utilityType }; update(k.id, { stageUtilityRules: arr }); }} className={inp} /></Field>
                  <Field label="Effect"><input value={u.effect} onChange={(e) => { const arr = [...k.stageUtilityRules]; arr[i] = { ...u, effect: e.target.value as typeof u.effect }; update(k.id, { stageUtilityRules: arr }); }} className={inp} /></Field>
                  <Field label="Valid target tags (csv)"><input value={csv(u.validTargetTags)} onChange={(e) => { const arr = [...k.stageUtilityRules]; arr[i] = { ...u, validTargetTags: parseCsv(e.target.value) }; update(k.id, { stageUtilityRules: arr }); }} className={inp} /></Field>
                  <Field label="Value"><input type="number" value={u.value ?? 0} onChange={(e) => { const arr = [...k.stageUtilityRules]; arr[i] = { ...u, value: parseFloat(e.target.value) || undefined }; update(k.id, { stageUtilityRules: arr }); }} className={inp} /></Field>
                </div>
              ))}
              {k.stageUtilityRules.length === 0 && <div className="text-slate-500">No utility rules.</div>}
            </div>
          )}

          {section === 'Socket' && (
            <div className="space-y-1 rounded-lg border border-slate-800 p-2">
              {(k.modelSocketConfig?.sockets ?? []).map((sk, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input value={String(sk.socketName)} onChange={(e) => { const cfg = k.modelSocketConfig!; const arr = [...cfg.sockets]; arr[i] = { ...sk, socketName: e.target.value }; update(k.id, { modelSocketConfig: { ...cfg, sockets: arr } }); }} className={inp + ' w-32'} />
                  {([0, 1, 2] as const).map((a) => (
                    <input key={a} type="number" step={0.1} value={sk.fallbackOffset[a]} onChange={(e) => { const cfg = k.modelSocketConfig!; const arr = [...cfg.sockets]; const off = [...sk.fallbackOffset] as [number, number, number]; off[a] = parseFloat(e.target.value) || 0; arr[i] = { ...sk, fallbackOffset: off }; update(k.id, { modelSocketConfig: { ...cfg, sockets: arr } }); }} className={inp + ' w-0 flex-1 text-center'} />
                  ))}
                </div>
              ))}
              {(k.modelSocketConfig?.sockets ?? []).length === 0 && <div className="text-slate-500">No sockets.</div>}
            </div>
          )}

          <div className="text-[10px]">
            {validateKit(k, skillExists).errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
            {validateKit(k, skillExists).warnings.map((w, i) => <div key={i} className="text-amber-400">⚠ {w}</div>)}
            {validateKit(k, skillExists).ok && <div className="text-emerald-400">✓ kit valid</div>}
          </div>
        </>
      )}
    </div>
  );
};
