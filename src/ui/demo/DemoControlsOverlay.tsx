import { useDemoModeStore } from '../../stores/useDemoModeStore';

export const DemoControlsOverlay = () => {
  const show = useDemoModeStore((state) => state.enabled && state.showControlsOverlay && state.landingDismissed);
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[58] rounded-lg border border-slate-700 bg-slate-950/75 p-2 text-[11px] text-slate-300 backdrop-blur">
      <b className="text-sky-200">Controls</b> · WASD move · Shift sprint · Q skill · Ctrl pages · F interact · Esc menu · F1 Edit Mode
    </div>
  );
};
