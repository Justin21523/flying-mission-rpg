import { useMemo } from 'react';
import { useArenaRunStore } from '../../stores/game/useArenaRunStore';
import { useWalletStore } from '../../stores/walletStore';
import { getRunBuffDef } from '../../stores/game/useRunBuffDefStore';
import { getRoomConfig } from '../../stores/game/useRoomConfigStore';
import { roomShopOffers, roomShopBuy, roomGamble, roomRest, roomElite, completeRoom } from '../../game/arena-run/RunDirector';
import { panel } from './screenChrome';

// Wave 3 — roguelite interstitial rooms between rounds (shop / gamble / rest / elite). 'boon' is handled by the
// existing RunBuffChoiceOverlay (status 'choosing'); this overlay handles status 'room'. Effects route through
// the RunDirector helpers (wallet / run-buffs / combat store); Continue starts the next round.
const ROOM_META: Record<string, { icon: string; title: string }> = {
  shop: { icon: '🛒', title: 'Supply Shop' },
  gamble: { icon: '🎲', title: 'Risk Vault' },
  rest: { icon: '🛏', title: 'Repair Bay' },
  elite: { icon: '☠', title: 'Elite Challenge' },
};

export const RoomInteractionOverlay = () => {
  const active = useArenaRunStore((s) => s.active);
  const status = useArenaRunStore((s) => s.status);
  const roomId = useArenaRunStore((s) => s.pendingRoomId);
  const round = useArenaRunStore((s) => s.round);
  const result = useArenaRunStore((s) => s.roomResult);
  const coins = useWalletStore((s) => s.coins);
  const cfg = getRoomConfig();
  // Shop offers are sampled once per room visit.
  const offers = useMemo(() => (roomId === 'shop' ? roomShopOffers() : []), [roomId, round]);

  if (!active || status !== 'room' || !roomId) return null;
  const meta = ROOM_META[roomId] ?? { icon: '🚪', title: 'Room' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className={`${panel} w-[40rem] max-w-[92vw] p-5`}>
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-widest text-sky-300">{meta.icon} {meta.title} · Round {round}</div>
          <div className="text-[11px] text-amber-300">🪙 {coins}</div>
        </div>

        <div className="mt-4 space-y-2">
          {roomId === 'shop' && offers.map((id) => {
            const def = getRunBuffDef(id);
            if (!def) return null;
            return (
              <button key={id} onClick={() => roomShopBuy(id)} disabled={coins < cfg.shopCost}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-left transition enabled:hover:border-emerald-400 disabled:opacity-50">
                <span className="text-2xl">{def.editorMeta?.icon ?? '⭐'}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black text-slate-100">{def.name}</span><span className="block text-[11px] text-slate-400">{def.description}</span></span>
                <span className="text-[11px] font-bold text-amber-300">🪙 {cfg.shopCost}</span>
              </button>
            );
          })}
          {roomId === 'gamble' && (
            <button onClick={() => roomGamble()} disabled={coins < cfg.gambleStake}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-center text-sm font-black text-slate-100 transition enabled:hover:border-amber-400 disabled:opacity-50">
              Stake 🪙 {cfg.gambleStake} — {Math.round(cfg.gambleWinChance * 100)}% to win 🪙 {Math.round(cfg.gambleStake * cfg.gambleWinMultiplier)}
            </button>
          )}
          {roomId === 'rest' && (
            <button onClick={() => roomRest()}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-center text-sm font-black text-emerald-200 transition hover:border-emerald-400">
              Restore {Math.round(cfg.restHealFraction * 100)}% HP / Shield / Energy
            </button>
          )}
          {roomId === 'elite' && (
            <button onClick={() => roomElite()}
              className="w-full rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-center text-sm font-black text-rose-200 transition hover:border-rose-400">
              Accept an elite wave for 🪙 {cfg.eliteRewardCoins}
            </button>
          )}
        </div>

        {result && <div className="mt-3 text-center text-[12px] text-emerald-300">{result}</div>}
        <button onClick={() => completeRoom()} className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-800 py-2 text-xs font-black uppercase tracking-widest text-slate-200 hover:bg-slate-700">
          Continue →
        </button>
      </div>
    </div>
  );
};
