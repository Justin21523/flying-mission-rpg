import { useEffect } from 'react';
import { usePoll } from './usePoll';
import { useOnboardingStore, type OnboardingStep } from '../stores/onboardingStore';
import { usePlayerStore } from '../stores/playerStore';
import { useUiStore } from '../stores/uiStore';
import { useRescueOperationStore } from '../stores/rescueOperationStore';
import { useT } from '../i18n/useT';

// POLI (K4d) — first-run tutorial card (bottom-left). Advances by watching the player's actions: move (WASD) →
// interact (E) → open the map → start a rescue. One-time (persisted); replayable from ⚙ Settings.
const STEP_KEY: Record<OnboardingStep, string> = {
  move: 'ob_move', interact: 'ob_interact', map: 'ob_map', rescue: 'ob_rescue', done: 'ob_done',
};

export const OnboardingHud = () => {
  const step = useOnboardingStore((s) => s.step);
  const t = useT();
  usePoll(300);

  // E key → completes the "interact" step (a press near anything counts as learning to interact).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && !e.repeat) useOnboardingStore.getState().advanceTo('interact');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Observe progress after each render/poll (never setState during render).
  useEffect(() => {
    const ob = useOnboardingStore.getState();
    if (ob.step === 'move' && (usePlayerStore.getState().distanceTraveled ?? 0) > 3) ob.advanceTo('interact');
    if (useUiStore.getState().activePanel === 'map') ob.advanceTo('map');
    if (useRescueOperationStore.getState().isActive) ob.advanceTo('rescue');
  });

  if (step === 'done') return null;

  return (
    <div className="pointer-events-auto absolute bottom-24 left-4 z-[72] w-64 rounded-lg border border-cyan-500/50 bg-slate-900/90 p-3 text-white shadow-2xl backdrop-blur-md">
      <div className="mb-1 flex items-center gap-2 border-b border-cyan-600/40 pb-1">
        <span className="flex-1 text-sm font-bold text-cyan-200">🎓 {t('ob_title')}</span>
        <button onClick={() => useOnboardingStore.getState().dismiss()} className="rounded px-1 text-[10px] text-slate-400 hover:bg-slate-800">{t('ob_skip')}</button>
      </div>
      <div className="text-xs text-slate-100">{t(STEP_KEY[step])}</div>
      <div className="mt-2 flex gap-1">
        {(['move', 'interact', 'map', 'rescue'] as OnboardingStep[]).map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i < (['move', 'interact', 'map', 'rescue'].indexOf(step)) ? 'bg-cyan-400' : i === ['move', 'interact', 'map', 'rescue'].indexOf(step) ? 'bg-cyan-300/60' : 'bg-slate-700'}`} />
        ))}
      </div>
    </div>
  );
};
