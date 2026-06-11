import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';

export const SupportDispatchStatusPanel = () => {
  const dispatches = useSupportRuntimeStore((s) => s.dispatches);
  if (dispatches.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-3 top-20 z-[60] w-64 rounded-xl border border-sky-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
      <div className="mb-1 font-bold text-sky-200">Support en route</div>
      <div className="space-y-1">
        {dispatches.map((d) => (
          <div key={d.characterId} className="flex justify-between gap-2">
            <span className="truncate">{getEditorCharacter(d.characterId)?.name ?? d.characterId}</span>
            <span className="font-mono text-sky-200">{d.status} · {Math.ceil(d.etaSeconds)}s</span>
          </div>
        ))}
      </div>
    </div>
  );
};
