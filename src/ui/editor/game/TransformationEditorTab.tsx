import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { useTransformationPreviewStore } from '../../../stores/game/transformationPreviewStore';
import { validateTimeline } from '../../../game/transformation/transformationValidation';
import {
  FORM_STRATEGIES, TRANSFORMATION_STAGE_TYPES, TRANSFORMATION_PART_KEYS, MODEL_SLOTS, EASINGS,
  CAMERA_SHOT_TYPES, EFFECT_TYPES, TRANSFORMATION_MODES,
} from '../../../types/game/transformation';
import type {
  TransformationDefinition, TransformationStage, TransformationCameraShot, TransformationEffectTrack,
} from '../../../types/game/transformation';
import { Field, inp, lbl, Check } from '../editorShared';
import { ModelPicker } from '../ModelPicker';
import { TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';

const num = (v: string) => parseFloat(v) || 0;
const opts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));

const makeNew = (): TransformationDefinition => ({
  id: `xf_${nanoid(6)}`,
  name: 'New Transformation',
  formStrategy: 'modular-parts-procedural',
  modeAvailability: { full: true, interactive: true, quick: true },
  totalDurationSec: 4,
  quickDurationSec: 1.6,
  backdropColor: '#101820',
  particleColor: '#38bdf8',
  parts: [{ key: 'wing_left', geometry: 'wing', basePosition: [-1.2, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 }],
  stages: [
    { id: `s_${nanoid(4)}`, type: 'part-transform', startTime: 0.5, duration: 0.5, enabled: true, params: { partKey: 'wing_left', toRotation: [0, 0, 70] } },
    { id: `s_${nanoid(4)}`, type: 'model-visibility', startTime: 2.7, duration: 0.1, enabled: true, essential: true, params: { modelSlot: 'robot', visible: true } },
    { id: `s_${nanoid(4)}`, type: 'finish-pose', startTime: 3, duration: 0.5, enabled: true, essential: true, params: {} },
    { id: `s_${nanoid(4)}`, type: 'exit-stage', startTime: 3.8, duration: 0.2, enabled: true, essential: true, params: { targetPhase: 'DESCENT' } },
  ],
  cameraShots: [{ id: `c_${nanoid(4)}`, type: 'orbit', startTime: 0, duration: 2, distance: 7, height: 2, angle: 0, fov: 55 }],
  effectTracks: [{ id: `e_${nanoid(4)}`, type: 'white-flash', startTime: 2.6, duration: 0.4 }],
  audioCues: [],
  interactionShowcase: { enabled: true, rotateSpeedDeg: 90, poses: ['Hero', 'Wave', 'Dance'] },
  controllerSwitchConfig: { planeControllerDisableTime: 0, robotControllerEnableTime: 2.7 },
  physicsSwitchConfig: { planeColliderDisableTime: 2.6, robotColliderEnableTime: 2.7 },
  momentumTransferConfig: { preserveHorizontalVelocity: true, horizontalVelocityMultiplier: 0.4, initialDescentVelocity: 10, clampMaxDescentSpeed: 30, faceCameraOnExit: true },
});

const Vec3 = ({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) => (
  <Field label={label}>
    <div className="flex gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={0.1} value={value[a]} onChange={(e) => { const n = [...value] as [number, number, number]; n[a] = num(e.target.value); onChange(n); }} className={inp + ' w-0 flex-1 text-center'} />
      ))}
    </div>
  </Field>
);

// ── stage params (type-aware) ──
const StageParams = ({ s, patch }: { s: TransformationStage; patch: (p: Partial<TransformationStage['params']>) => void }) => {
  const p = s.params;
  switch (s.type) {
    case 'part-transform':
      return (
        <>
          <SelectRow label="Part" value={p.partKey ?? ''} options={[{ value: '', label: '(none)' }, ...opts(TRANSFORMATION_PART_KEYS)]} onChange={(v) => patch({ partKey: (v || undefined) as typeof p.partKey })} />
          <Vec3 label="To position" value={p.toPosition ?? [0, 0, 0]} onChange={(v) => patch({ toPosition: v })} />
          <Vec3 label="To rotation°" value={p.toRotation ?? [0, 0, 0]} onChange={(v) => patch({ toRotation: v })} />
          <NumRow label="To scale" value={p.toScale ?? 1} step={0.1} onChange={(v) => patch({ toScale: v })} />
        </>
      );
    case 'model-visibility':
    case 'model-swap':
      return (
        <>
          <SelectRow label="Model slot" value={p.modelSlot ?? 'robot'} options={opts(MODEL_SLOTS)} onChange={(v) => patch({ modelSlot: v as typeof p.modelSlot })} />
          {s.type === 'model-swap' && (
            <Field label="Arbitrary model (overrides slot — chain any number of swaps)">
              <ModelPicker value={p.modelRef} onChange={(v) => patch({ modelRef: v })} noneLabel="(use slot)" />
            </Field>
          )}
          <Check label="Visible" checked={p.visible ?? true} onChange={(v) => patch({ visible: v })} />
        </>
      );
    case 'animation-clip':
      return (
        <>
          <TextRow label="Clip name" value={p.clipName ?? ''} onChange={(v) => patch({ clipName: v })} />
          <NumRow label="Clip speed" value={p.clipSpeed ?? 1} step={0.1} onChange={(v) => patch({ clipSpeed: v })} />
          <Check label="Hold final frame" checked={p.holdFinal ?? false} onChange={(v) => patch({ holdFinal: v })} />
        </>
      );
    case 'backdrop-shift':
      return <NumRow label="Backdrop intensity" value={p.backdropIntensity ?? 1} step={0.1} onChange={(v) => patch({ backdropIntensity: v })} />;
    case 'effect-burst':
    case 'energy-ring':
    case 'speed-line-burst':
      return (
        <>
          <ColorRow label="Colour" value={p.color ?? '#ffffff'} onChange={(v) => patch({ color: v })} />
          <NumRow label="Intensity" value={p.intensity ?? 1} step={0.1} onChange={(v) => patch({ intensity: v })} />
        </>
      );
    case 'voice-cue':
      return <TextRow label="Text" value={p.text ?? ''} onChange={(v) => patch({ text: v })} />;
    case 'exit-stage':
      return (
        <>
          <TextRow label="Target phase" value={p.targetPhase ?? 'DESCENT'} onChange={(v) => patch({ targetPhase: v })} />
          <NumRow label="Descent distance (slow sink)" value={p.intensity ?? 6} step={1} min={0} onChange={(v) => patch({ intensity: v })} />
        </>
      );
    default:
      return null;
  }
};

const StagesEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => update({ stages: [...def.stages, { id: `s_${nanoid(4)}`, type: 'part-transform', startTime: 0, duration: 0.5, enabled: true, params: {} }] });
  const patch = (id: string, p: Partial<TransformationStage>) => update({ stages: def.stages.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const patchParams = (id: string, pp: Partial<TransformationStage['params']>) => update({ stages: def.stages.map((s) => (s.id === id ? { ...s, params: { ...s.params, ...pp } } : s)) });
  const remove = (id: string) => update({ stages: def.stages.filter((s) => s.id !== id) });
  return (
    <div>
      <div className="flex items-center justify-between"><div className={lbl}>Stages · {def.stages.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Stage</button></div>
      <div className="mt-1 space-y-1.5">
        {def.stages.map((s) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label="Type" value={s.type} options={opts(TRANSFORMATION_STAGE_TYPES)} onChange={(v) => patch(s.id, { type: v as TransformationStage['type'] })} />
              <TextRow label="Label" value={s.label ?? ''} onChange={(v) => patch(s.id, { label: v })} />
              <NumRow label="Start" value={s.startTime} step={0.1} min={0} onChange={(v) => patch(s.id, { startTime: v })} />
              <NumRow label="Duration" value={s.duration} step={0.1} min={0} onChange={(v) => patch(s.id, { duration: v })} />
              <SelectRow label="Easing" value={s.easing ?? 'linear'} options={opts(EASINGS)} onChange={(v) => patch(s.id, { easing: v as TransformationStage['easing'] })} />
            </div>
            <div className="mt-1 flex gap-3">
              <Check label="Enabled" checked={s.enabled} onChange={(v) => patch(s.id, { enabled: v })} />
              <Check label="Essential (quick)" checked={s.essential ?? false} onChange={(v) => patch(s.id, { essential: v })} />
            </div>
            <div className="mt-1"><StageParams s={s} patch={(pp) => patchParams(s.id, pp)} /></div>
            <button onClick={() => remove(s.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CameraEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => update({ cameraShots: [...def.cameraShots, { id: `c_${nanoid(4)}`, type: 'orbit', startTime: 0, duration: 1, distance: 6, height: 2, angle: 0, fov: 50 }] });
  const patch = (id: string, p: Partial<TransformationCameraShot>) => update({ cameraShots: def.cameraShots.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const remove = (id: string) => update({ cameraShots: def.cameraShots.filter((s) => s.id !== id) });
  return (
    <div>
      <div className="flex items-center justify-between"><div className={lbl}>Camera shots · {def.cameraShots.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Shot</button></div>
      <div className="mt-1 space-y-1.5">
        {def.cameraShots.map((s) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label="Type" value={s.type} options={opts(CAMERA_SHOT_TYPES)} onChange={(v) => patch(s.id, { type: v as TransformationCameraShot['type'] })} />
              <SelectRow label="Target part" value={s.targetPart ?? ''} options={[{ value: '', label: '(centre)' }, ...opts(TRANSFORMATION_PART_KEYS)]} onChange={(v) => patch(s.id, { targetPart: (v || undefined) as TransformationCameraShot['targetPart'] })} />
              <NumRow label="Start" value={s.startTime} step={0.1} min={0} onChange={(v) => patch(s.id, { startTime: v })} />
              <NumRow label="Duration" value={s.duration} step={0.1} min={0} onChange={(v) => patch(s.id, { duration: v })} />
              <NumRow label="Distance" value={s.distance} step={0.5} onChange={(v) => patch(s.id, { distance: v })} />
              <NumRow label="Height" value={s.height} step={0.5} onChange={(v) => patch(s.id, { height: v })} />
              <NumRow label="Angle°" value={s.angle} step={10} onChange={(v) => patch(s.id, { angle: v })} />
              <NumRow label="FOV" value={s.fov} step={1} onChange={(v) => patch(s.id, { fov: v })} />
              <NumRow label="Shake" value={s.shakeIntensity ?? 0} step={0.05} min={0} onChange={(v) => patch(s.id, { shakeIntensity: v })} />
            </div>
            <button onClick={() => remove(s.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const EffectsEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => update({ effectTracks: [...def.effectTracks, { id: `e_${nanoid(4)}`, type: 'glow-pulse', startTime: 0, duration: 1 }] });
  const patch = (id: string, p: Partial<TransformationEffectTrack>) => update({ effectTracks: def.effectTracks.map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const remove = (id: string) => update({ effectTracks: def.effectTracks.filter((s) => s.id !== id) });
  return (
    <div>
      <div className="flex items-center justify-between"><div className={lbl}>Effect tracks · {def.effectTracks.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Effect</button></div>
      <div className="mt-1 space-y-1.5">
        {def.effectTracks.map((s) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label="Type" value={s.type} options={opts(EFFECT_TYPES)} onChange={(v) => patch(s.id, { type: v as TransformationEffectTrack['type'] })} />
              <SelectRow label="Follow part" value={s.followTargetPart ?? ''} options={[{ value: '', label: '(centre)' }, ...opts(TRANSFORMATION_PART_KEYS)]} onChange={(v) => patch(s.id, { followTargetPart: (v || undefined) as TransformationEffectTrack['followTargetPart'] })} />
              <NumRow label="Start" value={s.startTime} step={0.1} min={0} onChange={(v) => patch(s.id, { startTime: v })} />
              <NumRow label="Duration" value={s.duration} step={0.1} min={0} onChange={(v) => patch(s.id, { duration: v })} />
              <NumRow label="Intensity" value={s.intensity ?? 1} step={0.1} onChange={(v) => patch(s.id, { intensity: v })} />
              <NumRow label="Scale" value={s.scale ?? 1} step={0.1} onChange={(v) => patch(s.id, { scale: v })} />
            </div>
            <ColorRow label="Colour" value={s.color ?? '#ffffff'} onChange={(v) => patch(s.id, { color: v })} />
            <button onClick={() => remove(s.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PreviewControls = ({ def }: { def: TransformationDefinition }) => {
  const ps = useTransformationPreviewStore();
  return (
    <div className="space-y-2">
      <SelectRow label="Mode" value={ps.mode} options={opts(TRANSFORMATION_MODES)} onChange={(v) => ps.setMode(v as typeof ps.mode)} />
      <input type="range" min={0} max={def.totalDurationSec} step={0.02} value={ps.time} onChange={(e) => ps.scrub(num(e.target.value))} className="w-full" />
      <div className="flex flex-wrap gap-1">
        <button onClick={() => ps.play()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">▶ Play</button>
        <button onClick={() => ps.pause()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏸ Pause</button>
        <button onClick={() => ps.stop()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏹ Stop</button>
        <button onClick={() => ps.scrub(def.totalDurationSec)} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏭ Finish</button>
      </div>
      <p className="text-[10px] text-slate-500">Preview drives the TransformationStage in Edit Mode. Jump to TRANSFORMATION (Game State panel) to see it.</p>
    </div>
  );
};

type Sub = 'timeline' | 'camera' | 'effects' | 'preview';

// ✨ Transform — sub-tabbed timeline editor (Timeline · Camera · Effects · Preview). Reuses the
// editorTransformationStore collection; selecting a timeline wires it to the Edit-Mode preview.
export const TransformationEditorTab = () => {
  const items = useEditorTransformationStore((s) => s.items);
  const upsert = useEditorTransformationStore((s) => s.upsert);
  const update = useEditorTransformationStore((s) => s.update);
  const duplicate = useEditorTransformationStore((s) => s.duplicate);
  const remove = useEditorTransformationStore((s) => s.remove);
  const setPreview = useTransformationPreviewStore((s) => s.setTimeline);
  const [selId, setSelId] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub>('timeline');
  const def = items.find((t) => t.id === selId) ?? items[0] ?? null;

  const select = (id: string) => { setSelId(id); setPreview(id); };
  const upd = (p: Partial<TransformationDefinition>) => def && update(def.id, p);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Transformations · {items.length}</div>
        <button onClick={() => { const it = makeNew(); upsert(it); select(it.id); }} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Add</button>
      </div>
      <div className="flex gap-3">
        <div className="max-h-[60vh] w-36 shrink-0 space-y-1 overflow-y-auto pr-1">
          {items.map((t) => (
            <button key={t.id} onClick={() => select(t.id)} className={`block w-full truncate rounded px-2 py-1 text-left ${t.id === def?.id ? 'bg-violet-600/30 text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>{t.name}</button>
          ))}
          {items.length === 0 && <div className="text-slate-500">None yet.</div>}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {def ? (
            <>
              <div className="flex gap-1">
                {(['timeline', 'camera', 'effects', 'preview'] as Sub[]).map((s) => (
                  <button key={s} onClick={() => setSub(s)} className={`rounded px-2 py-0.5 text-[11px] font-semibold ${sub === s ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}>{s}</button>
                ))}
              </div>

              {(() => { const errs = validateTimeline(def); return errs.length > 0 ? (
                <div className="rounded bg-rose-900/40 p-1.5 text-[11px] text-rose-200">{errs.map((er, i) => <div key={i}>⚠ {er}</div>)}</div>
              ) : null; })()}

              {sub === 'timeline' && (
                <>
                  <TextRow label="Name" value={def.name} onChange={(v) => upd({ name: v })} />
                  <SelectRow label="Strategy" value={def.formStrategy} options={opts(FORM_STRATEGIES)} onChange={(v) => upd({ formStrategy: v as TransformationDefinition['formStrategy'] })} />
                  <div className="grid grid-cols-2 gap-2">
                    <NumRow label="Total (sec)" value={def.totalDurationSec} step={0.5} min={0.1} onChange={(v) => upd({ totalDurationSec: v })} />
                    <NumRow label="Quick (sec)" value={def.quickDurationSec} step={0.1} min={0.1} onChange={(v) => upd({ quickDurationSec: v })} />
                  </div>
                  <ColorRow label="Backdrop colour" value={def.backdropColor} onChange={(v) => upd({ backdropColor: v })} />
                  <ColorRow label="Particle colour" value={def.particleColor} onChange={(v) => upd({ particleColor: v })} />
                  <StagesEditor def={def} update={upd} />
                </>
              )}
              {sub === 'camera' && <CameraEditor def={def} update={upd} />}
              {sub === 'effects' && <EffectsEditor def={def} update={upd} />}
              {sub === 'preview' && <PreviewControls def={def} />}

              <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
                <button onClick={() => { const id = duplicate(def.id); if (id) select(id); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
                <button onClick={() => { remove(def.id); setSelId(null); }} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
                <span className="ml-auto self-center text-[10px] text-slate-500">id: {def.id}</span>
              </div>
            </>
          ) : (
            <div className="text-slate-500">Select or add a transformation.</div>
          )}
        </div>
      </div>
    </div>
  );
};
