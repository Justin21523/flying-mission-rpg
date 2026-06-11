import type { ReactNode } from 'react';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { forceSupportArrival, requestSupport, cancelSupport } from '../../game/support/SupportDispatchDirector';
import { beginFullControlDispatch } from '../../game/support/FullControlDispatchService';
import { switchControlToCharacter } from '../../game/characters/control/ControlOwnershipService';
import { getSupportProfiles } from '../../stores/game/editorSupportStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';

export const SupportDebugPanel = () => {
  const dispatches = useSupportRuntimeStore((s) => s.dispatches);
  const presences = useSupportRuntimeStore((s) => s.presences);
  const ownership = useSupportRuntimeStore((s) => s.ownership);
  const fullControl = useSupportRuntimeStore((s) => s.fullControl);
  const setPaused = useSupportRuntimeStore((s) => s.setPaused);
  const paused = useSupportRuntimeStore((s) => s.paused);
  const reset = useSupportRuntimeStore((s) => s.reset);
  const profiles = getSupportProfiles();
  return (
    <div className="pointer-events-auto fixed bottom-2 left-80 z-[90] w-80 rounded-lg border border-violet-800/60 bg-slate-950/85 p-3 text-[11px] text-slate-200 shadow-xl backdrop-blur">
      <div className="mb-1 font-bold text-violet-300">Support / Team (dev)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <Row label="Controlled" value={ownership.controlledCharacterId ?? '-'} />
        <Row label="Input" value={ownership.inputOwnerId ?? '-'} />
        <Row label="Camera" value={ownership.cameraOwnerId ?? '-'} />
        <Row label="Full control" value={fullControl?.dispatchCharacterId ?? '-'} />
        <Row label="Returning" value={fullControl?.returning ? 'yes' : 'no'} />
        <Row label="Active" value={`${presences.filter((p) => p.tier === 'active').length}`} />
        <Row label="Standby" value={`${presences.filter((p) => p.tier === 'standby').length}`} />
        <Row label="Remote" value={`${presences.filter((p) => p.tier === 'remote').length}`} />
      </div>
      <div className="mt-1 max-h-20 overflow-y-auto rounded bg-slate-900/60 p-1 text-[10px]">
        {dispatches.map((d) => <div key={d.characterId}>{d.characterId}: {d.status} · {Math.ceil(d.etaSeconds)}s</div>)}
        {presences.map((p) => <div key={p.characterId}>{p.characterId}: {p.tier} · {p.aiState}</div>)}
        {dispatches.length === 0 && presences.length === 0 && <div className="text-slate-500">No support runtime.</div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Btn onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</Btn>
        <Btn onClick={reset}>Reset support</Btn>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {profiles.map((p) => (
          <Btn key={p.id} onClick={() => requestSupport(p.characterId, 'quick-simulated')}>Request {getEditorCharacter(p.characterId)?.name ?? p.characterId}</Btn>
        ))}
        {profiles.map((p) => (
          <Btn key={`full_${p.id}`} onClick={() => beginFullControlDispatch(p.characterId)}>Full {getEditorCharacter(p.characterId)?.name ?? p.characterId}</Btn>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {[...dispatches.map((d) => d.characterId), ...presences.map((p) => p.characterId)].map((id) => (
          <Btn key={id} onClick={() => forceSupportArrival(id)}>Arrive {id}</Btn>
        ))}
        {presences.map((p) => <Btn key={`sw_${p.characterId}`} onClick={() => switchControlToCharacter(p.characterId)}>Switch {p.characterId}</Btn>)}
        {dispatches.map((d) => <Btn key={`cx_${d.characterId}`} onClick={() => cancelSupport(d.characterId, 'Debug cancel')}>Cancel {d.characterId}</Btn>)}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between"><span className="text-slate-400">{label}</span><span className="tabular-nums truncate">{value}</span></div>
);

const Btn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">{children}</button>
);
