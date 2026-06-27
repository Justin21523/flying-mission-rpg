import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';

export const GuidedHintToast = () => {
  const enabled = useDemoModeStore((state) => state.enabled && state.enableGuidedHints && state.landingDismissed);
  const status = useStageProgressionStore((state) => state.status);
  if (!enabled) return null;
  const text = status === 'briefing' ? 'Review threats and recommended team, then select your crew.' : status === 'playing' ? 'Follow the objective panel. Use support calls when pressure rises.' : status === 'stage-clear' ? 'Claim rewards to unlock the next stage.' : 'Use Start Demo or Stage Select to begin.';
  return (
    <div className="pointer-events-none fixed left-1/2 top-14 z-[56] -translate-x-1/2 rounded-lg border border-amber-400/40 bg-amber-950/35 px-3 py-2 text-xs text-amber-100 backdrop-blur">
      {text}
    </div>
  );
};
