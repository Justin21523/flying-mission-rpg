import { useBossStore } from '../../stores/game/useBossStore';
import { getBoss } from '../../stores/game/useBossEditorStore';

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

// Batch E — boss entrance title card. Shows for def.intro.durationSeconds after the fight starts (timestamp in
// runtime.timers.introUntil; re-renders each frame via the store version bump, then fades out).
export const BossIntroOverlay = () => {
  useBossStore((s) => s.version);
  const runtime = useBossStore((s) => s.runtime);
  if (!runtime || runtime.status === 'inactive' || runtime.status === 'defeated') return null;
  const introUntil = runtime.timers?.introUntil ?? 0;
  if (introUntil <= 0 || nowS() >= introUntil) return null;
  const boss = getBoss(runtime.bossDefinitionId);
  const intro = boss?.intro;
  if (!intro) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="animate-[fadeIn_0.4s_ease-out] text-center">
        <div className="text-xs font-bold uppercase tracking-[0.4em] text-rose-400">⚠ Boss Incoming</div>
        <div className="mt-2 text-5xl font-black tracking-wide text-white drop-shadow-[0_2px_12px_rgba(244,63,94,0.6)]">{intro.title}</div>
        {intro.subtitle && <div className="mt-2 text-lg font-semibold text-rose-200">{intro.subtitle}</div>}
        <div className="mx-auto mt-4 h-0.5 w-48 animate-pulse bg-rose-500/70" />
      </div>
    </div>
  );
};
