import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useEditorDamageableStore } from '../../stores/game/editorCombatStore';
import type { DamageableDefinition } from '../../types/game/combat';
import { robotHandle } from '../../game/destination/robotHandle';
import { castSkillById, applyDamageToPlayer, activeCombatantId } from '../../game/combat/CombatDirector';

// Developer tools for the Combat Runtime — god mode, debug flags, spawn/reset dummies, cast test skills,
// and player vitals controls. Mounted in App.tsx for the game-state console / Edit Mode during combat phases.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';

function spawnDummy(def: DamageableDefinition): void {
  const fx = Math.sin(robotHandle.heading);
  const fz = Math.cos(robotHandle.heading);
  useCombatTargetStore.getState().spawn({
    id: `tgt_${nanoid(6)}`,
    definitionId: def.id,
    hp: def.maxHp,
    maxHp: def.maxHp,
    shield: def.shieldRules?.enabled ? def.shieldRules.shieldHp : 0,
    maxShield: def.shieldRules?.enabled ? def.shieldRules.shieldHp : (def.maxShield ?? 0),
    x: robotHandle.pos.x + fx * 8 + (Math.random() - 0.5) * 4,
    y: robotHandle.pos.y,
    z: robotHandle.pos.z + fz * 8 + (Math.random() - 0.5) * 4,
    defeatedAt: 0,
  });
}

export const CombatDebugPanel = () => {
  const cs = useCombatStore();
  const damageables = useEditorDamageableStore((s) => s.items);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const id = cs.activeCombatantId ?? activeCombatantId();
  const stats = id ? cs.playerStatsByCharacterId[id] : undefined;

  const exportSnapshot = () => {
    const data = {
      activeCombatantId: id,
      stats,
      cooldowns: cs.activeCooldowns,
      liveTargets: liveTargets.map((t) => ({ id: t.id, def: t.definitionId, hp: t.hp, shield: t.shield, dead: !!t.defeatedAt })),
      lastDamageResults: cs.lastDamageResults,
      flags: { godMode: cs.godMode, ignoreEnergyCost: cs.ignoreEnergyCost, ignoreCooldown: cs.ignoreCooldown, showHitVolumes: cs.showHitVolumes, showDamageNumbers: cs.showDamageNumbers },
    };
    const json = JSON.stringify(data, null, 2);
    setSnapshot(json);
    void navigator.clipboard?.writeText(json).catch(() => {});
  };

  const heal = (patch: Partial<NonNullable<typeof stats>>) => { if (id) cs.updateCombatStats(id, patch); };

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-40 w-80 rounded-xl border border-rose-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">⚔ Combat Debug</div>

      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={cs.godMode} onChange={(e) => cs.setGodMode(e.target.checked)} className="accent-fuchsia-500" /> God mode</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={cs.ignoreEnergyCost} onChange={(e) => cs.setDebugFlag('ignoreEnergyCost', e.target.checked)} className="accent-amber-500" /> ∞ Energy</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={cs.ignoreCooldown} onChange={(e) => cs.setDebugFlag('ignoreCooldown', e.target.checked)} className="accent-sky-500" /> No cooldown</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={cs.showHitVolumes} onChange={(e) => cs.setDebugFlag('showHitVolumes', e.target.checked)} className="accent-emerald-500" /> Hit volumes</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={cs.showDamageNumbers} onChange={(e) => cs.setDebugFlag('showDamageNumbers', e.target.checked)} className="accent-yellow-500" /> Dmg numbers</label>
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spawn dummy</div>
      <div className="flex flex-wrap gap-1">
        {damageables.map((d) => (
          <button key={d.id} onClick={() => spawnDummy(d)} className={`${btn} bg-slate-700 hover:bg-slate-600`}>{d.editorMeta?.displayName ?? d.id}</button>
        ))}
        <button onClick={() => useCombatTargetStore.getState().reset()} className={`${btn} bg-rose-700 hover:bg-rose-600`}>Reset</button>
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cast test skill</div>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => castSkillById('skill_basic_arc_test')} className={`${btn} bg-orange-700 hover:bg-orange-600`}>Arc (J)</button>
        <button onClick={() => castSkillById('skill_line_pierce_test')} className={`${btn} bg-sky-700 hover:bg-sky-600`}>Line (K)</button>
        <button onClick={() => castSkillById('skill_ring_burst_test')} className={`${btn} bg-fuchsia-700 hover:bg-fuchsia-600`}>Ring (L)</button>
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Player</div>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => applyDamageToPlayer(20)} className={`${btn} bg-rose-700 hover:bg-rose-600`}>Damage 20</button>
        <button onClick={() => stats && heal({ hp: stats.maxHp, downed: false })} className={`${btn} bg-emerald-700 hover:bg-emerald-600`}>Heal</button>
        <button onClick={() => stats && heal({ energy: stats.maxEnergy })} className={`${btn} bg-amber-700 hover:bg-amber-600`}>Refill energy</button>
        <button onClick={() => heal({ shield: 0 })} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Break shield</button>
      </div>

      <button onClick={exportSnapshot} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export snapshot (copy)</button>
      {snapshot && <pre className="mt-1 max-h-28 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snapshot}</pre>}
    </div>
  );
};
