import { useState } from 'react';
import { useSupportCombatStore, type SupportCombatDebugFlags } from '../../stores/game/useSupportCombatStore';
import { useSupportCombatEditorStore } from '../../stores/game/useSupportCombatEditorStore';
import { liveTargets } from '../../stores/game/combatTargetStore';
import { getAvailableSupportAbilities, castSupportAbility, initializeForZone } from '../../game/support-combat/SupportCombatDirector';
import * as ThreatController from '../../game/support-combat/SupportThreatController';
import { tryTriggerSynergy } from '../../game/support-combat/SupportSynergyController';
import { robotHandle } from '../../game/destination/robotHandle';
import { MVP_SUPPORT_CHARACTER_IDS } from '../../data/support-combat/supportCombatAbilities';
import { supportName } from '../support-combat/supportNames';
import { useNowMs } from '../../game/combat/useNowMs';

// Support-combat debug tools (Batch E) — force availability, ignore cd/cost, refill energy, cast each
// support ability, spawn a decoy, scan/repair/break a target, trigger a synergy, export a snapshot.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';

const Toggle = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button onClick={onClick} className={`${btn} ${on ? 'bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}>{on ? '☑' : '☐'} {label}</button>
);

export const SupportCombatDebugPanel = () => {
  useNowMs(250);
  const debug = useSupportCombatStore((s) => s.debug);
  useSupportCombatStore((s) => s.version);
  useSupportCombatEditorStore((s) => s.items);
  const [char, setChar] = useState<string>(MVP_SUPPORT_CHARACTER_IDS[0]);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const set = (flag: keyof SupportCombatDebugFlags) => useSupportCombatStore.getState().setDebugFlag(flag, !debug[flag]);

  const refill = () => { initializeForZone(); for (const cid of MVP_SUPPORT_CHARACTER_IDS) useSupportCombatStore.getState().setSupportEnergy(cid, 100); };
  const firstEnemy = () => liveTargets.find((t) => t.isEnemy && !t.defeatedAt);
  const firstObstacle = () => liveTargets.find((t) => t.isObstacle && !t.defeatedAt);
  const views = getAvailableSupportAbilities(char);

  return (
    <div className="pointer-events-auto fixed right-4 top-[27rem] z-40 w-72 rounded-xl border border-sky-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">🤝 Support Combat Debug</div>

      <div className="mt-2 flex flex-wrap gap-1">
        <Toggle on={debug.forceAllSupportAvailable} onClick={() => set('forceAllSupportAvailable')} label="Force avail" />
        <Toggle on={debug.ignoreSupportCooldown} onClick={() => set('ignoreSupportCooldown')} label="No CD" />
        <Toggle on={debug.ignoreSupportCost} onClick={() => set('ignoreSupportCost')} label="No cost" />
        <Toggle on={debug.showSupportTargeting} onClick={() => set('showSupportTargeting')} label="Show range" />
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Support hero</div>
      <div className="flex flex-wrap gap-1">
        {MVP_SUPPORT_CHARACTER_IDS.map((cid) => <button key={cid} onClick={() => setChar(cid)} className={`${btn} ${cid === char ? 'bg-sky-700' : 'bg-slate-700 hover:bg-slate-600'}`}>{supportName(cid)}</button>)}
      </div>

      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cast ability</div>
      <div className="flex flex-wrap gap-1">
        {views.map((v) => <button key={v.ability.id} onClick={() => castSupportAbility(v.ability.id, { manualTargetId: firstEnemy()?.id ?? firstObstacle()?.id })} className={`${btn} bg-sky-800 hover:bg-sky-700`}>{v.ability.supportType.replace('-support', '')}</button>)}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={refill} className={`${btn} bg-emerald-700 hover:bg-emerald-600`}>Refill energy</button>
        <button onClick={() => { const e = firstEnemy(); if (e) ThreatController.applyTaunt([e.id], { x: robotHandle.pos.x + 4, z: robotHandle.pos.z }, 5, 60, 'characters/Carey drone 3d model'); }} className={`${btn} bg-violet-800 hover:bg-violet-700`}>Spawn decoy</button>
        <button onClick={() => { const e = firstEnemy(); if (e) { e.scanned = true; e.weakpointExposed = true; useSupportCombatStore.getState().bump(); } }} className={`${btn} bg-blue-800 hover:bg-blue-700`}>Scan enemy</button>
        <button onClick={() => tryTriggerSynergy({ nowMs: performance.now(), scannedEnemy: true, lastSupportAbilityId: 'support_scan_chase', primaryRecentSkillTags: ['speed', 'rescue'] })} className={`${btn} bg-fuchsia-800 hover:bg-fuchsia-700`}>Trigger synergy</button>
      </div>

      <button onClick={() => setSnapshot(JSON.stringify({ char, debug, runtime: useSupportCombatStore.getState().runtimeBySupportCharacterId[char], decoys: ThreatController.activeDecoys() }, null, 2))} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export snapshot</button>
      {snapshot && <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snapshot}</pre>}
    </div>
  );
};
