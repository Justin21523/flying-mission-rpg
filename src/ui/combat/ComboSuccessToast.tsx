import type { DamageResult } from '../../types/game/combat';
import type { CombatFeedbackEvent } from '../../game/combat/CombatFeedbackClassifier';

export const ComboSuccessToast = ({ result, event }: { result?: DamageResult; event?: CombatFeedbackEvent }) => {
  if (event?.kind === 'scan-exposed' || event?.kind === 'boss-weakpoint-exposed') return <div className="rounded bg-sky-500/20 px-3 py-1 text-xs font-black text-sky-100">{event.label}</div>;
  if (!result || (!result.wasCrit && !result.wasWeaknessHit)) return null;
  return <div className="rounded bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-100">{result.wasCrit ? 'Critical combo' : 'Counterplay success'}</div>;
};
