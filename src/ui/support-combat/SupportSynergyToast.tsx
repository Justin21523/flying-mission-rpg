import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { getSupportSynergies } from '../../stores/game/useSupportCombatEditorStore';
import { useNowMs } from '../../game/combat/useNowMs';

// Transient "✦ Synergy!" toast (Batch E) — shows the last fired partner-synergy placeholder for ~1.6s.
export const SupportSynergyToast = () => {
  const now = useNowMs(150);
  const last = useSupportCombatStore((s) => s.synergyState.lastTriggeredSynergyId);
  const at = useSupportCombatStore((s) => s.synergyState.lastTriggeredAtMs);
  if (!last || at == null || now - at > 1600) return null;
  const synergy = getSupportSynergies().find((x) => x.id === last);
  return (
    <div className="pointer-events-none fixed bottom-40 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-fuchsia-400/40 bg-slate-900/85 px-3 py-1 text-sm font-bold text-fuchsia-200 shadow-lg backdrop-blur">
      ✦ Synergy! {synergy?.name ?? last}
    </div>
  );
};
