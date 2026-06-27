import { useArenaRunStore } from '../../stores/game/useArenaRunStore';
import { getRunBuffDef } from '../../stores/game/useRunBuffDefStore';
import { chooseBuff } from '../../game/arena-run/RunDirector';
import { panel } from './screenChrome';

// Batch N — roguelite "pick 1 of 3" buff overlay shown between rounds (status 'choosing'). Picking a buff
// applies it (live) and advances to the next round.
export const RunBuffChoiceOverlay = () => {
  const active = useArenaRunStore((s) => s.active);
  const status = useArenaRunStore((s) => s.status);
  const round = useArenaRunStore((s) => s.round);
  const choices = useArenaRunStore((s) => s.pendingChoices);
  if (!active || status !== 'choosing') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className={`${panel} w-[40rem] max-w-[92vw] p-5`}>
        <div className="text-center text-xs font-black uppercase tracking-widest text-sky-300">Round {round} cleared — choose an upgrade</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {choices.map((id) => {
            const def = getRunBuffDef(id);
            if (!def) return null;
            return (
              <button
                key={id}
                onClick={() => chooseBuff(id)}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-500/5"
              >
                <span className="text-3xl">{def.editorMeta?.icon ?? '⭐'}</span>
                <span className="text-sm font-black text-slate-100">{def.name}</span>
                <span className="text-[11px] text-slate-400">{def.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
