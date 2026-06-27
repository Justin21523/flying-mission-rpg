import { useArenaRunStore } from '../../stores/game/useArenaRunStore';
import { useWalletStore } from '../../stores/walletStore';
import { useRunRecordStore } from '../../stores/game/useRunRecordStore';
import { getRunConfig } from '../../stores/game/useRunConfigStore';
import { buyRevive, endRun } from '../../game/arena-run/RunDirector';
import { Btn, panel } from './screenChrome';

// Batch N — game-over / victory overlay for an arena run. Coins/EXP earned during the run already persisted to
// the wallet/character via KillRewards; this just reports the result + offers a coin-revive on death.
export const RunResultsOverlay = () => {
  const active = useArenaRunStore((s) => s.active);
  const status = useArenaRunStore((s) => s.status);
  const mode = useArenaRunStore((s) => s.mode);
  const round = useArenaRunStore((s) => s.round);
  const kills = useArenaRunStore((s) => s.kills);
  const coinsAtStart = useArenaRunStore((s) => s.coinsAtStart);
  const coins = useWalletStore((s) => s.coins);
  const best = useRunRecordStore((s) => s.bestByMode[mode] ?? 0);
  if (!active || (status !== 'gameover' && status !== 'won')) return null;

  const won = status === 'won';
  const reviveCost = getRunConfig().reviveCost;
  const earned = Math.max(0, coins - coinsAtStart);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className={`${panel} w-[22rem] p-5 text-center text-slate-100`}>
        <div className={`text-xs font-black uppercase tracking-widest ${won ? 'text-emerald-300' : 'text-rose-300'}`}>
          {won ? '🏆 Run Complete' : '💀 Run Over'}
        </div>
        <div className="mt-2 text-sm text-slate-300">
          {mode === 'endless' ? 'Endless' : 'Roguelite'} · reached <b className="text-amber-300">round {round}</b>
        </div>
        <div className="mt-1 text-xs text-slate-400">{kills} enemies defeated · 💰 {earned} coins earned</div>
        <div className="mt-1 text-[11px] text-slate-500">Best {mode === 'endless' ? 'Endless' : 'Roguelite'}: round {best}</div>

        <div className="mt-4 flex flex-col gap-2">
          {!won && (
            <Btn tone="primary" disabled={coins < reviveCost} onClick={() => buyRevive()}>
              ♻ Revive — 💰 {reviveCost}
            </Btn>
          )}
          <Btn tone="ghost" onClick={() => endRun()}>{won ? 'Return to base' : 'End run'}</Btn>
        </div>
      </div>
    </div>
  );
};
