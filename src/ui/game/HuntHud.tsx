import { useHuntStore } from '../../stores/game/huntStore';
import { useYokaiCombatStore } from '../../stores/yokaiCombatStore';

// Destination yokai-hunt HUD — countdown + defeats while a hunt is running.
export const HuntHud = () => {
  const active = useHuntStore((s) => s.active);
  const timeLeft = useHuntStore((s) => s.timeLeft);
  const kills = useYokaiCombatStore((s) => s.kills);
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[60] -translate-x-1/2 rounded-xl border border-fuchsia-700/50 bg-slate-950/80 px-4 py-2 text-center backdrop-blur">
      <div className="text-[11px] font-bold uppercase tracking-wide text-fuchsia-200">Sprite Hunt</div>
      <div className="mt-0.5 flex items-baseline justify-center gap-4">
        <span className="font-mono text-2xl font-bold text-white">{Math.ceil(timeLeft)}s</span>
        <span className="text-sm text-emerald-300">✦ {kills}</span>
      </div>
    </div>
  );
};
