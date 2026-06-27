import type { DamageResult } from '../../types/game/combat';
import type { CombatFeedbackEvent } from '../../game/combat/CombatFeedbackClassifier';

export const HitConfirmEffect = ({ result, event }: { result?: DamageResult; event?: CombatFeedbackEvent }) => {
  if (!result && !event) return null;
  const label = event?.label ?? (result?.targetDefeated ? 'Target Down' : result?.wasWeaknessHit ? 'Weakpoint Hit' : result && result.shieldDamage > 0 ? 'Shield Hit' : 'Hit');
  const strong = event?.tier === 'strong' || event?.tier === 'cinematic';
  return (
    <div className={`rounded-full border px-3 py-1 text-xs font-black shadow-xl ${strong ? 'border-amber-300/60 bg-amber-950/80 text-amber-50' : 'border-white/20 bg-slate-950/70 text-white'}`}>
      {label}
      {event?.detail && <span className="ml-2 font-semibold text-white/70">{event.detail}</span>}
    </div>
  );
};
