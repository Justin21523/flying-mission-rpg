import { useState } from 'react';
import { useEquipmentModDefStore } from '../../stores/game/useEquipmentModDefStore';
import { useEquipmentModStore } from '../../stores/game/useEquipmentModStore';
import { useEquipmentModInventoryStore } from '../../stores/game/useEquipmentModInventoryStore';
import { useEquipmentFusionRecipeStore } from '../../stores/game/useEquipmentFusionRecipeStore';
import { useWalletStore } from '../../stores/walletStore';
import { canFuse, fuse, ownedOfRarity } from '../../game/progression/EquipmentModFusionDirector';
import { getEquipmentModDef } from '../../stores/game/useEquipmentModDefStore';
import { MAX_MODS_PER_CHARACTER, RARITY_COLOR } from '../../types/game/equipmentMod';

// Wave 3/4/5 — per-character equipment-mod loadout + Wave 5 fusion. Equip up to 3 OWNED mods (duplicates show
// ×N); fuse N mods of one rarity into a random higher-rarity mod for coins.
export const EquipmentModPanel = ({ characterId }: { characterId: string }) => {
  const ownedCounts = useEquipmentModInventoryStore((s) => s.ownedCountByModId);
  const catalog = useEquipmentModDefStore((s) => s.items).filter((m) => m.enabled !== false && (ownedCounts[m.id] ?? 0) > 0);
  const equipped = useEquipmentModStore((s) => s.equippedByCharacterId[characterId]) ?? [];
  const toggle = useEquipmentModStore((s) => s.toggleMod);
  const recipes = useEquipmentFusionRecipeStore((s) => s.items).filter((r) => r.enabled !== false);
  useWalletStore((s) => s.coins); // re-render on coin change
  const [msg, setMsg] = useState<string>('');

  const onFuse = (recipeId: string) => {
    const res = fuse(recipeId);
    if (res.ok && res.producedModId) setMsg(`Crafted ${getEquipmentModDef(res.producedModId)?.name ?? 'a mod'}!`);
    else setMsg(res.reason ?? 'Fusion failed.');
  };

  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/50 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-100">🔧 Mods</span>
        <span className="text-[11px] text-slate-300"><b className="text-amber-300">{equipped.length}</b>/{MAX_MODS_PER_CHARACTER} equipped</span>
      </div>
      {catalog.length === 0 ? (
        <div className="mt-1 text-[11px] text-slate-500">No mods owned — defeat enemies and bosses to find some.</div>
      ) : (
        <div className="mt-1 max-h-40 space-y-1 overflow-auto pr-1">
          {catalog.map((m) => {
            const on = equipped.includes(m.id);
            const full = equipped.length >= MAX_MODS_PER_CHARACTER && !on;
            const n = ownedCounts[m.id] ?? 0;
            return (
              <button
                key={m.id}
                disabled={full}
                onClick={() => toggle(characterId, m.id)}
                className={`flex w-full items-center gap-2 rounded border px-1.5 py-1 text-left ${
                  on ? 'border-emerald-500/60 bg-emerald-600/20'
                    : full ? 'border-slate-800 bg-slate-900/40 opacity-50'
                      : 'border-slate-800 bg-slate-900/40 hover:border-emerald-400/50'
                }`}
              >
                <span>{m.editorMeta?.icon ?? '🔧'}</span>
                <span className="min-w-0 flex-1 truncate text-[11px]" style={{ color: RARITY_COLOR[m.rarity ?? 'common'] }}>{m.name}{n > 1 ? ` ×${n}` : ''}</span>
                <span className="text-[10px] text-slate-400">{m.description}</span>
                <span className={`text-[10px] font-bold ${on ? 'text-emerald-300' : 'text-slate-500'}`}>{on ? '✓' : full ? '—' : '+'}</span>
              </button>
            );
          })}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="mt-2 border-t border-slate-800 pt-2">
          <div className="text-[11px] font-black text-slate-300">⚗ Fuse</div>
          <div className="mt-1 space-y-1">
            {recipes.map((r) => {
              const have = ownedOfRarity(r.inputRarity);
              const ok = canFuse(r.id);
              return (
                <button key={r.id} disabled={!ok} onClick={() => onFuse(r.id)}
                  className={`flex w-full items-center gap-2 rounded border px-1.5 py-1 text-left text-[11px] ${ok ? 'border-slate-800 bg-slate-900/40 hover:border-amber-400/60' : 'border-slate-800 bg-slate-900/30 opacity-50'}`}>
                  <span className="min-w-0 flex-1 truncate">
                    {r.inputCount}× <span style={{ color: RARITY_COLOR[r.inputRarity] }}>{r.inputRarity}</span> → <span style={{ color: RARITY_COLOR[r.outputRarity] }}>{r.outputRarity}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">have {have}/{r.inputCount}</span>
                  <span className="text-[10px] font-bold text-amber-300">🪙 {r.coinCost}</span>
                </button>
              );
            })}
          </div>
          {msg && <div className="mt-1 text-[10px] text-emerald-300">{msg}</div>}
        </div>
      )}
    </div>
  );
};
