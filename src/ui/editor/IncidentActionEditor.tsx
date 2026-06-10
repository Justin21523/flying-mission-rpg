import type { IncidentAction, IncidentReaction } from '../../types/trafficIncident';
import { INCIDENT_REACTIONS } from '../../types/trafficIncident';
import { inp, lbl, usePathOptions, useAnimationOptions } from './editorShared';
import { IdSelect } from './idPickers';

// Phase F+ — editor for a single IncidentAction (one entry in a scenario's setup / timeline / cleanup). A kind
// <select> swaps to per-kind fields (mirrors ActionEditor / ConditionEditor).
type Kind = IncidentAction['type'];
const KIND_LABEL: Record<Kind, string> = {
  spawnVehicle: 'spawn vehicle', setVehicleState: 'set vehicle state', spawnObstacle: 'spawn obstacle',
  blockRoad: 'block road', npcReaction: 'npc reaction', notifyRescue: 'notify rescue',
  playAnimation: 'play animation', emitEvent: 'emit event', wait: 'wait',
};
const KINDS = Object.keys(KIND_LABEL) as Kind[];
const VEHICLE_STATES = ['normal', 'distracted', 'brakeFailure', 'breakdown', 'overheat', 'stopped'] as const;

function defaultFor(k: Kind): IncidentAction {
  switch (k) {
    case 'spawnVehicle': return { type: 'spawnVehicle' };
    case 'setVehicleState': return { type: 'setVehicleState', participant: 'v0', state: 'breakdown' };
    case 'spawnObstacle': return { type: 'spawnObstacle', obstacleId: 'crate' };
    case 'blockRoad': return { type: 'blockRoad', pathId: '', partial: true };
    case 'npcReaction': return { type: 'npcReaction', npcSelector: 'nearby', reaction: 'stopAndLook' };
    case 'notifyRescue': return { type: 'notifyRescue' };
    case 'playAnimation': return { type: 'playAnimation', participant: 'v0', animationId: '' };
    case 'emitEvent': return { type: 'emitEvent', event: '' };
    case 'wait': return { type: 'wait', seconds: 1 };
  }
}

export const IncidentActionEditor = ({ value, onChange, onRemove }: { value: IncidentAction; onChange: (v: IncidentAction) => void; onRemove: () => void }) => {
  const paths = usePathOptions();
  const anims = useAnimationOptions();
  const a = value;
  return (
    <div className="flex flex-wrap items-end gap-1.5 rounded border border-slate-700/50 bg-slate-900/50 p-1.5">
      <label className="flex flex-col gap-0.5">
        <span className={lbl}>action</span>
        <select value={a.type} onChange={(e) => onChange(defaultFor(e.target.value as Kind))} className={inp}>
          {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </label>

      {a.type === 'spawnVehicle' && (
        <input value={a.vehicleType ?? ''} onChange={(e) => onChange({ ...a, vehicleType: e.target.value || undefined })} placeholder="vehicle type" className={inp + ' flex-1'} />
      )}
      {a.type === 'setVehicleState' && (<>
        <input value={a.participant} onChange={(e) => onChange({ ...a, participant: e.target.value })} placeholder="v0" className={inp + ' w-16'} />
        <select value={a.state} onChange={(e) => onChange({ ...a, state: e.target.value as typeof a.state })} className={inp + ' flex-1'}>
          {VEHICLE_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </>)}
      {a.type === 'spawnObstacle' && (
        <input value={a.obstacleId} onChange={(e) => onChange({ ...a, obstacleId: e.target.value })} placeholder="obstacle id" className={inp + ' flex-1'} />
      )}
      {a.type === 'blockRoad' && (<>
        <div className="min-w-[7rem] flex-1"><IdSelect value={a.pathId || undefined} onChange={(v) => onChange({ ...a, pathId: v ?? '' })} options={paths} placeholder="(scene path)" /></div>
        <label className="flex items-center gap-1 text-[11px] text-slate-300"><input type="checkbox" checked={a.partial} onChange={(e) => onChange({ ...a, partial: e.target.checked })} className="accent-sky-500" /> partial</label>
      </>)}
      {a.type === 'npcReaction' && (<>
        <input value={a.npcSelector} onChange={(e) => onChange({ ...a, npcSelector: e.target.value })} placeholder="nearby" className={inp + ' w-20'} />
        <select value={a.reaction} onChange={(e) => onChange({ ...a, reaction: e.target.value as IncidentReaction })} className={inp + ' flex-1'}>
          {INCIDENT_REACTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </>)}
      {a.type === 'playAnimation' && (<>
        <input value={a.participant} onChange={(e) => onChange({ ...a, participant: e.target.value })} placeholder="v0" className={inp + ' w-16'} />
        <div className="min-w-[7rem] flex-1"><IdSelect value={a.animationId || undefined} onChange={(v) => onChange({ ...a, animationId: v ?? '' })} options={anims} placeholder="(animation)" /></div>
      </>)}
      {a.type === 'emitEvent' && (
        <input value={a.event} onChange={(e) => onChange({ ...a, event: e.target.value })} placeholder="event name" className={inp + ' flex-1'} />
      )}
      {a.type === 'wait' && (
        <label className="flex flex-col gap-0.5"><span className={lbl}>seconds</span><input type="number" step={0.5} value={a.seconds} onChange={(e) => onChange({ ...a, seconds: parseFloat(e.target.value) || 0 })} className={inp + ' w-20'} /></label>
      )}

      <button onClick={onRemove} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
    </div>
  );
};
