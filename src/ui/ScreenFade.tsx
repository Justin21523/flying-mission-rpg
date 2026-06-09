import { useTransitionStore } from '../stores/transitionStore';

// POLI — full-screen black fade overlay driven by transitionStore (area-edge transitions). Non-interactive;
// CSS opacity transition gives the quick fade in/out.
export const ScreenFade = () => {
  const covering = useTransitionStore((s) => s.covering);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] bg-black transition-opacity duration-200"
      style={{ opacity: covering ? 1 : 0 }}
    />
  );
};
