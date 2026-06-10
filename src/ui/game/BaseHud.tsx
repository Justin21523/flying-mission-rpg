import { useBaseRuntimeStore } from '../../stores/game/baseRuntimeStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { playUiSound } from '../../game/audio/uiSound';

// Play-mode HUD for the base phases (3D hangar). Drive prompt + alignment hint (HANGAR), lift countdown +
// skip (PLATFORM_ALIGNMENT), launch-prep notice (LAUNCH_PREPARATION). Reads the shared base runtime store.
export const BaseHud = () => {
  const phase = useGameStore((s) => s.phase);
  const requestTransition = useGameStore((s) => s.requestTransition);
  const inRange = useBaseRuntimeStore((s) => s.inRange);
  const aligned = useBaseRuntimeStore((s) => s.aligned);
  const liftPhase = useBaseRuntimeStore((s) => s.liftPhase);
  const countdown = useBaseRuntimeStore((s) => s.countdown);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2">
      {phase === 'HANGAR' && (
        <div className="rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-200 backdrop-blur">
          {aligned
            ? 'Aligned — locking on… (press E)'
            : inRange
              ? 'Line up on the lift platform'
              : 'Drive to the lift platform — WASD / arrow keys'}
        </div>
      )}

      {phase === 'PLATFORM_ALIGNMENT' && liftPhase === 'descending' && (
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <div className="rounded-full bg-slate-950/85 px-5 py-2 text-base font-bold text-amber-200 backdrop-blur">
            Launch sequence — {countdown}s
          </div>
          <button
            onClick={() => {
              playUiSound('confirm');
              requestTransition('LAUNCH_PREPARATION');
            }}
            className="rounded-lg border border-slate-600/60 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Skip ⏭
          </button>
        </div>
      )}

      {phase === 'LAUNCH_PREPARATION' && (
        <div className="rounded-full bg-emerald-900/70 px-5 py-2 text-sm font-bold text-emerald-100 backdrop-blur">
          Launch preparation complete — flight arrives in Batch 4
        </div>
      )}
    </div>
  );
};
