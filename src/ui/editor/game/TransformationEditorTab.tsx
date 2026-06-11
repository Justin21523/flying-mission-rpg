import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { useTransformationPreviewStore } from '../../../stores/game/transformationPreviewStore';
import { useSceneEditStore } from '../../../stores/sceneEditStore';
import { validateTimeline } from '../../../game/transformation/transformationValidation';
import { liveOffset, scaleNumber, radiansToDegrees, resolveStageClipModelId } from '../../../game/transformation/transformationOverrides';
import { transformModelSlotKey, transformPartKey, transformStageModelKey, transformStageMoveKey, transformStagePartMoveKey } from '../../../game/transformation/transformPartKey';
import { getModelAsset } from '../../../data/modelLibrary';
import { useGltfClipNames } from '../useGltfClipNames';
import {
  FORM_STRATEGIES, TRANSFORMATION_STAGE_TYPES, TRANSFORMATION_PART_KEYS, PART_GEOMETRY_KINDS, MODEL_SLOTS, EASINGS,
  CAMERA_SHOT_TYPES, EFFECT_TYPES, TRANSFORMATION_MODES,
} from '../../../types/game/transformation';
import type {
  ModelSlot, TransformationDefinition, TransformationStage, TransformationCameraShot,
  TransformationEffectTrack, TransformationPart, TransformationTransformOffset, TransformationVec3,
} from '../../../types/game/transformation';
import { Field, inp, lbl, Check, FocusButton, MoveButtons } from '../editorShared';
import { moveItem } from '../../../game/editor/arrayMove';
import { ModelPicker } from '../ModelPicker';
import { TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';

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

const Vec3 = ({ label, value, onChange }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void }) => (
  <Field label={label}>
    <div className="flex gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={0.1} value={value[a]} onChange={(e) => { const n = [...value] as [number, number, number]; n[a] = num(e.target.value); onChange(n); }} className={inp + ' w-0 flex-1 text-center'} />
      ))}
    </div>
  </Field>
);

function modelIdForSlot(def: TransformationDefinition, slot: ModelSlot): string | undefined {
  if (slot === 'plane') return def.planeModelRef;
  if (slot === 'shared') return def.sharedModelRef;
  const ch = def.characterId ? useEditorCharacterStore.getState().items.find((c) => c.id === def.characterId) : undefined;
  return def.robotModelRef ?? ch?.modelAssetId;
}

const stageClipModelId = (def: TransformationDefinition, stage: TransformationStage): string | undefined =>
  resolveStageClipModelId(def, stage, (slot) => modelIdForSlot(def, slot));

const ClipSelect = ({ modelId, value, onChange }: { modelId?: string; value?: string; onChange: (v?: string) => void }) => {
  const asset = modelId ? getModelAsset(modelId) : undefined;
  const clips = useGltfClipNames(asset?.path);
  if (clips.length === 0) return <TextRow label="Clip name (type — no model clips found)" value={value ?? ''} onChange={(v) => onChange(v || undefined)} />;
  return (
    <SelectRow
      label="Clip"
      value={value ?? ''}
      options={[{ value: '', label: '(none)' }, ...clips.map((c) => ({ value: c, label: c }))]}
      onChange={(v) => onChange(v || undefined)}
    />
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
  const override = useSceneEditStore((s) => s.overrides[key]);
  const live = liveOffset(def.modelSlotOffsets?.robot, override);
  const setRobot = (patch: Partial<TransformationTransformOffset>) => update({ modelSlotOffsets: { ...(def.modelSlotOffsets ?? {}), robot: { ...live, ...patch } } });
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumRow label="Character size ×" value={round(live.scale)} step={0.1} min={0.05} onChange={(v) => { setRobot({ scale: v }); clearOverrideField(key, 'scale'); }} />
      <NumRow label="Character facing° (Y) — whole show" value={round(def.baseYawDeg ?? 0)} step={5} onChange={(v) => update({ baseYawDeg: v })} />
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
          <ClipSelect modelId={stageClipModelId(def, s)} value={p.clipName} onChange={(v) => patch({ clipName: v })} />
          <NumRow label="Clip speed" value={p.clipSpeed ?? 1} step={0.1} onChange={(v) => patch({ clipSpeed: v })} />
          <Check label="Loop" checked={p.loop ?? false} onChange={(v) => patch({ loop: v })} />
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
          <NumRow label="Shrink to × (fly-out; 1 = none)" value={p.toScale ?? 1} step={0.05} min={0} onChange={(v) => patch({ toScale: v })} />
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

const StagesEditor = ({ def, update }: { def: TransformationDefinition; update: (p: Partial<TransformationDefinition>) => void }) => {
  const add = () => update({ stages: [...def.stages, { id: `s_${nanoid(4)}`, type: 'part-transform', startTime: 0, duration: 0.5, enabled: true, params: {} }] });
  const seekStage = (id: string, override?: number) => { const st = def.stages.find((s) => s.id === id); useTransformationPreviewStore.getState().scrub(override ?? st?.startTime ?? 0); };
  const patch = (id: string, p: Partial<TransformationStage>) => { update({ stages: def.stages.map((s) => (s.id === id ? { ...s, ...p } : s)) }); seekStage(id, p.startTime); };
  const patchParams = (id: string, pp: Partial<TransformationStage['params']>) => { update({ stages: def.stages.map((s) => (s.id === id ? { ...s, params: { ...s.params, ...pp } } : s)) }); seekStage(id); };
  const remove = (id: string) => update({ stages: def.stages.filter((s) => s.id !== id) });
  return (
    <div>
      <div className="flex items-center justify-between"><div className={lbl}>Stages · {def.stages.length}</div><button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Stage</button></div>
      <div className="mt-1 space-y-1.5">
        {def.stages.map((s, i) => (
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
            <div className="mt-1"><StageParams s={s} def={def} patch={(pp) => patchParams(s.id, pp)} /></div>
            <div className="mt-1 flex items-center gap-1.5">
              <StageGizmoControls def={def} s={s} />
              <MoveButtons index={i} count={def.stages.length} onMove={(d) => update({ stages: moveItem(def.stages, i, d) })} />
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
  return (
    <div>
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
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <MoveButtons index={i} count={def.cameraShots.length} onMove={(d) => update({ cameraShots: moveItem(def.cameraShots, i, d) })} />
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
  const patch = (id: string, p: Partial<TransformationEffectTrack>) => { update({ effectTracks: def.effectTracks.map((s) => (s.id === id ? { ...s, ...p } : s)) }); const fx = def.effectTracks.find((s) => s.id === id); useTransformationPreviewStore.getState().scrub(p.startTime ?? fx?.startTime ?? 0); };
  const remove = (id: string) => update({ effectTracks: def.effectTracks.filter((s) => s.id !== id) });
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
              <NumRow label="Scale" value={s.scale ?? 1} step={0.1} onChange={(v) => patch(s.id, { scale: v })} />
            </div>
            <ColorRow label="Colour" value={s.color ?? '#ffffff'} onChange={(v) => patch(s.id, { color: v })} />
            {s.type === 'ghost-burst' && (
              <div className="mt-1 grid grid-cols-2 gap-1.5 rounded bg-slate-950/40 p-1.5">
                <NumRow label="Clone count" value={s.ghostCount ?? s.repeat ?? 6} step={1} min={1} onChange={(v) => patch(s.id, { ghostCount: v })} />
                <NumRow label="Clone spread" value={s.ghostSpread ?? 14} step={1} min={0} onChange={(v) => patch(s.id, { ghostSpread: v })} />
                <div className="col-span-2"><Check label="Persist until track ends" checked={s.ghostPersist ?? true} onChange={(v) => patch(s.id, { ghostPersist: v })} /></div>
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5">
              <MoveButtons index={i} count={def.effectTracks.length} onMove={(d) => update({ effectTracks: moveItem(def.effectTracks, i, d) })} />
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
