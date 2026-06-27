import { useCodexStore } from '../../stores/game/useCodexStore';
import { useCodexChallengeStore } from '../../stores/game/useCodexChallengeStore';
import { useEditorEnemyStore } from '../../stores/game/editorCombatStore';
import { useBossDefinitionStore } from '../../stores/game/useBossEditorStore';
import { currentMetric } from '../../game/progression/CodexChallengeResolver';

// Wave 4 — codex panel: discovered enemies / defeated bosses + challenge achievement progress. Shown in
// Character Selection beside the loadout panels.
export const CodexPanel = () => {
  const seenEnemies = useCodexStore((s) => s.seenEnemyIds.length);
  const defeatedBosses = useCodexStore((s) => s.defeatedBossIds.length);
  const challengeDone = useCodexStore((s) => s.challengeDone);
  const totalEnemies = useEditorEnemyStore((s) => s.items.filter((e) => !e.isBoss).length);
  const totalBosses = useBossDefinitionStore((s) => s.items.length);
  const challenges = useCodexChallengeStore((s) => s.items).filter((c) => c.enabled !== false);

  return (
    <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/50 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-100">📖 Codex</span>
        <span className="text-[11px] text-slate-300">
          Enemies <b className="text-sky-300">{seenEnemies}/{totalEnemies}</b> · Bosses <b className="text-rose-300">{defeatedBosses}/{totalBosses}</b>
        </span>
      </div>
      <div className="mt-1 space-y-1">
        {challenges.map((c) => {
          const cur = Math.min(currentMetric(c.metric), c.target);
          const done = !!challengeDone[c.id] || cur >= c.target;
          const pct = Math.round((cur / Math.max(1, c.target)) * 100);
          return (
            <div key={c.id} className="rounded border border-slate-800 px-1.5 py-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-200">{c.editorMeta?.icon ?? '🏅'} {c.name}</span>
                <span className={done ? 'font-bold text-emerald-300' : 'text-slate-400'}>{done ? '✓ Done' : `${cur}/${c.target}`}</span>
              </div>
              <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-slate-800">
                <div className={`h-full ${done ? 'bg-emerald-400' : 'bg-sky-500'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
