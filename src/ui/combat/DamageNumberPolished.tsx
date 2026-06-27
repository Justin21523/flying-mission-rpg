import type { DamageResult } from '../../types/game/combat';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const DamageNumberPolished = ({ result, index }: { result: DamageResult; index: number }) => {
  const mode = useSettingsStore((state) => state.damageNumbers);
  if (mode === 'off') return null;
  if (mode === 'minimal' && index > 2) return null;
  const strong = result.wasCrit || result.wasWeaknessHit || result.shieldDamage > 0;
  return (
    <div className={`rounded border px-2 py-1 text-xs shadow-lg ${strong ? 'border-amber-300/50 bg-amber-950/70 text-amber-100' : 'border-slate-600 bg-slate-950/70 text-slate-200'}`}>
      <span className="font-black">{Math.round(result.finalAmount)}</span>
      {result.wasWeaknessHit && <span className="ml-1 text-sky-200">weak</span>}
      {result.wasCrit && <span className="ml-1 text-amber-200">crit</span>}
    </div>
  );
};
