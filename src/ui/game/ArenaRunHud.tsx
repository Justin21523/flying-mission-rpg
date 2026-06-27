import { useArenaRunStore } from '../../stores/game/useArenaRunStore';
import { getRunConfig } from '../../stores/game/useRunConfigStore';

// Batch N — top HUD for an arena run: mode · round (/total for roguelite) · lives · kills, plus a BOSS ROUND
// banner. Reads the non-persistent run store.
export const ArenaRunHud = () => {
  const active = useArenaRunStore((s) => s.active);
  const mode = useArenaRunStore((s) => s.mode);
  const round = useArenaRunStore((s) => s.round);
  const lives = useArenaRunStore((s) => s.lives);
  const kills = useArenaRunStore((s) => s.kills);
  const status = useArenaRunStore((s) => s.status);
  if (!active) return null;

  const totalRounds = mode === 'roguelite' ? getRunConfig().roguelite.totalRounds : undefined;
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-30 -translate-x-1/2 text-center">
      <div className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-1 text-xs text-slate-100 shadow backdrop-blur">
        <span className="font-black uppercase tracking-widest text-sky-300">{mode === 'endless' ? '🌀 Endless' : '🎲 Roguelite'}</span>
        <span className="mx-2 text-slate-500">·</span>
        <span>Round <b className="text-amber-300">{round}{totalRounds ? `/${totalRounds}` : ''}</b></span>
        <span className="mx-2 text-slate-500">·</span>
        <span className="text-rose-300">{'❤'.repeat(Math.max(0, lives)) || '—'}</span>
        <span className="mx-2 text-slate-500">·</span>
        <span className="text-slate-300">{kills} kills</span>
      </div>
      {status === 'boss' && (
        <div className="mt-1 animate-pulse text-[11px] font-black uppercase tracking-widest text-rose-400">⚔ Boss Round</div>
      )}
    </div>
  );
};
