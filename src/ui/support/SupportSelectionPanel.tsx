import { useEffect } from 'react';
import { useGameStore } from '../../stores/game/useGameStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { getSupportProfiles } from '../../stores/game/editorSupportStore';
import { SupportCharacterCard } from './SupportCharacterCard';

export const SupportSelectionPanel = () => {
  const phase = useGameStore((s) => s.phase);
  const requestTransition = useGameStore((s) => s.requestTransition);
  const panelOpen = useSupportRuntimeStore((s) => s.panelOpen);
  const dispatches = useSupportRuntimeStore((s) => s.dispatches);
  const presences = useSupportRuntimeStore((s) => s.presences);
  const setPanelOpen = useSupportRuntimeStore((s) => s.setPanelOpen);
  const canOpen = phase === 'MISSION_GAMEPLAY' || phase === 'SUPPORT_SELECTION';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'Tab' && canOpen) {
        e.preventDefault();
        const next = !useSupportRuntimeStore.getState().panelOpen;
        setPanelOpen(next);
        if (next && useGameStore.getState().phase === 'MISSION_GAMEPLAY') requestTransition('SUPPORT_SELECTION');
        if (!next && useGameStore.getState().phase === 'SUPPORT_SELECTION') requestTransition('MISSION_GAMEPLAY');
      }
      if (e.code === 'Escape' && useSupportRuntimeStore.getState().panelOpen) {
        setPanelOpen(false);
        if (useGameStore.getState().phase === 'SUPPORT_SELECTION') requestTransition('MISSION_GAMEPLAY');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canOpen, requestTransition, setPanelOpen]);

  if (!canOpen || !panelOpen) return null;
  const profiles = getSupportProfiles();
  return (
    <div className="pointer-events-auto fixed inset-y-12 right-4 z-[70] w-96 overflow-y-auto rounded-xl border border-sky-700/60 bg-slate-950/90 p-3 text-xs text-slate-200 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-bold text-sky-200">Support Dispatch</div>
        <button onClick={() => { setPanelOpen(false); if (phase === 'SUPPORT_SELECTION') requestTransition('MISSION_GAMEPLAY'); }} className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white">Close</button>
      </div>
      <div className="mb-2 text-[10px] text-slate-500">Tab opens support dispatch · Esc closes · quick mode simulates launch, flight, transform, and arrival.</div>
      <div className="space-y-2">
        {profiles.map((profile) => (
          <SupportCharacterCard
            key={profile.id}
            characterId={profile.characterId}
            dispatch={dispatches.find((d) => d.characterId === profile.characterId)}
            presence={presences.find((p) => p.characterId === profile.characterId)}
          />
        ))}
      </div>
    </div>
  );
};
