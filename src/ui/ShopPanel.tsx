import { useShopStore } from '../stores/shopStore';
import { useWalletStore } from '../stores/walletStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useItemOptions } from './editor/editorShared';
import { playSfx } from '../game/audio/sfx';
import { useT } from '../i18n/useT';

// POLI — vendor shop. Opened by interacting with a vendor NPC; buy items with coins (walletStore →
// inventoryStore). Closes with ✕ or Esc-equivalent button.
export const ShopPanel = () => {
  const open = useShopStore((s) => s.open);
  const title = useShopStore((s) => s.title);
  const items = useShopStore((s) => s.items);
  const coins = useWalletStore((s) => s.coins);
  const itemOptions = useItemOptions();
  const t = useT();
  if (!open) return null;
  const labelOf = (id: string) => itemOptions.find((o) => o.id === id)?.label ?? id;

  const buy = (itemId: string, price: number) => {
    if (!useWalletStore.getState().spend(price)) { playSfx('rescueFail'); return; }
    useInventoryStore.getState().addItem(itemId);
    playSfx('questComplete');
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 z-[90] w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-emerald-600/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="flex-1 truncate text-sm font-bold text-emerald-100">🛒 {title}</h3>
        <span className="rounded-full bg-amber-950/70 px-2 py-0.5 text-xs font-bold text-amber-200">🪙 {coins}</span>
        <button onClick={() => useShopStore.getState().close()} className="rounded px-1.5 text-slate-300 hover:bg-slate-800">✕</button>
      </div>
      <div className="space-y-1">
        {items.length === 0 && <div className="text-[11px] text-slate-500">{t('shop_nothing')}</div>}
        {items.map((it, i) => {
          const afford = coins >= it.price;
          return (
            <div key={`${it.itemId}-${i}`} className="flex items-center gap-2 rounded bg-slate-900/60 px-2 py-1 text-xs">
              <span className="flex-1 truncate text-slate-100">{labelOf(it.itemId)}</span>
              <span className="font-mono text-amber-200">🪙 {it.price}</span>
              <button disabled={!afford} onClick={() => buy(it.itemId, it.price)}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold ${afford ? 'bg-emerald-600/40 text-emerald-100 hover:bg-emerald-600/60' : 'cursor-not-allowed bg-slate-800 text-slate-500'}`}>{t('shop_buy')}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
