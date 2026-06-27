import { useEditorCombatSkillStore, getSkillsForCharacter } from '../../stores/game/editorCombatStore';
import { useSkillUpgradeStore } from '../../stores/game/useSkillUpgradeStore';
import { useCharacterProgressionStore, expToNextLevel } from '../../stores/game/useCharacterProgressionStore';
import { getMaxSkillLevel } from '../../stores/game/useSkillUpgradeCurveStore';
import { availablePoints, getSkillLevel, nextLevelCost, canUpgrade, tryUpgradeSkill } from '../../game/progression/SkillUpgradeResolver';

// Batch L — per-character skill upgrade panel (shown in Character Selection). Spend skill points (earned by
// levelling the character via enemy kills) to raise a skill's level → more damage, lower cooldown/energy.
// Dev controls (Edit Mode) grant EXP / max all / reset so any state is reachable.
export const SkillUpgradePanel = ({ characterId, editMode = false }: { characterId: string; editMode?: boolean }) => {
  // Subscriptions: re-render when the skill roster, upgrade levels, or character progress change.
  useEditorCombatSkillStore((s) => s.items);
  useSkillUpgradeStore((s) => s.levelBySkillId);
  const entry = useCharacterProgressionStore((s) => s.byId[characterId]) ?? { level: 1, exp: 0 };
  const addExp = useCharacterProgressionStore((s) => s.addExp);
  const setLevel = useSkillUpgradeStore((s) => s.setLevel);

  const skills = getSkillsForCharacter(characterId);
  const points = availablePoints(characterId);
  const maxLevel = getMaxSkillLevel();

  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/50 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-100">⬆ Upgrades</span>
        <span className="text-[11px] text-slate-300">
          Lv <b className="text-sky-300">{entry.level}</b> · {entry.exp}/{expToNextLevel(entry)} EXP · <b className="text-amber-300">{points}</b> pts
        </span>
      </div>

      {skills.length === 0 ? (
        <div className="mt-1 text-[11px] text-slate-500">No upgradeable skills for this character.</div>
      ) : (
        <div className="mt-1 max-h-40 space-y-1 overflow-auto pr-1">
          {skills.map((sk) => {
            const lvl = getSkillLevel(sk.id);
            const cost = nextLevelCost(sk.id);
            const maxed = lvl >= maxLevel || cost == null;
            const affordable = canUpgrade(characterId, sk.id);
            return (
              <div key={sk.id} className="flex items-center gap-2 rounded border border-slate-800 px-1.5 py-1">
                <span className="min-w-0 flex-1 truncate text-[11px] text-slate-200">{sk.name}</span>
                <span className="text-[10px] text-slate-400">Lv {lvl}/{maxLevel}</span>
                <button
                  disabled={maxed || !affordable}
                  onClick={() => tryUpgradeSkill(characterId, sk.id)}
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    maxed ? 'bg-slate-800 text-slate-500'
                      : affordable ? 'bg-emerald-600/40 text-emerald-100 hover:bg-emerald-600/60'
                        : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {maxed ? 'MAX' : `▲ ${cost}pt`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editMode && (
        <div className="mt-1.5 flex flex-wrap gap-1 border-t border-slate-800 pt-1.5">
          <button onClick={() => addExp(characterId, 500)} className="rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/10">+500 EXP (dev)</button>
          <button onClick={() => { for (const sk of skills) setLevel(sk.id, maxLevel); }} className="rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/10">Max all (dev)</button>
          <button onClick={() => { for (const sk of skills) setLevel(sk.id, 0); }} className="rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/10">Reset (dev)</button>
        </div>
      )}
    </div>
  );
};
