import { useEditorFlightCueStore } from '../../../stores/game/editorFlightCueStore';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';
import { useWorldSelectStore } from '../../../stores/worldSelectStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useWorldFlightEditorStore } from '../../../stores/game/worldFlightEditorStore';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { FLIGHT_CUE_TYPES } from '../../../types/game/flightCue';
import type { FlightCue, FlightCueType } from '../../../types/game/flightCue';
import { EASINGS } from '../../../types/game/transformation';
import type { Easing } from '../../../types/game/transformation';
import { FLIGHT_PATH_ID } from '../../../data/game/flightPath';
import { getActiveRoute } from '../../../game/flight/world/worldRoute';
import { Field, lbl } from '../editorShared';
import { NumRow, TextRow, ColorRow, SelectRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { resolveFlightLeg } from '../../../game/flight/flightLeg';
import { characterModelForForm } from '../../../game/destination/characterModel';
import { AnimationTrackSelect } from '../AnimationTrackSelect';

// 🛩 Flight → cue timeline editor. Authors camera / animation / event / environment cues along the active
// flight path's progress u (the same axis the Flight Preview scrubs). Editing a cue seeks the preview to its u
// so the change is seen at that point. Event cues drop a draggable marker in 3D (amber). Edit/preview-only.
const TYPE_LABEL: Record<FlightCueType, string> = { camera: '🎥 Camera', animation: '🤸 Action', event: '✨ Event', environment: '🌤 Environment' };

const CueFields = ({ pathId, c, modelAssetId }: { pathId: string; c: FlightCue; modelAssetId?: string }) => {
  const patch = (p: Partial<FlightCue>) => { useEditorFlightCueStore.getState().update(pathId, c.id, p); useFlightPreviewStore.getState().scrub(p.atU ?? c.atU); };
  switch (c.type) {
    case 'camera':
      return (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <NumRow label="Distance" value={c.camDistance ?? 12} step={0.5} min={0.5} onChange={(v) => patch({ camDistance: v })} />
            <NumRow label="Height" value={c.camHeight ?? 4} step={0.5} onChange={(v) => patch({ camHeight: v })} />
            <NumRow label="Orbit angle°" value={c.camAngleDeg ?? 0} step={5} onChange={(v) => patch({ camAngleDeg: v })} />
            <NumRow label="FOV" value={c.camFov ?? 55} step={1} min={20} max={120} onChange={(v) => patch({ camFov: v })} />
          </div>
          <SelectRow label="Ease in (from previous cue)" value={c.easing ?? 'easeInOut'} options={EASINGS.map((e) => ({ value: e, label: e }))} onChange={(v) => patch({ easing: v as Easing })} />
          <p className="text-[10px] text-slate-500">Drag the purple camera anchor in 3D to set distance/height/angle.</p>
        </>
      );
    case 'animation':
      return (
        <>
          <AnimationTrackSelect label="Track (plays from here)" modelAssetId={modelAssetId} value={c.clipName} onChange={(v) => patch({ clipName: v ?? '' })} />
          <div className="grid grid-cols-2 gap-1.5">
            <NumRow label="Clip speed" value={c.clipSpeed ?? 1} step={0.1} onChange={(v) => patch({ clipSpeed: v })} />
            <NumRow label="Bank°" value={c.bankDeg ?? 0} step={5} onChange={(v) => patch({ bankDeg: v })} />
          </div>
        </>
      );
    case 'event':
      return (
        <>
          <Field label="Model (empty = marker)"><ModelPicker value={c.eventAssetId} onChange={(v) => patch({ eventAssetId: v })} noneLabel="(marker)" /></Field>
          <NumRow label="Scale" value={c.eventScale ?? 1} step={0.1} min={0.05} onChange={(v) => patch({ eventScale: v })} />
          <p className="text-[10px] text-slate-500">Drag the amber marker in 3D to offset it from the route.</p>
        </>
      );
    case 'environment':
      return (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <ColorRow label="Sky / background" value={c.skyTop ?? '#4a90d9'} onChange={(v) => patch({ skyTop: v })} />
            <NumRow label="Haze (preview)" value={c.fogDensity ?? 0} step={0.05} min={0} max={1} onChange={(v) => patch({ fogDensity: v })} />
          </div>
          <NumRow label="Cloud intent (0..1)" value={c.cloudHint ?? 0} step={0.05} min={0} max={1} onChange={(v) => patch({ cloudHint: v })} />
        </>
      );
    default:
      return null;
  }
};

export const FlightCuesEditor = () => {
  const phase = useGameStore((s) => s.phase);
  const routes = useEditorRouteStore((s) => s.items);
  const selectedRouteId = useWorldFlightEditorStore((s) => s.selectedRouteId);
  const selectedLeg = useWorldFlightEditorStore((s) => s.selectedLeg);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const worldPhase = phase === 'WORLD_FLIGHT' || phase === 'RETURN_FLIGHT';
  const route = routes.find((r) => r.id === selectedRouteId) ?? getActiveRoute();
  const leg = resolveFlightLeg(route, selectedLeg);
  const pathId = worldPhase ? leg.pathId : FLIGHT_PATH_ID;
  const cueKey = worldPhase ? leg.cueKey : FLIGHT_PATH_ID;
  const cues = useEditorFlightCueStore((s) => s.byPath[cueKey]) ?? [];
  const u = useFlightPreviewStore((s) => s.u);
  const selectedKey = useWorldSelectStore((s) => s.selectedKey);
  const selectedCharacter = selectedCharacterId ? getEditorCharacter(selectedCharacterId) : undefined;
  const cueModelAssetId = characterModelForForm(selectedCharacter, 'plane') ?? characterModelForForm(selectedCharacter, 'robot');
  const add = (type: FlightCueType) => { const id = useEditorFlightCueStore.getState().add(cueKey, type, u); useFlightPreviewStore.getState().scrub(u); return id; };

  return (
    <div className="mt-2 rounded border border-sky-700/40 bg-sky-950/15 p-2">
      <div className="flex items-center justify-between gap-2">
        <div className={lbl}>Cue timeline · {cues.length}</div>
        <span className="font-mono text-[10px] text-slate-500">{worldPhase ? `${selectedLeg} · ${pathId}` : 'fly-around'}</span>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500">Add a cue at the current u (scrub above), then it plays back in the preview. Camera/Action/Environment apply from their u onward; Events appear as markers.</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {FLIGHT_CUE_TYPES.map((t) => (
          <button key={t} onClick={() => add(t)} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">➕ {TYPE_LABEL[t]}</button>
        ))}
      </div>
      <div className="mt-1.5 space-y-1.5">
        {cues.map((c) => {
          const eventSelected = selectedKey === `${cueKey}#cue#${c.id}` || selectedKey === `${cueKey}#camcue#${c.id}`;
          return (
            <div key={c.id} className={`rounded border p-1.5 ${eventSelected ? 'border-amber-500/70 bg-amber-950/20' : 'border-slate-800 bg-slate-900/55'}`}>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-sky-200">{TYPE_LABEL[c.type]}</span>
                <span className="font-mono text-[10px] text-slate-500">u {Math.round(c.atU * 100)}%</span>
                <button onClick={() => useFlightPreviewStore.getState().scrub(c.atU)} className="ml-auto rounded bg-slate-800 px-2 py-0.5 text-[10px] text-sky-200 hover:bg-slate-700">⏯ Seek</button>
                <button onClick={() => useEditorFlightCueStore.getState().remove(cueKey, c.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">🗑</button>
              </div>
              <TextRow label="Label" value={c.label ?? ''} onChange={(v) => useEditorFlightCueStore.getState().update(cueKey, c.id, { label: v })} />
              <Field label="At (u 0..1)">
                <input type="range" min={0} max={1} step={0.005} value={c.atU} onChange={(e) => { const atU = parseFloat(e.target.value); useEditorFlightCueStore.getState().update(cueKey, c.id, { atU }); useFlightPreviewStore.getState().scrub(atU); }} className="w-full" />
              </Field>
              <CueFields pathId={cueKey} c={c} modelAssetId={cueModelAssetId} />
            </div>
          );
        })}
        {cues.length === 0 && <div className="text-[11px] text-slate-500">No cues yet — add one above.</div>}
      </div>
    </div>
  );
};
