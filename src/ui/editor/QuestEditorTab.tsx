import { useState } from 'react';
import { useEditorQuestStore } from '../../stores/editorQuestStore';
import { QuestInspector } from './QuestInspector';
import { ITEM_CATEGORIES, ITEM_RARITIES, ITEM_USE_KINDS, type Item, type ItemCategory, type ItemRarity, type ItemUseKind } from '../../types/item';

const inp = 'rounded bg-slate-800 px-1.5 py-1 text-xs text-slate-100 border border-slate-700';
const btn = 'rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700';

// One item row — name/icon/description + attributes (category, rarity, value, sellable, quest item, on-use
// effect, gift trust). Collapsible to keep the list compact.
const ItemRow = ({ it }: { it: Item }) => {
  const save = (patch: Partial<Item>) => useEditorQuestStore.getState().upsertItem({ ...it, ...patch });
  const eff = it.useEffect ?? { kind: 'none' as ItemUseKind };
  return (
    <details className="rounded border border-slate-700/60 bg-slate-900/40 p-1.5">
      <summary className="flex cursor-pointer items-center gap-1">
        <input className={`w-10 ${inp}`} value={it.icon ?? ''} onChange={(e) => save({ icon: e.target.value })} placeholder="◆" />
        <input className={`w-28 ${inp}`} value={it.name} onChange={(e) => save({ name: e.target.value })} />
        <span className="flex-1 truncate text-[10px] text-slate-500">{it.category ?? 'misc'} · {it.rarity ?? 'common'}</span>
        <button className={`${btn} text-red-300`} onClick={() => useEditorQuestStore.getState().removeItem(it.id)}>🗑</button>
      </summary>
      <input className={`mt-1 w-full ${inp}`} value={it.description} onChange={(e) => save({ description: e.target.value })} placeholder="description" />
      <div className="mt-1 grid grid-cols-3 gap-1">
        <label className="text-[9px] text-slate-400">category<select className={inp} value={it.category ?? 'misc'} onChange={(e) => save({ category: e.target.value as ItemCategory })}>{ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
        <label className="text-[9px] text-slate-400">rarity<select className={inp} value={it.rarity ?? 'common'} onChange={(e) => save({ rarity: e.target.value as ItemRarity })}>{ITEM_RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
        <label className="text-[9px] text-slate-400">value 🪙<input type="number" className={inp} value={it.value ?? 0} onChange={(e) => save({ value: parseInt(e.target.value, 10) || 0 })} /></label>
        <label className="text-[9px] text-slate-400">gift trust<input type="number" className={inp} value={it.giftTrust ?? 0} onChange={(e) => save({ giftTrust: parseInt(e.target.value, 10) || 0 })} /></label>
        <label className="flex items-end gap-1 text-[9px] text-slate-400"><input type="checkbox" checked={!!it.consumable} onChange={(e) => save({ consumable: e.target.checked })} />consumable</label>
        <label className="flex items-end gap-1 text-[9px] text-slate-400"><input type="checkbox" checked={!!it.sellable} onChange={(e) => save({ sellable: e.target.checked })} />sellable</label>
        <label className="flex items-end gap-1 text-[9px] text-slate-400"><input type="checkbox" checked={!!it.questItem} onChange={(e) => save({ questItem: e.target.checked })} />quest item</label>
      </div>
      {it.consumable && (
        <div className="mt-1 grid grid-cols-3 gap-1">
          <label className="text-[9px] text-slate-400">on use<select className={inp} value={eff.kind} onChange={(e) => save({ useEffect: { ...eff, kind: e.target.value as ItemUseKind } })}>{ITEM_USE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
          {eff.kind !== 'none' && eff.kind !== 'flag' && <label className="text-[9px] text-slate-400">amount<input type="number" className={inp} value={eff.amount ?? 0} onChange={(e) => save({ useEffect: { ...eff, amount: parseInt(e.target.value, 10) || 0 } })} /></label>}
          {eff.kind === 'flag' && <label className="text-[9px] text-slate-400">flag<input className={inp} value={eff.flag ?? ''} onChange={(e) => save({ useEffect: { ...eff, flag: e.target.value } })} /></label>}
        </div>
      )}
    </details>
  );
};

// Kit — the 📜 Quest / Item tab: quest list (left) + full inspector (right), plus an Items authoring
// section. Authored quests register into the runtime live; objectives auto-track via questTracking.
export const QuestEditorTab = () => {
  const quests = useEditorQuestStore((s) => s.quests);
  const items = useEditorQuestStore((s) => s.items);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = quests.find((q) => q.id === selId) ?? null;

  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-3">
        <div className="w-44 shrink-0 space-y-2">
          <button className={`w-full ${btn}`} onClick={() => setSelId(useEditorQuestStore.getState().newQuest())}>+ New Quest</button>
          <div className="max-h-[55vh] space-y-0.5 overflow-y-auto">
            {quests.map((q) => (
              <button key={q.id} onClick={() => setSelId(q.id)} className={`block w-full truncate rounded px-2 py-1 text-left ${selId === q.id ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'}`}>
                {q.title} <span className="text-[9px] text-slate-500">· {q.objectives.length}obj</span>
              </button>
            ))}
            {quests.length === 0 && <p className="px-1 text-[10px] text-slate-500">No quests yet — “+ New Quest”.</p>}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {sel ? <QuestInspector eq={sel} /> : <p className="text-[11px] text-slate-500">Select or create a quest to edit it.</p>}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 rounded border border-slate-700 bg-slate-900/50 p-2">
        <div className="flex items-center justify-between"><h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Items</h4>
          <button className={btn} onClick={() => useEditorQuestStore.getState().newItem()}>+ New Item</button>
        </div>
        {items.length === 0 && <p className="text-[10px] text-slate-400">No authored items. Seed items (Old Key, Healing Herb) are always available.</p>}
        {items.map((it) => <ItemRow key={it.id} it={it} />)}
      </div>
    </div>
  );
};
