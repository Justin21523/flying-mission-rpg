import { useState } from 'react';
import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { useSupportCombatEditorStore } from '../../stores/game/useSupportCombatEditorStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { getAvailableSupportAbilities, castSupportAbility } from '../../game/support-combat/SupportCombatDirector';
import { getSupportPresence } from '../../game/support-combat/SupportPresenceAdapter';
import { MVP_SUPPORT_CHARACTER_IDS } from '../../data/support-combat/supportCombatAbilities';
import { useNowMs } from '../../game/combat/useNowMs';
import { SupportAbilityCard } from './SupportAbilityCard';
import { supportName } from './supportNames';

// Support Combat panel (Batch E) — pick a support hero, see their presence/ETA, and cast cooldown/cost-gated
// support abilities (Strike / Shield / Repair / Scan / Taunt / Break). Reuses the existing dispatch presence;
// it does NOT add a second open mechanism (mounted alongside the partner panel during combat/zone phases).
export const SupportCombatPanel = () => {
  // re-render hooks: cooldown clock + store changes.
  useNowMs(200);
  useSupportCombatStore((s) => s.version);
  useSupportCombatStore((s) => s.runtimeBySupportCharacterId);
  useSupportCombatEditorStore((s) => s.items);
  useSupportRuntimeStore((s) => s.presences);
  const selectedAbility = useSupportCombatStore((s) => s.selectedSupportAbilityId);

  const [char, setChar] = useState<string>(MVP_SUPPORT_CHARACTER_IDS[0]);
  const presence = getSupportPresence(char);
  const views = getAvailableSupportAbilities(char);

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-30 w-64 rounded-xl border border-sky-500/30 bg-slate-900/85 p-2 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-sky-300">🤝 Support Combat</div>

      <div className="mt-1 flex flex-wrap gap-1">
        {MVP_SUPPORT_CHARACTER_IDS.map((cid) => (
          <button key={cid} onClick={() => setChar(cid)} className={`rounded px-1.5 py-0.5 text-[10px] ${cid === char ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {supportName(cid)}
          </button>
        ))}
      </div>

      <div className="mt-1 text-[9px] text-slate-400">
        status: <span className="text-slate-200">{presence.status}</span>{presence.etaSeconds != null && presence.etaSeconds > 0 ? ` · ETA ${Math.ceil(presence.etaSeconds)}s` : ''}{presence.isActivePlayer ? ' · (you → remote)' : ''}
      </div>

      <div className="mt-1 space-y-1">
        {views.length === 0 && <div className="text-[10px] text-slate-500">No support abilities.</div>}
        {views.map((v) => (
          <SupportAbilityCard
            key={v.ability.id}
            view={v}
            selected={selectedAbility === v.ability.id}
            onSelect={() => useSupportCombatStore.getState().selectSupportAbility(v.ability.id)}
            onCast={() => { useSupportCombatStore.getState().selectSupportAbility(v.ability.id); castSupportAbility(v.ability.id, { manualTargetId: useSupportCombatStore.getState().selectedSupportTargetId }); }}
          />
        ))}
      </div>
      <div className="mt-1 text-[8px] text-slate-500">Right-click / hover an ability to preview its range. Click to cast.</div>
    </div>
  );
};
