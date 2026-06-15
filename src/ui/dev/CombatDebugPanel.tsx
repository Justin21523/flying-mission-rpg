import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useEditorDamageableStore, useEditorEnemyStore, useEditorSpawnGroupStore, getSkillsForCharacter } from '../../stores/game/editorCombatStore';
import type { DamageableDefinition, EnemyDefinition } from '../../types/game/combat';
import { robotHandle } from '../../game/destination/robotHandle';
import { castSkillById, applyDamageToPlayer, activeCombatantId } from '../../game/combat/CombatDirector';
import { spawnEnemyFromDef } from '../../game/combat/enemyRuntime';
import { spawnGroup } from '../../game/combat/enemySpawnDirector';
import { useObstacleStore, liveObstacles } from '../../stores/game/obstacleStore';
import * as ObstacleDirector from '../../game/obstacles/ObstacleDirector';

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

function spawnEnemyNearPlayer(def: EnemyDefinition): void {
  const fx = Math.sin(robotHandle.heading), fz = Math.cos(robotHandle.heading);
  spawnEnemyFromDef(def, robotHandle.pos.x + fx * 10 + (Math.random() - 0.5) * 6, robotHandle.pos.z + fz * 10 + (Math.random() - 0.5) * 6);
}

export const CombatDebugPanel = () => {
  const cs = useCombatStore();
  const damageables = useEditorDamageableStore((s) => s.items);
  const enemies = useEditorEnemyStore((s) => s.items);
  const groups = useEditorSpawnGroupStore((s) => s.items);
  useObstacleStore((s) => s.version);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const id = cs.activeCombatantId ?? activeCombatantId();
  const stats = id ? cs.playerStatsByCharacterId[id] : undefined;
  const charSkills = getSkillsForCharacter(id);

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

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spawn enemy / boss</div>
      <div className="flex flex-wrap gap-1">
        {enemies.map((en) => (
          <button key={en.id} onClick={() => spawnEnemyNearPlayer(en)} className={`${btn} ${en.isBoss ? 'bg-fuchsia-800 hover:bg-fuchsia-700' : 'bg-rose-800 hover:bg-rose-700'}`}>{en.isBoss ? '👑 ' : ''}{en.name}</button>
        ))}
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spawn group</div>
      <div className="flex flex-wrap gap-1">
        {groups.map((g) => (
          <button key={g.id} onClick={() => { const fx = Math.sin(robotHandle.heading), fz = Math.cos(robotHandle.heading); spawnGroup(g.id, robotHandle.pos.x + fx * 12, robotHandle.pos.z + fz * 12); }} className={`${btn} bg-rose-800 hover:bg-rose-700`}>{g.id}</button>
        ))}
        {groups.length === 0 && <span className="text-[10px] text-slate-500">No spawn groups.</span>}
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Obstacles ({liveObstacles.length})</div>
      <div className="space-y-1">
        {liveObstacles.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center gap-1 text-[10px]">
            <span className="w-28 truncate text-slate-300">{o.id} · {o.state}</span>
            <button onClick={() => ObstacleDirector.interact(o.id)} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Interact</button>
            <button onClick={() => ObstacleDirector.repair(o.id, 100)} className={`${btn} bg-emerald-700 hover:bg-emerald-600`}>Repair</button>
            <button onClick={() => ObstacleDirector.debugClear(o.id)} className={`${btn} bg-rose-700 hover:bg-rose-600`}>Clear/Destroy</button>
          </div>
        ))}
        {liveObstacles.length === 0 && <span className="text-[10px] text-slate-500">No live obstacles (enter a segment with one).</span>}
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cast {id ?? 'character'} skills</div>
      <div className="flex flex-wrap gap-1">
        {charSkills.map((s) => (
          <button key={s.id} onClick={() => castSkillById(s.id)} className={`${btn} bg-sky-800 hover:bg-sky-700`} title={s.attackType}>[{s.slot}] {s.editorMeta?.displayName ?? s.name}</button>
        ))}
        {charSkills.length === 0 && <span className="text-[10px] text-slate-500">No skills for the active character.</span>}
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
