import type { DamageResult } from '../../types/game/combat';
import type { CombatFeedbackEvent } from '../../game/combat/CombatFeedbackClassifier';

export const ShieldBreakToast = ({ result, event }: { result?: DamageResult; event?: CombatFeedbackEvent }) => {
  if (event?.kind === 'shield-break') return <div className="rounded bg-cyan-400/25 px-3 py-1 text-xs font-black text-cyan-50">Shield Broken · follow up now</div>;
  if (!result || result.shieldDamage <= 0 || result.shieldBroken) return null;
  return <div className="rounded bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-100">Shield pressure +{Math.round(result.shieldDamage)}</div>;
};
