import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { useTransformationPreviewStore } from '../../../stores/game/transformationPreviewStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { validateTimeline } from '../../../game/transformation/transformationValidation';
import { bakeOverrideToDef, liveOffset, scaleNumber, radiansToDegrees, resolveStageClipModelId } from '../../../game/transformation/transformationOverrides';
import { listTransformationEditTargets, resolveTransformationEditTarget } from '../../../game/transformation/transformationEditTargets';
import { modelSlotVisibilityDiagnostics, stageClipDiagnostic, stageScrubTimes, stageTargetDiagnostic } from '../../../game/transformation/transformationAuthoringDiagnostics';
import {
  findTimeTrack,
  keyframeTransformForTarget,
  removeTimeKeyframeAt,
  removeTimeTrack,
  targetFromTransformationKey,
  upsertTimeKeyframe,
} from '../../../game/transformation/transformationTimeTracks';
import { transformModelSlotKey, transformPartKey, transformRootKey, transformStageModelKey, transformStageMoveKey, transformStagePartMoveKey } from '../../../game/transformation/transformPartKey';
import { getModelAsset } from '../../../data/modelLibrary';
import { useGltfClipNames } from '../useGltfClipNames';
import {
  FORM_STRATEGIES, TRANSFORMATION_STAGE_TYPES, TRANSFORMATION_PART_KEYS, PART_GEOMETRY_KINDS, MODEL_SLOTS, EASINGS,
  CAMERA_SHOT_TYPES, EFFECT_TYPES, TRANSFORMATION_MODES, CAMERA_ROTATION_MODES,
} from '../../../types/game/transformation';
import type {
  ModelSlot, TransformationDefinition, TransformationStage, TransformationCameraShot,
  TransformationEffectTrack, TransformationPart, TransformationTransformOffset, TransformationVec3,
} from '../../../types/game/transformation';
import { Field, inp, lbl, Check, FocusButton, MoveButtons } from '../editorShared';
import { moveItem } from '../../../game/editor/arrayMove';
import { ModelPicker } from '../ModelPicker';
import { TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';
import { AnimationTrackSelect } from '../AnimationTrackSelect';

const num = (v: string) => parseFloat(v) || 0;
const opts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x }));
const round = (n: number) => Math.round(n * 100) / 100;

function clearOverrideField(key: string, field: 'position' | 'rotation' | 'scale'): void {
  useSceneEditStore.getState().setOverride(key, { [field]: undefined });
}

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

function defaultParamsForStageType(type: TransformationStage['type']): TransformationStage['params'] {
  switch (type) {
    case 'enter-stage': return { fromPosition: [0, 3, 0], fromScale: 0.7 };
    case 'camera-shot': return { cameraShotType: 'orbit', distance: 7, height: 2, angle: 0, fov: 55 };
    case 'part-transform': return { partKey: 'wing_left', toPosition: [0, 0, 0], toRotation: [0, 0, 0], toScale: 1 };
    case 'animation-clip': return { modelSlot: 'robot', clipSpeed: 1, loop: true };
    case 'model-visibility': return { modelSlot: 'robot', visible: true };
    case 'model-swap': return { modelSlot: 'robot', visible: true };
    case 'model-move': return { modelSlot: 'robot', toPosition: [0, 0, 0], toRotation: [0, 0, 0], toScale: 1 };
    case 'effect-burst': return { color: '#ffffff', intensity: 1, scale: 1.8, repeat: 12 };
    case 'energy-ring': return { color: '#7fd0ff', intensity: 1, scale: 2.4 };
    case 'clone-hero-burst': return { modelSlot: 'robot', color: '#7fd0ff', intensity: 1, scale: 14, repeat: 54, ghostSpread: 12, ghostPersist: true, clipSpeed: 1, loop: false, holdFinal: true };
    case 'cloud-ripple-burst': return { color: '#dbeafe', intensity: 1, scale: 7.5, ringCount: 5, particleCount: 170, spawnOffset: [0, -0.35, 0] };
    case 'speed-line-burst': return { intensity: 1.2, scale: 1 };
    case 'voice-cue': return { text: 'Transform!' };
    case 'finish-pose': return { color: '#ffffff', intensity: 1 };
    case 'interactive-showcase': return { color: '#fde047', intensity: 1 };
    case 'backdrop-shift': return { backdropIntensity: 1 };
    case 'exit-stage': return { targetPhase: 'DESCENT', intensity: 8, toScale: 1 };
    default: return {};
  }
}

const Vec3 = ({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) => (
  <Field label={label}>
    <div className="flex gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={0.1} value={value[a]} onChange={(e) => { const n = [...value] as [number, number, number]; n[a] = num(e.target.value); onChange(n); }} className={inp + ' w-0 flex-1 text-center'} />
      ))}
    </div>
  </Field>
);

const SelectedTargetDiagnostics = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const selectionLockKey = useSceneEditStore((s) => s.selectionLockKey);
  const overrides = useSceneEditStore((s) => s.overrides);
  const previewTime = useTransformationPreviewStore((s) => s.time);
  const targets = listTransformationEditTargets(def);
  const target = resolveTransformationEditTarget(def, selectedKey);
  const timeTarget = selectedKey ? targetFromTransformationKey(def, selectedKey) : null;
  const timeTrack = timeTarget ? findTimeTrack(def, timeTarget) : undefined;
  const keyframed = timeTarget ? keyframeTransformForTarget(def, timeTarget, previewTime) : undefined;
  const override = selectedKey ? overrides[selectedKey] : undefined;
  const hasOverride = !!override && (override.position !== undefined || override.rotation !== undefined || override.scale !== undefined);
  const selectTarget = (key: string) => useSceneEditStore.getState().requestSelect(key);
  const toggleLock = () => useSceneEditStore.getState().setSelectionLock(selectionLockKey ? null : selectedKey);
  const resetSelected = () => { if (selectedKey) useSceneEditStore.getState().resetKey(selectedKey); };
  const bakeSelected = () => {
    if (!selectedKey || !override) return;
    const patch = bakeOverrideToDef(def, selectedKey, override);
    if (!patch) return;
    update(patch);
    useSceneEditStore.getState().resetKey(selectedKey);
  };
  const bakeAll = () => {
    let next: TransformationDefinition = def;
    for (const item of targets) {
      const ov = useSceneEditStore.getState().overrides[item.key];
      if (!ov) continue;
      const patch = bakeOverrideToDef(next, item.key, ov);
      if (!patch) continue;
      next = { ...next, ...patch };
      useSceneEditStore.getState().resetKey(item.key);
    }
    update(next);
  };
  const writeKeyframe = (patch: { position?: TransformationVec3; rotation?: TransformationVec3; scale?: number }) => {
    if (!timeTarget) return;
    update({ timeTracks: upsertTimeKeyframe(def.timeTracks, timeTarget, previewTime, patch) });
  };
  const editVec = (field: 'position' | 'rotation', axis: 0 | 1 | 2, value: number) => {
    const source = keyframed ?? { position: [0, 0, 0] as TransformationVec3, rotation: [0, 0, 0] as TransformationVec3, scale: 1 };
    const next = [...source[field]] as TransformationVec3;
    next[axis] = value;
    if (field === 'position') writeKeyframe({ position: next });
    else writeKeyframe({ rotation: next });
  };
  const editScale = (value: number) => writeKeyframe({ scale: value });
  const deleteCurrentKey = () => { if (timeTarget) update({ timeTracks: removeTimeKeyframeAt(def.timeTracks, timeTarget, previewTime) }); };
  const deleteTrack = () => { if (timeTarget) update({ timeTracks: removeTimeTrack(def.timeTracks, timeTarget) }); };
  return (
    <div className="rounded border border-violet-800/50 bg-violet-950/10 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className={lbl}>Selected target</span>
        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-violet-100">{target.label}</span>
        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300">{target.kind}</span>
        {hasOverride && <span className="rounded bg-amber-900/40 px-2 py-0.5 text-[10px] text-amber-100">override pending</span>}
        {selectionLockKey && <span className="rounded bg-violet-900/40 px-2 py-0.5 text-[10px] text-violet-100">target locked</span>}
      </div>
      {selectedKey && <div className="mt-1 truncate font-mono text-[10px] text-slate-500">{selectedKey}</div>}
      <div className="mt-2 flex flex-wrap gap-1">
        <select value={selectedKey ?? ''} onChange={(e) => e.target.value && selectTarget(e.target.value)} className={inp + ' max-w-xs'}>
          <option value="">Select transform target</option>
          {targets.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <button onClick={bakeSelected} disabled={!hasOverride || !target.canBake} className="rounded bg-emerald-700/30 px-2 py-1 text-[10px] text-emerald-100 hover:bg-emerald-700/50 disabled:opacity-40">Bake Selected</button>
        <button onClick={resetSelected} disabled={!selectedKey || !hasOverride} className="rounded bg-amber-700/30 px-2 py-1 text-[10px] text-amber-100 hover:bg-amber-700/50 disabled:opacity-40">Reset Selected</button>
        <button onClick={bakeAll} disabled={!targets.some((item) => overrides[item.key])} className="rounded bg-sky-700/30 px-2 py-1 text-[10px] text-sky-100 hover:bg-sky-700/50 disabled:opacity-40">Bake All Pending</button>
        <button onClick={toggleLock} disabled={!selectedKey && !selectionLockKey} className="rounded bg-violet-700/30 px-2 py-1 text-[10px] text-violet-100 hover:bg-violet-700/50 disabled:opacity-40">{selectionLockKey ? 'Unlock Target' : 'Lock Target'}</button>
      </div>
      {timeTarget && (
        <div className="mt-2 rounded border border-slate-800 bg-slate-950/35 p-1.5">
          <div className="mb-1 flex flex-wrap items-center gap-1">
            <span className={lbl}>Current-time keyframe</span>
            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">{round(previewTime)}s</span>
            <span className={`rounded px-2 py-0.5 text-[10px] ${timeTrack ? 'bg-emerald-950/30 text-emerald-200' : 'bg-slate-900 text-slate-400'}`}>{timeTrack ? `${timeTrack.keyframes.length} keys` : 'no keys'}</span>
          </div>
          <Field label="Position (x / y / z)">
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((axis) => (
                <input key={axis} type="number" step={0.1} value={round((keyframed?.position ?? [0, 0, 0])[axis])} onChange={(e) => editVec('position', axis, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
              ))}
            </div>
          </Field>
          <Field label="Rotation° (x / y / z)">
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((axis) => (
                <input key={axis} type="number" step={1} value={round((keyframed?.rotation ?? [0, 0, 0])[axis])} onChange={(e) => editVec('rotation', axis, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap items-end gap-1.5">
            <div className="w-32"><NumRow label="Scale" value={round(keyframed?.scale ?? 1)} step={0.1} min={0.01} onChange={editScale} /></div>
            <button onClick={deleteCurrentKey} disabled={!timeTrack} className="rounded bg-amber-700/30 px-2 py-1 text-[10px] text-amber-100 hover:bg-amber-700/50 disabled:opacity-40">Delete Key</button>
            <button onClick={deleteTrack} disabled={!timeTrack} className="rounded bg-rose-700/25 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-700/40 disabled:opacity-40">Reset Track</button>
          </div>
        </div>
      )}
    </div>
  );
};

function modelIdForSlot(def: TransformationDefinition, slot: ModelSlot): string | undefined {
  if (slot === 'plane') return def.planeModelRef;
  if (slot === 'shared') return def.sharedModelRef;
  const ch = def.characterId ? useEditorCharacterStore.getState().items.find((c) => c.id === def.characterId) : undefined;
  return def.robotModelRef ?? ch?.modelAssetId;
}

const stageClipModelId = (def: TransformationDefinition, stage: TransformationStage): string | undefined =>
  resolveStageClipModelId(def, stage, (slot) => modelIdForSlot(def, slot));

const ClipSelect = ({ modelId, stage, value, onChange }: { modelId?: string; stage: TransformationStage; value?: string; onChange: (v?: string) => void }) => {
  const asset = modelId ? getModelAsset(modelId) : undefined;
  const clips = useGltfClipNames(asset?.path);
  const diagnostic = stageClipDiagnostic(stage, modelId, clips);
  return (
    <div className="space-y-1">
      <AnimationTrackSelect label="Clip" clips={clips} value={value} onChange={onChange} />
      <div className={`rounded px-2 py-1 text-[10px] ${diagnostic.ok ? 'bg-emerald-950/20 text-emerald-200' : 'bg-rose-950/30 text-rose-200'}`}>
        {diagnostic.message}
        {diagnostic.missing && (
          <span className="ml-2 inline-flex gap-1">
            <button onClick={() => onChange(undefined)} className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-100 hover:bg-slate-700">Clear clip</button>
            {diagnostic.firstValidClip && <button onClick={() => onChange(diagnostic.firstValidClip)} className="rounded bg-sky-800 px-1.5 py-0.5 text-sky-100 hover:bg-sky-700">Use first valid</button>}
          </span>
        )}
      </div>
    </div>
  );
};

const TransformOffsetFields = ({
  title,
  objKey,
  value,
  onChange,
}: {
  title: string;
  objKey: string;
  value?: TransformationTransformOffset;
  onChange: (v: TransformationTransformOffset) => void;
}) => {
  const override = useSceneEditStore((s) => s.overrides[objKey]);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const live = liveOffset(value, override);
  const select = () => useSceneEditStore.getState().requestSelect(objKey);
  const editVec = (field: 'position' | 'rotation', axis: number, v: number) => {
    const nextVec = [...live[field]] as TransformationVec3;
    nextVec[axis] = v;
    onChange({ ...live, [field]: nextVec });
    clearOverrideField(objKey, field);
  };
  const editScale = (v: number) => {
    onChange({ ...live, scale: v });
    clearOverrideField(objKey, 'scale');
  };
  return (
    <div className={`rounded border p-1.5 ${selectedKey === objKey ? 'border-violet-500/70 bg-violet-950/30' : 'border-slate-800 bg-slate-900/45'}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold text-slate-200">{title}</span>
        <div className="flex gap-1">
          <FocusButton position={live.position} objKey={objKey} />
          <button onClick={select} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Select</button>
        </div>
      </div>
      <Field label="Position (x / y / z) — live with the gizmo">
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((a) => (
            <input key={a} type="number" step={0.1} value={round(live.position[a])} onChange={(e) => editVec('position', a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
          ))}
        </div>
      </Field>
      <Field label="Rotation° (x / y / z)">
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((a) => (
            <input key={a} type="number" step={1} value={round(live.rotation[a])} onChange={(e) => editVec('rotation', a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
          ))}
        </div>
      </Field>
      <NumRow label="Scale" value={round(live.scale)} step={0.1} min={0.05} onChange={editScale} />
    </div>
  );
};

// ── parts (the unfold anchors) — numeric form synced with the draggable 3D gizmo anchors ──
const PartsEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const overrides = useSceneEditStore((s) => s.overrides);
  const selectedKey = useSceneEditStore((s) => s.selectedKey);
  const parts = def.parts ?? [];
  const patch = (key: string, p: Partial<TransformationPart>) => update({ parts: parts.map((x) => (x.key === key ? { ...x, ...p } : x)) });
  const remove = (key: string) => update({ parts: parts.filter((x) => x.key !== key) });
  const unused = TRANSFORMATION_PART_KEYS.filter((k) => !parts.some((p) => p.key === k));
  const add = () => {
    const key = unused[0];
    if (key) update({ parts: [...parts, { key, geometry: 'limb', basePosition: [0, 0, 0], baseRotation: [0, 0, 0], baseScale: 1 }] });
  };
  const livePos = (p: TransformationPart): [number, number, number] =>
    (overrides[transformPartKey(def.id, p.key)]?.position as [number, number, number]) ?? p.basePosition;
  const liveRot = (p: TransformationPart): [number, number, number] => {
    const ov = overrides[transformPartKey(def.id, p.key)]?.rotation;
    return ov ? radiansToDegrees(ov) : p.baseRotation;
  };
  const liveScale = (p: TransformationPart): number => scaleNumber(overrides[transformPartKey(def.id, p.key)]?.scale) ?? p.baseScale;
  const editPos = (p: TransformationPart, axis: number, v: number) => {
    const next = [...livePos(p)] as [number, number, number];
    next[axis] = v;
    patch(p.key, { basePosition: next });
    clearOverrideField(transformPartKey(def.id, p.key), 'position');
  };
  const editRot = (p: TransformationPart, axis: number, v: number) => {
    const next = [...liveRot(p)] as [number, number, number];
    next[axis] = v;
    patch(p.key, { baseRotation: next });
    clearOverrideField(transformPartKey(def.id, p.key), 'rotation');
  };
  const editScale = (p: TransformationPart, v: number) => {
    patch(p.key, { baseScale: v });
    clearOverrideField(transformPartKey(def.id, p.key), 'scale');
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Parts · {parts.length}</div>
        <button onClick={add} disabled={unused.length === 0} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50 disabled:opacity-40">➕ Part</button>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-500">Drag the blue anchors in 3D (jump to TRANSFORMATION) — positions here follow live.</p>
      <div className="mt-1 space-y-1.5">
        {parts.map((p) => (
          <div key={p.key} className={`rounded border p-1.5 ${selectedKey === transformPartKey(def.id, p.key) ? 'border-violet-500/70 bg-violet-950/30' : 'border-slate-800 bg-slate-900/60'}`}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold text-sky-200">{p.key}</span>
              <div className="flex gap-1">
                <FocusButton position={livePos(p)} objKey={transformPartKey(def.id, p.key)} />
                <button onClick={() => useSceneEditStore.getState().requestSelect(transformPartKey(def.id, p.key))} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Select</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Field label="Part"><span className="text-[11px] font-semibold text-sky-200">{p.key}</span></Field>
              <SelectRow label="Geometry (if no model)" value={p.geometry} options={PART_GEOMETRY_KINDS.map((g) => ({ value: g, label: g }))} onChange={(v) => patch(p.key, { geometry: v as TransformationPart['geometry'] })} />
            </div>
            <Field label="Model (empty = primitive)"><ModelPicker value={p.assetId} onChange={(v) => patch(p.key, { assetId: v })} noneLabel="(primitive)" /></Field>
            {p.assetId && <NumRow label="Model size" value={p.modelTarget ?? 1.2} step={0.1} min={0.1} onChange={(v) => patch(p.key, { modelTarget: v })} />}
            <Field label="Base position (x / y / z) — live with the gizmo">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.1} value={round(livePos(p)[a])} onChange={(e) => editPos(p, a, parseFloat(e.target.value) || 0)} className={inp + ' w-0 flex-1 text-center'} />
                ))}
              </div>
            </Field>
            <Field label="Base rotation° (x / y / z) — live with the gizmo">
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={1} value={round(liveRot(p)[a])} onChange={(e) => editRot(p, a, parseFloat(e.target.value) || 0)} className={inp + ' w-0 flex-1 text-center'} />
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-1.5">
              <NumRow label="Base scale" value={round(liveScale(p))} step={0.1} min={0.1} onChange={(v) => editScale(p, v)} />
              <ColorRow label="Colour (empty = theme)" value={p.color ?? def.particleColor} onChange={(v) => patch(p.key, { color: v })} />
            </div>
            <button onClick={() => remove(p.key)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Direct, prominent character size + facing — maps to the ROBOT slot offset (the character model), applied
// immediately in edit + play (the presenter reads modelSlotOffsets.robot). The full per-slot editor is below.
const CharacterQuickControls = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const key = transformModelSlotKey(def.id, 'robot');
  const rootKey = transformRootKey(def.id);
  const override = useSceneEditStore((s) => s.overrides[key]);
  const rootOverride = useSceneEditStore((s) => s.overrides[rootKey]);
  const live = liveOffset(def.modelSlotOffsets?.robot, override);
  const liveRoot = liveOffset({ position: def.rootPosition ?? [0, 0, 0], rotation: def.rootRotation ?? [0, 0, 0], scale: def.modelScale ?? 1 }, rootOverride);
  const setRobot = (patch: Partial<TransformationTransformOffset>) => update({ modelSlotOffsets: { ...(def.modelSlotOffsets ?? {}), robot: { ...live, ...patch } } });
  const editRootPos = (axis: 0 | 1 | 2, value: number) => {
    const next = [...liveRoot.position] as TransformationVec3;
    next[axis] = value;
    update({ rootPosition: next });
    clearOverrideField(rootKey, 'position');
  };
  const editRootRot = (axis: 0 | 1 | 2, value: number) => {
    const next = [...liveRoot.rotation] as TransformationVec3;
    next[axis] = value;
    update({ rootRotation: next });
    clearOverrideField(rootKey, 'rotation');
  };
  return (
    <div className="space-y-1.5 rounded border border-violet-800/40 bg-violet-950/10 p-2">
      <div className={lbl}>Character root gizmo (click the orange root box in 3D)</div>
      <div className="grid grid-cols-2 gap-2">
        <NumRow label="Character size ×" value={round(live.scale)} step={0.1} min={0.05} onChange={(v) => { setRobot({ scale: v }); clearOverrideField(key, 'scale'); }} />
        <NumRow label="Root scale ×" value={round(liveRoot.scale)} step={0.1} min={0.05} onChange={(v) => { update({ modelScale: v }); clearOverrideField(rootKey, 'scale'); }} />
      </div>
      <Field label="Root position (x / y / z)">
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((a) => (
            <input key={a} type="number" step={0.25} value={round(liveRoot.position[a])} onChange={(e) => editRootPos(a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
          ))}
        </div>
      </Field>
      <Field label="Root rotation° (x / y / z)">
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((a) => (
            <input key={a} type="number" step={1} value={round(liveRoot.rotation[a])} onChange={(e) => editRootRot(a, num(e.target.value))} className={inp + ' w-0 flex-1 text-center'} />
          ))}
        </div>
      </Field>
      <NumRow label="Character facing° (legacy Y)" value={round(def.baseYawDeg ?? 0)} step={5} onChange={(v) => update({ baseYawDeg: v })} />
    </div>
  );
};

// Interactive-showcase / spin settings — how much the character spins during the showcase + pose labels.
const ShowcaseSettings = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const sc = def.interactionShowcase;
  const patch = (p: Partial<typeof sc>) => update({ interactionShowcase: { ...sc, ...p } });
  return (
    <div className="rounded border border-slate-800 bg-slate-900/45 p-1.5">
      <div className={lbl}>Showcase / spin</div>
      <div className="mt-1 flex items-center gap-3">
        <Check label="Enabled" checked={sc.enabled} onChange={(v) => patch({ enabled: v })} />
        <div className="flex-1"><NumRow label="Spin speed °/s" value={sc.rotateSpeedDeg} step={10} onChange={(v) => patch({ rotateSpeedDeg: v })} /></div>
      </div>
      <TextRow label="Pose labels (csv, keys 1/2/3)" value={sc.poses.join(', ')} onChange={(v) => patch({ poses: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
    </div>
  );
};

const ModelSlotsEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const patch = (slot: ModelSlot, value: TransformationTransformOffset) => {
    update({ modelSlotOffsets: { ...(def.modelSlotOffsets ?? {}), [slot]: value } });
  };
  return (
    <div className="space-y-1.5">
      <div className={lbl}>Model slot offsets</div>
      <p className="text-[10px] text-slate-500">Click a model in 3D (TRANSFORMATION edit) or Select below → gizmo. Facing = rotation Y. Drag bakes here.</p>
      {MODEL_SLOTS.map((slot) => (
        <TransformOffsetFields
          key={slot}
          title={`${slot} slot`}
          objKey={transformModelSlotKey(def.id, slot)}
          value={def.modelSlotOffsets?.[slot]}
          onChange={(v) => patch(slot, v)}
        />
      ))}
    </div>
  );
};

const ModelSlotVisibilityPanel = ({ def }: { def: TransformationDefinition }) => {
  const rows = modelSlotVisibilityDiagnostics(def, (slot) => modelIdForSlot(def, slot));
  return (
    <div className="rounded border border-slate-800 bg-slate-900/45 p-1.5">
      <div className={lbl}>Model slot visibility diagnostics</div>
      <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
        {rows.map((row) => (
          <div key={row.slot} className={`rounded px-2 py-1 ${row.visible ? 'bg-emerald-950/20 text-emerald-200' : 'bg-slate-950/40 text-slate-400'}`}>
            <div className="font-semibold">{row.slot}</div>
            <div className="truncate font-mono">{row.modelId ?? 'no model'}</div>
            <div>{row.visible ? 'visible' : 'hidden'}{row.sourceStageId ? ` · ${row.sourceStageId}` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── stage params (type-aware) ──
const StageParams = ({ s, def, patch }: { s: TransformationStage; def: TransformationDefinition; patch: (p: Partial<TransformationStage['params']>) => void }) => {
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
    case 'model-move':
      return (
        <>
          <Field label="Arbitrary model (overrides slot — moves a model-swapped model)">
            <ModelPicker value={p.modelRef} onChange={(v) => patch({ modelRef: v })} noneLabel="(use slot)" />
          </Field>
          {!p.modelRef && <SelectRow label="Model slot" value={p.modelSlot ?? 'robot'} options={opts(MODEL_SLOTS)} onChange={(v) => patch({ modelSlot: v as typeof p.modelSlot })} />}
          <Vec3 label="Move to position (offset)" value={p.toPosition ?? [0, 0, 0]} onChange={(v) => patch({ toPosition: v })} />
          <Vec3 label="Rotate to° (offset)" value={p.toRotation ?? [0, 0, 0]} onChange={(v) => patch({ toRotation: v })} />
          <NumRow label="Scale to ×" value={p.toScale ?? 1} step={0.1} min={0.05} onChange={(v) => patch({ toScale: v })} />
        </>
      );
    case 'model-visibility':
      return (
        <>
          <Field label="Arbitrary model (overrides slot — shows/hides a model-swapped model)">
            <ModelPicker value={p.modelRef} onChange={(v) => patch({ modelRef: v })} noneLabel="(use slot)" />
          </Field>
          {!p.modelRef && <SelectRow label="Model slot" value={p.modelSlot ?? 'robot'} options={opts(MODEL_SLOTS)} onChange={(v) => patch({ modelSlot: v as typeof p.modelSlot })} />}
          <Check label="Visible" checked={p.visible ?? true} onChange={(v) => patch({ visible: v })} />
        </>
      );
    case 'model-swap':
      return (
        <>
          <SelectRow label="Model slot" value={p.modelSlot ?? 'robot'} options={opts(MODEL_SLOTS)} onChange={(v) => patch({ modelSlot: v as typeof p.modelSlot })} />
          <Field label="Arbitrary model (overrides slot — chain any number of swaps)">
            <ModelPicker value={p.modelRef} onChange={(v) => patch({ modelRef: v })} noneLabel="(use slot)" />
          </Field>
          {p.modelRef && (
            <TransformOffsetFields
              title="Stage model offset"
              objKey={transformStageModelKey(def.id, s.id)}
              value={p.modelOffset}
              onChange={(v) => patch({ modelOffset: v })}
            />
          )}
          <Check label="Visible" checked={p.visible ?? true} onChange={(v) => patch({ visible: v })} />
        </>
      );
    case 'animation-clip':
      return (
        <>
          <SelectRow
            label="Target slot"
            value={p.modelSlot ?? ''}
            options={[{ value: '', label: '(auto)' }, ...opts(MODEL_SLOTS)]}
            onChange={(v) => patch({ modelSlot: (v || undefined) as ModelSlot | undefined, modelRef: undefined, clipName: undefined })}
          />
          <Field label="Target model override">
            <ModelPicker value={p.modelRef} onChange={(v) => patch({ modelRef: v, clipName: undefined })} noneLabel="(use slot/auto)" />
          </Field>
          <ClipSelect modelId={stageClipModelId(def, s)} stage={s} value={p.clipName} onChange={(v) => { patch({ clipName: v }); if (v) useTransformationPreviewStore.getState().playRange(s.startTime, s.startTime + Math.max(0.1, s.duration), false); }} />
          <NumRow label="Clip speed" value={p.clipSpeed ?? 1} step={0.1} onChange={(v) => patch({ clipSpeed: v })} />
          <Check label="Loop" checked={p.loop ?? false} onChange={(v) => patch({ loop: v })} />
          <Check label="Hold final frame" checked={p.holdFinal ?? false} onChange={(v) => patch({ holdFinal: v })} />
        </>
      );
    case 'enter-stage':
      return (
        <>
          <Vec3 label="Enter from position" value={p.fromPosition ?? [0, 3, 0]} onChange={(v) => patch({ fromPosition: v })} />
          <Vec3 label="Enter from rotation°" value={p.fromRotation ?? [0, 0, 0]} onChange={(v) => patch({ fromRotation: v })} />
          <NumRow label="Enter from scale ×" value={p.fromScale ?? 0.7} step={0.05} min={0.05} onChange={(v) => patch({ fromScale: v })} />
        </>
      );
    case 'camera-shot':
      return (
        <>
          <SelectRow label="Camera type" value={p.cameraShotType ?? 'orbit'} options={opts(CAMERA_SHOT_TYPES)} onChange={(v) => patch({ cameraShotType: v as typeof p.cameraShotType })} />
          <SelectRow label="Target part" value={p.partKey ?? ''} options={[{ value: '', label: '(centre)' }, ...opts(TRANSFORMATION_PART_KEYS)]} onChange={(v) => patch({ partKey: (v || undefined) as typeof p.partKey })} />
          <SelectRow label="Rotation mode" value={p.rotationMode ?? 'inherit'} options={opts(CAMERA_ROTATION_MODES)} onChange={(v) => patch({ rotationMode: v as typeof p.rotationMode })} />
          <NumRow label="Rotate speed °/s" value={p.rotateSpeedDeg ?? 23} step={5} onChange={(v) => patch({ rotateSpeedDeg: v })} />
          <NumRow label="Distance" value={p.distance ?? 7} step={0.5} onChange={(v) => patch({ distance: v })} />
          <NumRow label="Height" value={p.height ?? 2} step={0.25} onChange={(v) => patch({ height: v })} />
          <NumRow label="Angle°" value={p.angle ?? 0} step={10} onChange={(v) => patch({ angle: v })} />
          <NumRow label="FOV" value={p.fov ?? 55} step={1} min={10} onChange={(v) => patch({ fov: v })} />
          <NumRow label="Shake" value={p.shakeIntensity ?? 0} step={0.05} min={0} onChange={(v) => patch({ shakeIntensity: v })} />
          <Vec3 label="Look at offset" value={p.lookAtOffset ?? [0, 0.4, 0]} onChange={(v) => patch({ lookAtOffset: v })} />
        </>
      );
    case 'backdrop-shift':
      return <NumRow label="Backdrop intensity" value={p.backdropIntensity ?? 1} step={0.1} onChange={(v) => patch({ backdropIntensity: v })} />;
    case 'effect-burst':
    case 'energy-ring':
    case 'speed-line-burst':
    case 'cloud-ripple-burst':
      return (
        <>
          {s.type !== 'speed-line-burst' && <SelectRow label="Follow part" value={p.followTargetPart ?? ''} options={[{ value: '', label: '(centre)' }, ...opts(TRANSFORMATION_PART_KEYS)]} onChange={(v) => patch({ followTargetPart: (v || undefined) as typeof p.followTargetPart })} />}
          <ColorRow label="Colour" value={p.color ?? '#ffffff'} onChange={(v) => patch({ color: v })} />
          <NumRow label="Intensity" value={p.intensity ?? 1} step={0.1} onChange={(v) => patch({ intensity: v })} />
          <NumRow label={s.type === 'cloud-ripple-burst' ? 'Radius' : 'Scale'} value={p.scale ?? (s.type === 'cloud-ripple-burst' ? 7.5 : 1)} step={0.1} min={0} onChange={(v) => patch({ scale: v })} />
          {s.type === 'effect-burst' && <NumRow label="Particle count" value={p.repeat ?? 12} step={1} min={1} onChange={(v) => patch({ repeat: v })} />}
          {s.type === 'cloud-ripple-burst' && <NumRow label="Particle count" value={p.particleCount ?? 170} step={10} min={12} onChange={(v) => patch({ particleCount: v })} />}
          {s.type === 'cloud-ripple-burst' && <NumRow label="Ring count" value={p.ringCount ?? 5} step={1} min={1} onChange={(v) => patch({ ringCount: v })} />}
          {s.type !== 'speed-line-burst' && <Vec3 label="Spawn offset" value={p.spawnOffset ?? [0, 0, 0]} onChange={(v) => patch({ spawnOffset: v })} />}
        </>
      );
    case 'clone-hero-burst':
      return (
        <>
          <SelectRow
            label="Target slot"
            value={p.modelSlot ?? ''}
            options={[{ value: '', label: '(auto)' }, ...opts(MODEL_SLOTS)]}
            onChange={(v) => patch({ modelSlot: (v || undefined) as ModelSlot | undefined, modelRef: undefined, clipName: undefined })}
          />
          <Field label="Target model override">
            <ModelPicker value={p.modelRef} onChange={(v) => patch({ modelRef: v, clipName: undefined })} noneLabel="(use slot/auto)" />
          </Field>
          <ClipSelect modelId={stageClipModelId(def, s)} stage={s} value={p.clipName} onChange={(v) => { patch({ clipName: v }); if (v) useTransformationPreviewStore.getState().playRange(s.startTime, s.startTime + Math.max(0.1, s.duration), false); }} />
          <NumRow label="Clip speed" value={p.clipSpeed ?? 1} step={0.1} onChange={(v) => patch({ clipSpeed: v })} />
          <Check label="Loop" checked={p.loop ?? false} onChange={(v) => patch({ loop: v })} />
          <Check label="Hold final frame" checked={p.holdFinal ?? true} onChange={(v) => patch({ holdFinal: v })} />
          <ColorRow label="Glow colour" value={p.color ?? '#7fd0ff'} onChange={(v) => patch({ color: v })} />
          <NumRow label="Glow intensity" value={p.intensity ?? 1} step={0.1} min={0} onChange={(v) => patch({ intensity: v })} />
          <NumRow label="Max clone scale" value={p.scale ?? 14} step={0.5} min={1} onChange={(v) => patch({ scale: v })} />
          <NumRow label="Star count" value={p.repeat ?? 54} step={6} min={12} onChange={(v) => patch({ repeat: v })} />
          <NumRow label="Star radius" value={p.ghostSpread ?? 12} step={0.5} min={0} onChange={(v) => patch({ ghostSpread: v })} />
          <Check label="Fade near boundary" checked={p.ghostPersist ?? true} onChange={(v) => patch({ ghostPersist: v })} />
        </>
      );
    case 'voice-cue':
      return <TextRow label="Text" value={p.text ?? ''} onChange={(v) => patch({ text: v })} />;
    case 'exit-stage':
      return (
        <>
          <TextRow label="Target phase" value={p.targetPhase ?? 'DESCENT'} onChange={(v) => patch({ targetPhase: v })} />
          <NumRow label="Descent distance (slow sink)" value={p.intensity ?? 6} step={1} min={0} onChange={(v) => patch({ intensity: v })} />
          <NumRow label="Shrink to × (fly-out; 1 = none)" value={p.toScale ?? 1} step={0.05} min={0} onChange={(v) => patch({ toScale: v })} />
        </>
      );
    case 'finish-pose':
    case 'interactive-showcase':
      return (
        <>
          <ColorRow label="Highlight colour" value={p.color ?? '#ffffff'} onChange={(v) => patch({ color: v })} />
          <NumRow label="Highlight intensity" value={p.intensity ?? 1} step={0.1} min={0} onChange={(v) => patch({ intensity: v })} />
        </>
      );
    default:
      return null;
  }
};

// The gizmo anchor (key + live position) for a coordinate-bearing stage — null for stages that place nothing
// in 3D. Lets every such stage be Selected/Focused straight from its row (the anchor also renders in 3D).
function stageGizmo(def: TransformationDefinition, s: TransformationStage): { key: string; position: [number, number, number] } | null {
  if (s.type === 'part-transform') return { key: transformStagePartMoveKey(def.id, s.id), position: s.params.toPosition ?? [0, 0, 0] };
  if (s.type === 'model-move') return { key: transformStageMoveKey(def.id, s.id), position: s.params.toPosition ?? [0, 0, 0] };
  if (s.type === 'model-swap' && s.params.modelRef) return { key: transformStageModelKey(def.id, s.id), position: s.params.modelOffset?.position ?? [0, 0, 0] };
  return null;
}

const StageGizmoControls = ({ def, s }: { def: TransformationDefinition; s: TransformationStage }) => {
  const selectedKey = useSceneEditStore((s2) => s2.selectedKey);
  const g = stageGizmo(def, s);
  if (!g) return null;
  return (
    <div className={`flex items-center gap-1 rounded px-1 ${selectedKey === g.key ? 'bg-violet-950/40' : ''}`}>
      <span className="text-[10px] text-slate-500">gizmo</span>
      <FocusButton position={g.position} objKey={g.key} />
      <button onClick={() => useSceneEditStore.getState().requestSelect(g.key)} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200 hover:bg-slate-700">Select</button>
    </div>
  );
};

const StageAuthoringDiagnostics = ({ s }: { s: TransformationStage }) => {
  const target = stageTargetDiagnostic(s);
  const times = stageScrubTimes(s);
  const scrub = (time: number) => useTransformationPreviewStore.getState().scrub(time);
  const playStage = () => useTransformationPreviewStore.getState().playRange(times.start, Math.max(times.start + 0.1, times.end));
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
      <span className="rounded bg-slate-950/60 px-2 py-0.5 text-slate-400">target: <span className="text-slate-200">{target.label}</span></span>
      <button onClick={() => scrub(times.start)} className="rounded bg-slate-800 px-2 py-0.5 text-slate-200 hover:bg-slate-700">Scrub Start</button>
      <button onClick={() => scrub(times.middle)} className="rounded bg-slate-800 px-2 py-0.5 text-slate-200 hover:bg-slate-700">Scrub Mid</button>
      <button onClick={() => scrub(times.end)} className="rounded bg-slate-800 px-2 py-0.5 text-slate-200 hover:bg-slate-700">Scrub End</button>
      <button onClick={playStage} className="rounded bg-fuchsia-800/50 px-2 py-0.5 text-fuchsia-100 hover:bg-fuchsia-700/60">Play Stage</button>
    </div>
  );
};

const StagesEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => {
    const startTime = useTransformationPreviewStore.getState().time;
    update({ stages: [...def.stages, { id: `s_${nanoid(4)}`, type: 'part-transform', startTime, duration: 0.5, enabled: true, params: defaultParamsForStageType('part-transform') }] });
  };
  const shouldReplayStage = (stage: TransformationStage): boolean =>
    stage.type === 'clone-hero-burst'
    || stage.type === 'cloud-ripple-burst'
    || stage.type === 'effect-burst'
    || stage.type === 'energy-ring'
    || stage.type === 'speed-line-burst'
    || stage.type === 'animation-clip';
  const replayStage = (stage: TransformationStage) => {
    useTransformationPreviewStore.getState().playRange(stage.startTime, stage.startTime + Math.max(0.1, stage.duration), false);
  };
  const stagePreviewTime = (stage: TransformationStage, override?: number): number => {
    if (override !== undefined) return override;
    if (stage.type === 'clone-hero-burst' || stage.type === 'cloud-ripple-burst' || stage.type === 'effect-burst' || stage.type === 'energy-ring' || stage.type === 'camera-shot') {
      return stage.startTime + Math.max(0.08, stage.duration * 0.38);
    }
    return stage.startTime;
  };
  const previewAfterStageEdit = (stage: TransformationStage, override?: number) => {
    if (override !== undefined) {
      useTransformationPreviewStore.getState().scrub(stagePreviewTime(stage, override));
      return;
    }
    if (shouldReplayStage(stage)) {
      replayStage(stage);
      return;
    }
    useTransformationPreviewStore.getState().scrub(stagePreviewTime(stage));
  };
  const patch = (id: string, p: Partial<TransformationStage>) => {
    const nextStages = def.stages.map((s) => (s.id === id ? { ...s, ...p } : s));
    update({ stages: nextStages });
    const nextStage = nextStages.find((s) => s.id === id);
    if (nextStage) previewAfterStageEdit(nextStage, p.startTime);
  };
  const patchParams = (id: string, pp: Partial<TransformationStage['params']>) => {
    const nextStages = def.stages.map((s) => (s.id === id ? { ...s, params: { ...s.params, ...pp } } : s));
    update({ stages: nextStages });
    const nextStage = nextStages.find((s) => s.id === id);
    if (nextStage) previewAfterStageEdit(nextStage);
  };
  const remove = (id: string) => update({ stages: def.stages.filter((s) => s.id !== id) });
  const duplicateStage = (stage: TransformationStage) => update({ stages: [...def.stages, { ...stage, id: `s_${nanoid(4)}`, label: stage.label ? `${stage.label} Copy` : undefined, startTime: stage.startTime + 0.1, params: { ...stage.params } }] });
  const revealTarget = (stage: TransformationStage) => {
    if (stage.type !== 'animation-clip' && stage.type !== 'clone-hero-burst') return;
    const target = stage.params.modelRef
      ? { modelRef: stage.params.modelRef, visible: true }
      : { modelSlot: stage.params.modelSlot ?? 'robot', visible: true };
    update({
      stages: [
        ...def.stages,
        { id: `s_${nanoid(4)}`, type: stage.params.modelRef ? 'model-swap' : 'model-visibility', startTime: stage.startTime, duration: 0.05, enabled: true, essential: stage.essential, label: `reveal for ${stage.label ?? stage.id}`, params: target },
      ],
    });
    useTransformationPreviewStore.getState().scrub(stage.startTime);
  };
  return (
    <div>
      <div className="flex items-center justify-between"><div className={lbl}>Stages · {def.stages.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Stage</button></div>
      <div className="mt-1 space-y-1.5">
        {def.stages.map((s, i) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow
                label="Type"
                value={s.type}
                options={opts(TRANSFORMATION_STAGE_TYPES)}
                onChange={(v) => {
                  const type = v as TransformationStage['type'];
                  patch(s.id, { type, params: defaultParamsForStageType(type) });
                }}
              />
              <TextRow label="Label" value={s.label ?? ''} onChange={(v) => patch(s.id, { label: v })} />
              <NumRow label="Start" value={s.startTime} step={0.1} min={0} onChange={(v) => patch(s.id, { startTime: v })} />
              <NumRow label="Duration" value={s.duration} step={0.1} min={0} onChange={(v) => patch(s.id, { duration: v })} />
              <SelectRow label="Easing" value={s.easing ?? 'linear'} options={opts(EASINGS)} onChange={(v) => patch(s.id, { easing: v as TransformationStage['easing'] })} />
            </div>
            <div className="mt-1 flex gap-3">
              <Check label="Enabled" checked={s.enabled} onChange={(v) => patch(s.id, { enabled: v })} />
              <Check label="Essential (quick)" checked={s.essential ?? false} onChange={(v) => patch(s.id, { essential: v })} />
            </div>
            <div className="mt-1"><StageParams s={s} def={def} patch={(pp) => patchParams(s.id, pp)} /></div>
            <StageAuthoringDiagnostics s={s} />
            <div className="mt-1 flex items-center gap-1.5">
              <StageGizmoControls def={def} s={s} />
              <MoveButtons index={i} count={def.stages.length} onMove={(d) => update({ stages: moveItem(def.stages, i, d) })} />
              <button onClick={() => duplicateStage(s)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
              {(s.type === 'animation-clip' || s.type === 'clone-hero-burst') && <button onClick={() => revealTarget(s)} className="rounded bg-sky-800/60 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700">Reveal Target</button>}
              <button onClick={() => remove(s.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CameraEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => update({ cameraShots: [...def.cameraShots, { id: `c_${nanoid(4)}`, type: 'orbit', startTime: 0, duration: 1, distance: 6, height: 2, angle: 0, fov: 50 }] });
  const patch = (id: string, p: Partial<TransformationCameraShot>) => { update({ cameraShots: def.cameraShots.map((s) => (s.id === id ? { ...s, ...p } : s)) }); const sh = def.cameraShots.find((s) => s.id === id); useTransformationPreviewStore.getState().scrub(p.startTime ?? sh?.startTime ?? 0); };
  const remove = (id: string) => update({ cameraShots: def.cameraShots.filter((s) => s.id !== id) });
  const duplicateShot = (shot: TransformationCameraShot) => update({ cameraShots: [...def.cameraShots, { ...shot, id: `c_${nanoid(4)}`, startTime: shot.startTime + 0.1 }] });
  const previewShot = (shot: TransformationCameraShot) => {
    useTransformationPreviewStore.getState().setPreviewCamera(true);
    useTransformationPreviewStore.getState().scrub(shot.startTime);
  };
  const playShot = (shot: TransformationCameraShot) => useTransformationPreviewStore.getState().playRange(shot.startTime, shot.startTime + Math.max(0.1, shot.duration));
  const timelineRotationModes = CAMERA_ROTATION_MODES.filter((mode) => mode !== 'inherit');
  return (
    <div>
      <div className="mb-2 rounded border border-slate-800 bg-slate-900/50 p-1.5">
        <div className={lbl}>Main camera rotation</div>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <SelectRow label="Default rotation" value={def.cameraRotationMode ?? 'auto'} options={opts(timelineRotationModes)} onChange={(v) => update({ cameraRotationMode: v as TransformationDefinition['cameraRotationMode'] })} />
          <NumRow label="Default speed °/s" value={def.cameraRotateSpeedDeg ?? 17} step={5} onChange={(v) => update({ cameraRotateSpeedDeg: v })} />
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <button onClick={() => useTransformationPreviewStore.getState().setPreviewCamera(true)} className="rounded bg-sky-800/50 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/60">Preview Camera</button>
          <button onClick={() => useTransformationPreviewStore.getState().setPreviewCamera(false)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">Free Orbit</button>
        </div>
      </div>
      <div className="flex items-center justify-between"><div className={lbl}>Camera shots · {def.cameraShots.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Shot</button></div>
      <div className="mt-1 space-y-1.5">
        {def.cameraShots.map((s, i) => (
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
              <SelectRow label="Rotation mode" value={s.rotationMode ?? 'inherit'} options={opts(CAMERA_ROTATION_MODES)} onChange={(v) => patch(s.id, { rotationMode: v as TransformationCameraShot['rotationMode'] })} />
              <NumRow label="Rotate speed °/s" value={s.rotateSpeedDeg ?? 23} step={5} onChange={(v) => patch(s.id, { rotateSpeedDeg: v })} />
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <MoveButtons index={i} count={def.cameraShots.length} onMove={(d) => update({ cameraShots: moveItem(def.cameraShots, i, d) })} />
              <button onClick={() => previewShot(s)} className="rounded bg-sky-800/50 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/60">Preview</button>
              <button onClick={() => playShot(s)} className="rounded bg-fuchsia-800/50 px-2 py-0.5 text-[11px] text-fuchsia-100 hover:bg-fuchsia-700/60">Play Shot</button>
              <button onClick={() => duplicateShot(s)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
              <button onClick={() => remove(s.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EffectsEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => update({ effectTracks: [...def.effectTracks, { id: `e_${nanoid(4)}`, type: 'glow-pulse', startTime: 0, duration: 1 }] });
  const shouldReplayEffect = (effect: TransformationEffectTrack): boolean =>
    effect.type === 'ghost-burst'
    || effect.type === 'cloud-ripple-burst'
    || effect.type === 'particle-burst'
    || effect.type === 'energy-ring'
    || effect.type === 'speed-line-burst'
    || effect.type === 'sparkle';
  const effectPreviewTime = (effect: TransformationEffectTrack, patchValue: Partial<TransformationEffectTrack>): number => {
    const startTime = patchValue.startTime ?? effect.startTime;
    const duration = patchValue.duration ?? effect.duration;
    if (effect.type === 'ghost-burst' || patchValue.type === 'ghost-burst' || effect.type === 'cloud-ripple-burst' || patchValue.type === 'cloud-ripple-burst') {
      return startTime + Math.max(0.08, duration * 0.38);
    }
    return startTime;
  };
  const patch = (id: string, p: Partial<TransformationEffectTrack>) => {
    const nextTracks = def.effectTracks.map((s) => (s.id === id ? { ...s, ...p } : s));
    update({ effectTracks: nextTracks });
    const fx = nextTracks.find((s) => s.id === id);
    if (!fx) {
      useTransformationPreviewStore.getState().scrub(0);
      return;
    }
    if (p.startTime !== undefined) {
      useTransformationPreviewStore.getState().scrub(effectPreviewTime(fx, {}));
      return;
    }
    if (shouldReplayEffect(fx)) {
      useTransformationPreviewStore.getState().playRange(fx.startTime, fx.startTime + Math.max(0.1, fx.duration), false);
      return;
    }
    useTransformationPreviewStore.getState().scrub(effectPreviewTime(fx, {}));
  };
  const remove = (id: string) => update({ effectTracks: def.effectTracks.filter((s) => s.id !== id) });
  const duplicateEffect = (effect: TransformationEffectTrack) => update({ effectTracks: [...def.effectTracks, { ...effect, id: `e_${nanoid(4)}`, startTime: effect.startTime + 0.1 }] });
  const playEffect = (effect: TransformationEffectTrack) => useTransformationPreviewStore.getState().playRange(effect.startTime, effect.startTime + Math.max(0.1, effect.duration), false);
  return (
    <div>
      <div className="flex items-center justify-between"><div className={lbl}>Effect tracks · {def.effectTracks.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Effect</button></div>
      <div className="mt-1 space-y-1.5">
        {def.effectTracks.map((s, i) => (
          <div key={s.id} className="rounded bg-slate-900/60 p-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <SelectRow label="Type" value={s.type} options={opts(EFFECT_TYPES)} onChange={(v) => patch(s.id, { type: v as TransformationEffectTrack['type'] })} />
              <SelectRow label="Follow part" value={s.followTargetPart ?? ''} options={[{ value: '', label: '(centre)' }, ...opts(TRANSFORMATION_PART_KEYS)]} onChange={(v) => patch(s.id, { followTargetPart: (v || undefined) as TransformationEffectTrack['followTargetPart'] })} />
              <NumRow label="Start" value={s.startTime} step={0.1} min={0} onChange={(v) => patch(s.id, { startTime: v })} />
              <NumRow label="Duration" value={s.duration} step={0.1} min={0} onChange={(v) => patch(s.id, { duration: v })} />
              <NumRow label="Intensity" value={s.intensity ?? 1} step={0.1} onChange={(v) => patch(s.id, { intensity: v })} />
              {s.type !== 'ghost-burst' && <NumRow label="Scale" value={s.scale ?? 1} step={0.1} onChange={(v) => patch(s.id, { scale: v })} />}
            </div>
            <ColorRow label="Colour" value={s.color ?? '#ffffff'} onChange={(v) => patch(s.id, { color: v })} />
            {s.type === 'ghost-burst' && (
              <div className="mt-1 grid grid-cols-2 gap-1.5 rounded bg-slate-950/40 p-1.5">
                <SelectRow label="Target slot" value={s.modelSlot ?? ''} options={[{ value: '', label: '(auto)' }, ...opts(MODEL_SLOTS)]} onChange={(v) => patch(s.id, { modelSlot: (v || undefined) as TransformationEffectTrack['modelSlot'], modelRef: undefined })} />
                <NumRow label="Max clone scale" value={s.scale ?? 14} step={0.5} min={1} onChange={(v) => patch(s.id, { scale: v })} />
                <NumRow label="Star count" value={s.repeat ?? 54} step={6} min={12} onChange={(v) => patch(s.id, { repeat: v })} />
                <NumRow label="Star radius" value={s.ghostSpread ?? 12} step={0.5} min={0} onChange={(v) => patch(s.id, { ghostSpread: v })} />
                <div className="col-span-2"><Vec3 label="Spawn offset" value={s.spawnOffset ?? [0, 0, 0]} onChange={(v) => patch(s.id, { spawnOffset: v })} /></div>
                <div className="col-span-2"><Check label="Fade near boundary" checked={s.ghostPersist ?? true} onChange={(v) => patch(s.id, { ghostPersist: v })} /></div>
              </div>
            )}
            {s.type === 'cloud-ripple-burst' && (
              <div className="mt-1 grid grid-cols-2 gap-1.5 rounded bg-slate-950/40 p-1.5">
                <NumRow label="Particle count" value={s.particleCount ?? s.repeat ?? 170} step={10} min={12} onChange={(v) => patch(s.id, { particleCount: v })} />
                <NumRow label="Ring count" value={s.ringCount ?? 5} step={1} min={1} onChange={(v) => patch(s.id, { ringCount: v })} />
                <div className="col-span-2"><Vec3 label="Spawn offset" value={s.spawnOffset ?? [0, 0, 0]} onChange={(v) => patch(s.id, { spawnOffset: v })} /></div>
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <MoveButtons index={i} count={def.effectTracks.length} onMove={(d) => update({ effectTracks: moveItem(def.effectTracks, i, d) })} />
              <button onClick={() => useTransformationPreviewStore.getState().scrub(effectPreviewTime(s, {}))} className="rounded bg-sky-800/50 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/60">Preview</button>
              <button onClick={() => playEffect(s)} className="rounded bg-fuchsia-800/50 px-2 py-0.5 text-[11px] text-fuchsia-100 hover:bg-fuchsia-700/60">Play Effect</button>
              <button onClick={() => duplicateEffect(s)} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
              <button onClick={() => remove(s.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
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
      <Check label="Preview transformation camera" checked={ps.previewCamera} onChange={(v) => ps.setPreviewCamera(v)} />
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

type Sub = 'timeline' | 'parts' | 'camera' | 'effects' | 'preview';

// ✨ Transform — sub-tabbed timeline editor (Timeline · Camera · Effects · Preview). Reuses the
// editorTransformationStore collection; selecting a timeline wires it to the Edit-Mode preview.
export const TransformationEditorTab = () => {
  const items = useEditorTransformationStore((s) => s.items);
  const upsert = useEditorTransformationStore((s) => s.upsert);
  const update = useEditorTransformationStore((s) => s.update);
  const duplicate = useEditorTransformationStore((s) => s.duplicate);
  const remove = useEditorTransformationStore((s) => s.remove);
  const reorder = useEditorTransformationStore((s) => s.reorder);
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
        <div className="max-h-[60vh] w-48 shrink-0 space-y-1 overflow-y-auto pr-1">
          {items.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-1 rounded ${t.id === def?.id ? 'bg-violet-600/20' : ''}`}>
              <button onClick={() => select(t.id)} className={`min-w-0 flex-1 truncate rounded px-2 py-1 text-left ${t.id === def?.id ? 'text-violet-100' : 'text-slate-300 hover:bg-slate-800'}`}>{t.name}</button>
              <MoveButtons index={i} count={items.length} onMove={(d) => reorder(t.id, d)} />
            </div>
          ))}
          {items.length === 0 && <div className="text-slate-500">None yet.</div>}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {def ? (
            <>
              <div className="flex gap-1">
                {(['timeline', 'parts', 'camera', 'effects', 'preview'] as Sub[]).map((s) => (
                  <button key={s} onClick={() => setSub(s)} className={`rounded px-2 py-0.5 text-[11px] font-semibold ${sub === s ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'}`}>{s}</button>
                ))}
              </div>

              {(() => { const errs = validateTimeline(def); return errs.length > 0 ? (
                <div className="rounded bg-rose-900/40 p-1.5 text-[11px] text-rose-200">{errs.map((er, i) => <div key={i}>⚠ {er}</div>)}</div>
              ) : null; })()}

              <SelectedTargetDiagnostics def={def} update={upd} />

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
                  <NumRow label="Performance scale × (whole show)" value={def.modelScale ?? 1} step={0.1} min={0.1} onChange={(v) => upd({ modelScale: v })} />
                  <CharacterQuickControls def={def} update={upd} />
                  <Field label="Plane model (slot)"><ModelPicker value={def.planeModelRef} onChange={(v) => upd({ planeModelRef: v })} noneLabel="(none)" /></Field>
                  <Field label="Robot model (slot — empty = character's)"><ModelPicker value={def.robotModelRef} onChange={(v) => upd({ robotModelRef: v })} noneLabel="(character's)" /></Field>
                  <Field label="Shared model (slot)"><ModelPicker value={def.sharedModelRef} onChange={(v) => upd({ sharedModelRef: v })} noneLabel="(none)" /></Field>
                  <ShowcaseSettings def={def} update={upd} />
                  <ModelSlotsEditor def={def} update={upd} />
                  <ModelSlotVisibilityPanel def={def} />
                  <StagesEditor def={def} update={upd} />
                </>
              )}
              {sub === 'parts' && <PartsEditor def={def} update={upd} />}
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
