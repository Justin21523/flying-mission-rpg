import { useState } from 'react';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';

// Always-visible God Mode panel (not gated behind the dev console). God mode is ON by default in this
// testing build; this is the panel to adjust it. Two independent flavours:
//  • Combat god — player invincible + ∞ energy + no skill cooldown (frictionless skill testing).
//  • Zone god — auto-completes zone segments. Toggle this OFF to actually FIGHT the encounters.
const Row = ({ on, onToggle, label, hint }: { on: boolean; onToggle: (v: boolean) => void; label: string; hint?: string }) => (
  <label className="flex items-center gap-1.5 text-[11px] text-slate-200">
    <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} className="accent-fuchsia-500" />
    <span>{label}</span>
    {hint && <span className="text-[9px] text-slate-500">{hint}</span>}
  </label>
);

export const GodModePanel = () => {
  const [open, setOpen] = useState(true);
  const godMode = useCombatStore((s) => s.godMode);
  const ignoreEnergyCost = useCombatStore((s) => s.ignoreEnergyCost);
  const ignoreCooldown = useCombatStore((s) => s.ignoreCooldown);
  const showHitVolumes = useCombatStore((s) => s.showHitVolumes);
  const zoneGod = useAdvancedMissionZoneStore((s) => s.debug.godMode);
  const setDebug = useAdvancedMissionZoneStore((s) => s.setDebug);

  return (
    <div className="pointer-events-auto fixed left-4 top-4 z-40 w-52 rounded-xl border border-fuchsia-500/40 bg-slate-900/85 p-2 text-slate-100 shadow-lg backdrop-blur">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left text-[11px] font-semibold uppercase tracking-wide text-fuchsia-300">
        <span>{open ? '▾' : '▸'}</span> 🛡 God Mode {godMode && <span className="ml-auto rounded bg-fuchsia-600/40 px-1 text-[9px]">ON</span>}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          <Row on={godMode} onToggle={(v) => useCombatStore.getState().setGodMode(v)} label="Combat god (invincible)" />
          <Row on={ignoreEnergyCost} onToggle={(v) => useCombatStore.getState().setDebugFlag('ignoreEnergyCost', v)} label="∞ Energy" />
          <Row on={ignoreCooldown} onToggle={(v) => useCombatStore.getState().setDebugFlag('ignoreCooldown', v)} label="No cooldown" />
          <Row on={showHitVolumes} onToggle={(v) => useCombatStore.getState().setDebugFlag('showHitVolumes', v)} label="Show hit volumes" />
          <div className="my-1 border-t border-slate-700/60" />
          <Row on={zoneGod} onToggle={(v) => setDebug({ godMode: v })} label="Zone god" hint="(off = fight!)" />
        </div>
      )}
    </div>
  );
};
