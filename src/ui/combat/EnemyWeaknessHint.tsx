import { liveTargets } from '../../stores/game/combatTargetStore';
import { StatusEffectBadge } from './StatusEffectBadge';

export const EnemyWeaknessHint = () => {
  const target = liveTargets.find((item) => !item.defeatedAt && (item.weakpointExposed || item.scanned || item.statusEffects?.length));
  if (!target) return null;
  const title = target.isBossWeakpoint ? 'Boss Weakpoint Exposed' : target.scanned || target.weakpointExposed ? 'Weakpoint Exposed' : 'Status Window';
  const hint = target.isBossWeakpoint ? 'Use precision or shield-break attacks before it closes.' : target.weakpointExposed ? 'Precision and weakpoint attacks hit harder now.' : 'Status effects are active on this target.';
  return (
    <div className="rounded-lg border border-sky-400/35 bg-sky-950/60 px-3 py-2 text-xs text-sky-100">
      <div className="font-bold">{title}</div>
      <div className="mt-0.5 max-w-44 text-[10px] text-sky-100/75">{hint}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {target.scanned && <StatusEffectBadge type="scanned" />}
        {target.weakpointExposed && <StatusEffectBadge type="weakpoint-exposed" />}
        {target.statusEffects?.slice(0, 3).map((effect) => <StatusEffectBadge key={`${effect.type}-${effect.startedAtMs}`} type={effect.type} />)}
      </div>
    </div>
  );
};
