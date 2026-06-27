import { useStageContentPackStore } from '../../../stores/useStageContentEditorStore';

export const StageContentPackEditorTab = () => {
  const packs = useStageContentPackStore((state) => state.items);
  return (
    <div className="space-y-2 text-xs text-slate-300">
      <h2 className="text-sm font-bold text-sky-200">Stage Content Packs</h2>
      {packs.map((pack) => (
        <div key={pack.id} className="rounded border border-slate-700 bg-slate-950/50 p-3">
          <div className="font-bold text-slate-100">{pack.name}</div>
          <div>{pack.stageId} · {pack.editorMeta?.contentStatus}</div>
          <div className="mt-1 text-slate-400">Encounters: {pack.encounterPackIds.join(', ')}</div>
          <div className="text-slate-400">Systems: {Object.entries(pack.requiredGameplaySystems).filter(([, on]) => on).map(([key]) => key).join(', ')}</div>
        </div>
      ))}
    </div>
  );
};
