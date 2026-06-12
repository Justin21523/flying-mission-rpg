import { useGameStore } from '../../stores/game/useGameStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';

// On-screen "Call Support" button — opens/closes the SupportSelectionPanel (same toggle as the Tab key) so a
// partner can be called without knowing the shortcut. Visible during MISSION_GAMEPLAY / SUPPORT_SELECTION.
export const SupportCallButton = () => {
  const phase = useGameStore((s) => s.phase);
  const panelOpen = useSupportRuntimeStore((s) => s.panelOpen);
  const canOpen = phase === 'MISSION_GAMEPLAY' || phase === 'SUPPORT_SELECTION';
  if (!canOpen) return null;

  const toggle = (): void => {
    const next = !useSupportRuntimeStore.getState().panelOpen;
    useSupportRuntimeStore.getState().setPanelOpen(next);
    const cur = useGameStore.getState();
    if (next && cur.phase === 'MISSION_GAMEPLAY') cur.requestTransition('SUPPORT_SELECTION');
    if (!next && cur.phase === 'SUPPORT_SELECTION') cur.requestTransition('MISSION_GAMEPLAY');
  };

  return (
    <button
      onClick={toggle}
      title="Call a support partner (Tab)"
      className={`pointer-events-auto fixed bottom-4 right-4 z-[60] rounded-full border px-4 py-2 text-sm font-bold shadow-lg backdrop-blur transition ${
        panelOpen
          ? 'border-sky-300 bg-sky-600 text-white hover:bg-sky-500'
          : 'border-sky-600/60 bg-slate-900/85 text-sky-100 hover:bg-slate-800'
      }`}
    >
      🤝 {panelOpen ? 'Close Support' : 'Call Support'}
    </button>
  );
};
