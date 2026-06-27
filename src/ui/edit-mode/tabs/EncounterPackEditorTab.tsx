import { useEncounterPackStore } from '../../../stores/useEncounterEditorStore';

export const EncounterPackEditorTab = () => {
  const packs = useEncounterPackStore((state) => state.items);
  return <div className="space-y-2 text-xs text-slate-300">{packs.map((pack) => <div key={pack.id} className="rounded border border-slate-700 p-2"><b>{pack.name}</b><br />{pack.encounterIds.join(', ')}</div>)}</div>;
};
