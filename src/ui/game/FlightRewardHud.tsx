import { useEffect, useState } from 'react';
import { useFlightScoreStore } from '../../stores/game/flightScoreStore';
import { useEditorFlightStore } from '../../stores/game/editorFlightStore';

// World-flight reward HUD — score, collectibles, combo (×N with a draining timer bar) and a boost badge.
// `now` comes from an interval (impure clock read kept out of render) so the timers animate.
export const FlightRewardHud = () => {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now() / 1000), 100);
    return () => clearInterval(id);
  }, []);
  const score = useFlightScoreStore((s) => s.score);
  const collected = useFlightScoreStore((s) => s.collected);
  const comboCount = useFlightScoreStore((s) => s.combo);
  const comboUntil = useFlightScoreStore((s) => s.comboUntil);
  const boostUntil = useFlightScoreStore((s) => s.boostUntil);
  const comboWindow = useEditorFlightStore((s) => Math.max(0.5, s.tuning.comboWindowSec));

  const comboLeft = Math.max(0, comboUntil - now);
  const comboPct = Math.max(0, Math.min(1, comboLeft / comboWindow));
  const combo = comboLeft > 0 ? comboCount : 0;
  const boost = now < boostUntil;
  return (
    <div className="pointer-events-none fixed right-3 top-20 z-[60] w-40 rounded-xl border border-amber-700/50 bg-slate-950/75 p-2 text-right backdrop-blur">
      <div className="font-mono text-lg font-bold text-amber-200">{score}</div>
      <div className="text-[10px] text-slate-400">✦ {collected} collected</div>
      {combo > 1 && (
        <div className="mt-1">
          <div className="text-sm font-bold text-fuchsia-300">×{combo} combo</div>
          <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-slate-800">
            <div className="h-full bg-fuchsia-400" style={{ width: `${comboPct * 100}%` }} />
          </div>
        </div>
      )}
      {boost && <div className="mt-1 text-[11px] font-bold text-sky-300">⚡ BOOST</div>}
    </div>
  );
};
