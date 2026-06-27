import { useStageBalanceProfileStore } from '../../../stores/useStageContentEditorStore';
import { getStageDefinition } from '../../../stores/useStageEditorStore';
import { analyzeStageBalance } from '../../../game/balancing/StageBalanceAnalyzer';

export const StageBalanceEditorTab = () => {
  const profiles = useStageBalanceProfileStore((state) => state.items);
  return (
    <div className="space-y-2 text-xs text-slate-300">
      <h2 className="text-sm font-bold text-sky-200">Stage Balance Audit</h2>
      {profiles.map((profile) => {
        const stage = getStageDefinition(profile.stageId);
        const findings = stage ? analyzeStageBalance(stage) : [];
        return (
          <div key={profile.id} className="rounded border border-slate-700 bg-slate-950/50 p-3">
            <div className="font-bold text-slate-100">{profile.stageId} · Difficulty {profile.difficultyRating}</div>
            <div className="text-slate-400">Enemy budget: active {profile.enemyBudget.maxActiveEnemies}, total {profile.enemyBudget.maxTotalEnemies}, elite {profile.enemyBudget.maxEliteEnemies}</div>
            <div className="mt-2 space-y-1">
              {findings.length === 0 ? <div className="text-emerald-300">No balance warnings.</div> : findings.map((finding, index) => <div key={index} className={finding.severity === 'fatal' ? 'text-red-300' : 'text-amber-300'}>{finding.severity}: {finding.message}</div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
