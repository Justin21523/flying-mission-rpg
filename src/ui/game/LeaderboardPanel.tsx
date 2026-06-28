import { useState } from 'react';
import { useCampaignScoreStore } from '../../stores/game/useCampaignScoreStore';
import { useRunRecordStore } from '../../stores/game/useRunRecordStore';
import { DIFFICULTIES, NG_PLUS } from '../../types/game/settings';
import { useCampaignCompletionStore } from '../../stores/game/useCampaignCompletionStore';

// Wave 5 — leaderboard: campaign run scores (by difficulty) + arena best rounds. Collapsible; shown in Mission
// Control. Reads the persisted score/run stores.
export const LeaderboardPanel = () => {
  const [open, setOpen] = useState(false);
  const runs = useCampaignScoreStore((s) => s.runs);
  const ngUnlocked = useCampaignCompletionStore((s) => s.finalBossDefeated);
  const endlessTop = useRunRecordStore((s) => s.topByMode['endless']) ?? [];
  const rogueTop = useRunRecordStore((s) => s.topByMode['roguelite']) ?? [];
  const difficulties = [...DIFFICULTIES, ...(ngUnlocked ? [NG_PLUS] : [])];

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-2 text-xs">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between font-black text-amber-200">
        <span>🏆 Leaderboards</span><span className="text-slate-500">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div>
            <div className="text-[11px] font-bold text-slate-300">Campaign scores</div>
            {runs.length === 0 ? (
              <div className="text-[11px] text-slate-500">Clear the campaign to set a score.</div>
            ) : (
              difficulties.map((d) => {
                const top = runs.filter((r) => r.difficulty === d).slice(0, 3);
                if (top.length === 0) return null;
                return (
                  <div key={d} className="mt-1">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">{d}</div>
                    {top.map((r, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-300">
                        <span>#{i + 1} · <b className="text-amber-300">{r.score}</b></span>
                        <span className="text-slate-500">{Math.round(r.elapsedSeconds)}s · {r.kills} kills</span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-slate-800 pt-1">
            <div className="text-[11px] font-bold text-slate-300">Arena best rounds</div>
            <div className="text-[11px] text-slate-300">🌀 Endless: {endlessTop.length ? endlessTop.map((r) => `r${r}`).join(' · ') : '—'}</div>
            <div className="text-[11px] text-slate-300">🎲 Roguelite: {rogueTop.length ? rogueTop.map((r) => `r${r}`).join(' · ') : '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
};
