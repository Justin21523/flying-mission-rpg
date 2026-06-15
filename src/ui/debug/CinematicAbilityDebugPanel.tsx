import { useState } from 'react';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCinematicAbilityEditorStore, cinematicAbilitiesForCharacter } from '../../stores/game/useCinematicAbilityEditorStore';
import { castCharacterSkillById, loadKitForCharacter } from '../../game/character-skills/CharacterSkillKitDirector';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { spawnEnemyFromDef } from '../../game/combat/enemyRuntime';
import { robotHandle } from '../../game/destination/robotHandle';
import { exportEffectSnapshot } from '../../game/vfx/CinematicVfxDirector';
import { useNowMs } from '../../game/combat/useNowMs';

// 🎬 Cinematic Ability debug panel (Batch F.5) — pick a hero, cast any of its 11 abilities, spawn a dummy
// enemy, toggle no-cooldown/no-energy, export the ability's effect snapshot.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';
const CHARS = [['char_jett', 'Jett'], ['char_jerome', 'Jerome'], ['char_paul', 'Paul'], ['char_donnie', 'Donnie'], ['char_todd', 'Todd'], ['char_flip', 'Flip'], ['char_bello', 'Bello'], ['char_chase', 'Chase']] as const;

export const CinematicAbilityDebugPanel = () => {
  useNowMs(300);
  useCinematicAbilityEditorStore((s) => s.items);
  const [char, setChar] = useState('char_jett');
  const [snap, setSnap] = useState<string | null>(null);
  // Select primitives separately — an object-literal selector returns a new ref each render → infinite loop.
  const ignoreCd = useCombatStore((s) => s.ignoreCooldown);
  const ignoreEn = useCombatStore((s) => s.ignoreEnergyCost);
  const abilities = cinematicAbilitiesForCharacter(char);
  const spawnDummy = () => { const d = getEnemyDef('crusher_drone'); if (d) spawnEnemyFromDef(d, robotHandle.pos.x + Math.sin(robotHandle.heading) * 8, robotHandle.pos.z + Math.cos(robotHandle.heading) * 8); };

  return (
    <div className="pointer-events-auto fixed right-4 top-[8.5rem] z-40 w-72 rounded-xl border border-pink-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-pink-300">🎬 Cinematic Abilities</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {CHARS.map(([id, n]) => <button key={id} onClick={() => { setChar(id); useCharacterStore.getState().selectCharacter(id); loadKitForCharacter(id); }} className={`${btn} ${char === id ? 'bg-pink-700' : 'bg-slate-700 hover:bg-slate-600'}`}>{n}</button>)}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {abilities.map((a) => (
          <button key={a.id} onClick={() => { loadKitForCharacter(char); castCharacterSkillById(char, a.combat.skillDefinitionId); }} className={`${btn} ${a.abilityCategory === 'ultimate' ? 'bg-fuchsia-800 hover:bg-fuchsia-700' : a.abilityCategory === 'defense' ? 'bg-blue-800 hover:bg-blue-700' : 'bg-sky-800 hover:bg-sky-700'}`} title={a.description}>{a.name}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={spawnDummy} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Spawn dummy</button>
        <button onClick={() => useCombatStore.getState().setDebugFlag('ignoreCooldown', !ignoreCd)} className={`${btn} ${ignoreCd ? 'bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}>No CD</button>
        <button onClick={() => useCombatStore.getState().setDebugFlag('ignoreEnergyCost', !ignoreEn)} className={`${btn} ${ignoreEn ? 'bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}>No energy</button>
      </div>
      <div className="mt-1 text-[9px] text-slate-400">{abilities.length} abilities · {abilities.filter((a) => a.abilityCategory === 'attack').length}A/{abilities.filter((a) => a.abilityCategory === 'defense').length}D/{abilities.filter((a) => a.abilityCategory === 'ultimate').length}U</div>
      <button onClick={() => setSnap(exportEffectSnapshot(abilities[0]?.vfx.cinematicEffectId ?? ''))} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export first effect</button>
      {snap && <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snap}</pre>}
    </div>
  );
};
