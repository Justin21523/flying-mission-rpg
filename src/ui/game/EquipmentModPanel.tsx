import { useEquipmentModDefStore } from '../../stores/game/useEquipmentModDefStore';
import { useEquipmentModStore } from '../../stores/game/useEquipmentModStore';
import { useEquipmentModInventoryStore } from '../../stores/game/useEquipmentModInventoryStore';
import { MAX_MODS_PER_CHARACTER, RARITY_COLOR } from '../../types/game/equipmentMod';

// Wave 3/4 — per-character equipment-mod loadout (shown in Character Selection). Equip up to 3 OWNED mods
// (Wave 4 — rarer mods are earned via drops); multipliers apply live at cast time (EquipmentModResolver).
export const EquipmentModPanel = ({ characterId }: { characterId: string }) => {
  const owned = useEquipmentModInventoryStore((s) => s.ownedModIds);
  const catalog = useEquipmentModDefStore((s) => s.items).filter((m) => m.enabled !== false && owned.includes(m.id));
  const equipped = useEquipmentModStore((s) => s.equippedByCharacterId[characterId]) ?? [];
  const toggle = useEquipmentModStore((s) => s.toggleMod);

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
            const rarityColor = RARITY_COLOR[m.rarity ?? 'common'];
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
                <span className="min-w-0 flex-1 truncate text-[11px]" style={{ color: rarityColor }}>{m.name}</span>
                <span className="text-[10px] text-slate-400">{m.description}</span>
                <span className={`text-[10px] font-bold ${on ? 'text-emerald-300' : 'text-slate-500'}`}>{on ? '✓' : full ? '—' : '+'}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
