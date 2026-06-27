import { useCombatStore } from '../../stores/game/useCombatStore';
import { feedbackTierPriority } from '../../game/combat/CombatFeedbackClassifier';
import { DamageNumberPolished } from './DamageNumberPolished';
import { HitConfirmEffect } from './HitConfirmEffect';
import { EnemyWeaknessHint } from './EnemyWeaknessHint';
import { ShieldBreakToast } from './ShieldBreakToast';
import { ComboSuccessToast } from './ComboSuccessToast';

export const CombatFeedbackLayer = () => {
  const results = useCombatStore((state) => state.lastDamageResults);
  const events = useCombatStore((state) => state.lastFeedbackEvents);
  const latest = results[0];
  const topEvent = [...events].sort((a, b) => feedbackTierPriority(b.tier) - feedbackTierPriority(a.tier))[0];
  if (!results.length && !events.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[45]">
      <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <HitConfirmEffect result={latest} event={topEvent} />
        <ShieldBreakToast result={latest} event={topEvent} />
        <ComboSuccessToast result={latest} event={topEvent} />
      </div>
      <div className="absolute right-5 top-32 flex w-44 flex-col items-end gap-1">
        {results.slice(0, 5).map((result, index) => <DamageNumberPolished key={`${result.targetId}-${index}-${result.finalAmount}`} result={result} index={index} />)}
      </div>
      <div className="absolute left-5 top-40">
        <EnemyWeaknessHint />
      </div>
    </div>
  );
};
