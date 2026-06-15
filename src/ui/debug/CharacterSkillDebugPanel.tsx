import { useState } from 'react';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useCharacterSkillStore } from '../../stores/game/useCharacterSkillStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { getKitForCharacter } from '../../stores/game/editorCharacterKitStore';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { activeCombatantId } from '../../game/combat/CombatDirector';
import { castCharacterSkill, loadKitForCharacter } from '../../game/character-skills/CharacterSkillKitDirector';
import { spawnEnemyFromDef } from '../../game/combat/enemyRuntime';
import { robotHandle } from '../../game/destination/robotHandle';
import type { SkillSlotName } from '../../types/game/characterKit';

// Character-kit debug tools (Batch D-kits) — switch the test hero, cast each named slot, spawn a suitable
// enemy, show the combo buffer, and refill/reset. God-mode toggles live in the God Mode panel.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';
const MVP = [['char_jett', 'Jett'], ['char_donnie', 'Donnie'], ['char_paul', 'Paul'], ['char_chase', 'Chase']] as const;
const SLOTS: SkillSlotName[] = ['basic', 'special1', 'special2', 'aoe', 'defense', 'utility', 'ultimatePlaceholder'];

function spawnEnemy(defId: string): void {
  const def = getEnemyDef(defId); if (!def) return;
  const fx = Math.sin(robotHandle.heading), fz = Math.cos(robotHandle.heading);
  spawnEnemyFromDef(def, robotHandle.pos.x + fx * 9, robotHandle.pos.z + fz * 9);
}

export const CharacterSkillDebugPanel = () => {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const id = activeCombatantId();
  const kit = getKitForCharacter(id);
  const combo = useCharacterSkillStore((s) => (id ? s.comboStateByCharacterId[id] : undefined));

  const switchTo = (cid: string) => { useCharacterStore.getState().selectCharacter(cid); loadKitForCharacter(cid); };

  return (
    <div className="pointer-events-auto fixed right-4 top-44 z-40 w-72 rounded-xl border border-violet-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-300">🦸 Character Skills</div>
      <div className="mt-1 text-[10px] text-slate-400">active: {id ?? '—'} · kit: {kit?.displayName ?? '(none)'}</div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Switch test hero</div>
      <div className="flex flex-wrap gap-1">
        {MVP.map(([cid, name]) => <button key={cid} onClick={() => switchTo(cid)} className={`${btn} ${id === cid ? 'bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'}`}>{name}</button>)}
      </div>

      {kit && (
        <>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cast slot</div>
          <div className="flex flex-wrap gap-1">
            {SLOTS.filter((s) => kit.defaultSkillIds[s]).map((s) => <button key={s} onClick={() => id && castCharacterSkill(id, s)} className={`${btn} bg-sky-800 hover:bg-sky-700`}>{s}</button>)}
          </div>
        </>
      )}

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spawn enemy</div>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => spawnEnemy('crusher_drone')} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Crusher</button>
        <button onClick={() => spawnEnemy('pulse_turret')} className={`${btn} bg-amber-800 hover:bg-amber-700`}>Turret</button>
        <button onClick={() => spawnEnemy('shield_carrier')} className={`${btn} bg-blue-800 hover:bg-blue-700`}>Shield</button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={() => useCombatStore.setState({ activeCooldowns: {} })} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Reset CD</button>
        <button onClick={() => { if (id) { const st = useCombatStore.getState().playerStatsByCharacterId[id]; if (st) useCombatStore.getState().updateCombatStats(id, { energy: st.maxEnergy, hp: st.maxHp }); } }} className={`${btn} bg-emerald-700 hover:bg-emerald-600`}>Refill</button>
      </div>

      {combo && <div className="mt-2 text-[10px] text-slate-400">buffer: {combo.recentCasts.map((c) => c.skillId.replace(/.*_kit_/, '')).join(' → ') || '—'}{combo.lastComboTriggeredId && <span className="text-fuchsia-400"> · combo {combo.lastComboTriggeredId}</span>}</div>}

      <button onClick={() => setSnapshot(JSON.stringify({ id, kit: kit?.id, combo }, null, 2))} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export snapshot</button>
      {snapshot && <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snapshot}</pre>}
    </div>
  );
};
