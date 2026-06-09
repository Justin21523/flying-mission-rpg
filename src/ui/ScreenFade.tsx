import { useTransitionStore } from '../stores/transitionStore';

// POLI — full-screen fade overlay driven by transitionStore (area-edge transitions). Non-interactive;
// shows the destination area name while covered so the gradual area change is clearly visible.
export const ScreenFade = () => {
  const covering = useTransitionStore((s) => s.covering);
  const label = useTransitionStore((s) => s.label);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-black transition-opacity duration-300 ease-in-out"
      style={{ opacity: covering ? 1 : 0 }}
    >
      {label && (
        <div className="flex flex-col items-center gap-2 text-cyan-100">
          <div className="text-2xl">🚗💨</div>
          <div className="text-lg font-bold tracking-wide">前往 {label}…</div>
        </div>
      )}
    </div>
  );
};
