import { useEffect } from 'react';
import { useSystemMenuStore } from '../../stores/systemMenuStore';

// Top-right gear that opens the in-game system menu; Esc toggles it. Hidden while the menu is open (the menu
// has its own Resume button). Mounted only in aero play mode.
export const SystemMenuButton = () => {
  const open = useSystemMenuStore((s) => s.open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code !== 'Escape' || e.repeat) return;
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      useSystemMenuStore.getState().toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (open) return null;
  return (
    <button
      onClick={() => useSystemMenuStore.getState().openMenu()}
      title="Menu (Esc)"
      className="pointer-events-auto fixed right-3 top-3 z-[70] rounded-full border border-slate-600/60 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 shadow-lg backdrop-blur hover:bg-slate-800"
    >
      ☰
    </button>
  );
};
