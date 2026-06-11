import { useEditorCameraStore } from '../../../stores/game/editorCameraStore';
import { DEFAULT_PHASE_CAMERA, cameraConfigFromView } from '../../../types/game/cameraConfig';
import type { PhaseCameraConfig } from '../../../types/game/cameraConfig';
import { editCameraHandle } from '../../../game/camera/editCameraHandle';
import type { GamePhase } from '../../../types/game/state';
import { NumRow } from './CollectionEditor';
import { lbl } from '../editorShared';

// 🎥 Camera — author the third-person follow framing per phase (distance / angle / height / fov). Applied by
// FollowCamera in Play (drag still adjusts; never a locked camera). Flight + transformation cameras are
// authored in their own tabs (🛩 Flight worldCam*/flyAroundCam*, ✨ Transform camera shots).
const FOLLOW_PHASES: { id: GamePhase; label: string }[] = [
  { id: 'HANGAR', label: 'Hangar' },
  { id: 'PLATFORM_ALIGNMENT', label: 'Platform alignment' },
  { id: 'LAUNCH_PREPARATION', label: 'Launch prep' },
  { id: 'DESCENT', label: 'Descent' },
  { id: 'LANDING', label: 'Landing' },
  { id: 'NPC_GREETING', label: 'NPC greeting' },
  { id: 'MISSION_GAMEPLAY', label: 'Mission gameplay' },
  { id: 'MISSION_COMPLETE', label: 'Mission complete' },
];

const PhaseCameraRow = ({ phase, label }: { phase: GamePhase; label: string }) => {
  const cfg = useEditorCameraStore((s) => s.byPhase[phase]);
  const set = (c: PhaseCameraConfig) => useEditorCameraStore.getState().setPhase(phase, c);
  const clear = () => useEditorCameraStore.getState().clearPhase(phase);
  const c = cfg ?? DEFAULT_PHASE_CAMERA;
  const patch = (p: Partial<PhaseCameraConfig>) => set({ ...c, ...p });
  const capture = () => {
    const h = editCameraHandle;
    set(cameraConfigFromView({ x: h.camX, y: h.camY, z: h.camZ }, { x: h.targetX, y: h.targetY, z: h.targetZ }, c.fov));
  };
  return (
    <div className={`rounded border p-1.5 ${cfg ? 'border-sky-700/50 bg-sky-950/15' : 'border-slate-800 bg-slate-900/45'}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-200">{label} {cfg ? '' : <span className="text-[10px] text-slate-500">(default)</span>}</span>
        <div className="flex gap-1">
          <button onClick={capture} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[10px] text-emerald-100 hover:bg-emerald-700/50">📸 Capture view</button>
          {cfg && <button onClick={clear} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">↺ Reset</button>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <NumRow label="Distance" value={c.distance} step={0.5} min={0.5} onChange={(v) => patch({ distance: v })} />
        <NumRow label="Height" value={c.targetHeight} step={0.25} onChange={(v) => patch({ targetHeight: v })} />
        <NumRow label="FOV" value={c.fov} step={1} min={20} max={120} onChange={(v) => patch({ fov: v })} />
        <NumRow label="Yaw°" value={c.yawDeg} step={5} onChange={(v) => patch({ yawDeg: v })} />
        <NumRow label="Pitch° (0=top,90=level)" value={c.pitchDeg} step={2} min={2} max={178} onChange={(v) => patch({ pitchDeg: v })} />
      </div>
    </div>
  );
};

export const CameraEditorTab = () => (
  <div className="space-y-2 text-xs">
    <div className={lbl}>Phase follow-camera framing</div>
    <p className="text-[10px] text-slate-500">In Edit Mode, orbit/zoom to the view you want, then 📸 Capture view for a phase (or type values). ▶ Play from here (Game State) to test. Drag still adjusts in Play. Flight/transformation cameras live in 🛩 Flight / ✨ Transform.</p>
    {FOLLOW_PHASES.map((p) => <PhaseCameraRow key={p.id} phase={p.id} label={p.label} />)}
  </div>
);
