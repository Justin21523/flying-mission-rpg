import { getInitializedEncounters, triggerEncounter, updateEncounterClearState } from '../../game/encounters/EncounterDirector';
import { Btn, panel } from '../game/screenChrome';

export const EncounterDebugPanel = () => {
  const encounters = getInitializedEncounters();
  if (!encounters.length) return null;
  return (
    <div className={`${panel} fixed left-3 top-[22rem] z-50 w-72 p-3 text-xs`}>
      <div className="mb-2 font-bold text-sky-200">Encounter Debug</div>
      <Btn tone="ghost" onClick={() => updateEncounterClearState()}>Refresh clear</Btn>
      {encounters.map((encounter) => <button key={encounter.id} className="mt-1 block text-left text-slate-300 hover:text-white" onClick={() => triggerEncounter(encounter.id)}>{encounter.id}</button>)}
    </div>
  );
};
