import { useHangarUpgradeDefStore } from '../../stores/game/useHangarUpgradeDefStore';
import { useHangarUpgradeStore } from '../../stores/game/useHangarUpgradeStore';
import { useWalletStore } from '../../stores/walletStore';
import { canPurchase, tryPurchase } from '../../game/progression/HangarBonusResolver';

// Batch L — account-wide Hangar upgrades bought with coins (shown in Character Selection / hub). Coins come
// from enemy kills + stage rewards. Dev controls (Edit Mode) add coins / max all / reset.
export const HangarUpgradePanel = ({ editMode = false }: { editMode?: boolean }) => {
  const defs = useHangarUpgradeDefStore((s) => s.items);
  useHangarUpgradeStore((s) => s.levelByNodeId);
  const setLevel = useHangarUpgradeStore((s) => s.setLevel);
  const coins = useWalletStore((s) => s.coins);
  const addCoins = useWalletStore((s) => s.addCoins);
  const getLevel = useHangarUpgradeStore.getState().getLevel;

  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/50 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-100">🛠 Hangar Upgrades</span>
        <span className="text-[11px] text-slate-300">💰 <b className="text-amber-300">{coins}</b></span>
      </div>

      <div className="mt-1 space-y-1">
        {defs.map((d) => {
          const lvl = getLevel(d.id);
          const maxed = lvl >= d.maxLevel;
          const affordable = canPurchase(d.id);
          return (
            <div key={d.id} className="flex items-center gap-2 rounded border border-slate-800 px-1.5 py-1">
              <span className="text-sm">{d.editorMeta?.icon ?? '🔧'}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-bold text-slate-200">{d.name}</div>
                <div className="truncate text-[10px] text-slate-500">{d.description}</div>
              </div>
              <span className="text-[10px] text-slate-400">Lv {lvl}/{d.maxLevel}</span>
              <button
                disabled={maxed || !affordable}
                onClick={() => tryPurchase(d.id)}
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  maxed ? 'bg-slate-800 text-slate-500'
                    : affordable ? 'bg-amber-600/40 text-amber-100 hover:bg-amber-600/60'
                      : 'bg-slate-800 text-slate-500'
                }`}
              >
                {maxed ? 'MAX' : `💰 ${d.perLevel.cost}`}
              </button>
            </div>
          );
        })}
      </div>

      {editMode && (
        <div className="mt-1.5 flex flex-wrap gap-1 border-t border-slate-800 pt-1.5">
          <button onClick={() => addCoins(1000)} className="rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/10">+1000 coins (dev)</button>
          <button onClick={() => { for (const d of defs) setLevel(d.id, d.maxLevel); }} className="rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/10">Max all (dev)</button>
          <button onClick={() => { for (const d of defs) setLevel(d.id, 0); }} className="rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/10">Reset (dev)</button>
        </div>
      )}
    </div>
  );
};
