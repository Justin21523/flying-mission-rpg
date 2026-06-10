import { nanoid } from 'nanoid';
import { useEditorBaseLayoutStore } from '../../../stores/game/editorBaseLayoutStore';
import { BASE_PART_KINDS, BASE_COLLISIONS } from '../../../types/game/base';
import type { BasePart } from '../../../types/game/base';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';

const makeNew = (): BasePart => ({
  id: `base_${nanoid(6)}`,
  kind: 'wall',
  label: 'New Part',
  position: [0, 1, 0],
  rotation: [0, 0, 0],
  scale: 1,
  size: [2, 2, 2],
  color: '#64748b',
  collision: 'cuboid',
});

// 🏗 Base — edit the home-base layout. Position is also gizmo-movable in 3D (DataBackedPlacement); these
// fields stay in sync. Set an Asset id (kit model-library id, e.g. super-wings/...) to use a real model.
export const BaseLayoutEditorTab = () => (
  <CollectionEditor<BasePart>
    title="Base Layout"
    store={useEditorBaseLayoutStore}
    makeNew={makeNew}
    getLabel={(p) => `${p.label} · ${p.kind}`}
    renderFields={(p, update) => (
      <>
        <TextRow label="Label" value={p.label} onChange={(v) => update({ label: v })} />
        <SelectRow label="Kind" value={p.kind} options={BASE_PART_KINDS.map((k) => ({ value: k, label: k }))} onChange={(v) => update({ kind: v as BasePart['kind'] })} />
        <TextRow label="Model asset id (empty = box)" value={p.assetId ?? ''} onChange={(v) => update({ assetId: v || undefined })} />
        <NumRow label="Model target size" value={p.modelTarget ?? 0} step={1} min={0} onChange={(v) => update({ modelTarget: v || undefined })} />
        <div className="grid grid-cols-3 gap-2">
          <NumRow label="Pos X" value={p.position[0]} step={0.5} onChange={(v) => update({ position: [v, p.position[1], p.position[2]] })} />
          <NumRow label="Pos Y" value={p.position[1]} step={0.5} onChange={(v) => update({ position: [p.position[0], v, p.position[2]] })} />
          <NumRow label="Pos Z" value={p.position[2]} step={0.5} onChange={(v) => update({ position: [p.position[0], p.position[1], v] })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <NumRow label="Rot X" value={p.rotation[0]} step={0.1} onChange={(v) => update({ rotation: [v, p.rotation[1], p.rotation[2]] })} />
          <NumRow label="Rot Y" value={p.rotation[1]} step={0.1} onChange={(v) => update({ rotation: [p.rotation[0], v, p.rotation[2]] })} />
          <NumRow label="Rot Z" value={p.rotation[2]} step={0.1} onChange={(v) => update({ rotation: [p.rotation[0], p.rotation[1], v] })} />
        </div>
        <NumRow label="Scale" value={p.scale} step={0.1} min={0.05} onChange={(v) => update({ scale: v })} />
        <div className="grid grid-cols-3 gap-2">
          <NumRow label="Size X" value={p.size[0]} step={0.5} onChange={(v) => update({ size: [v, p.size[1], p.size[2]] })} />
          <NumRow label="Size Y" value={p.size[1]} step={0.5} onChange={(v) => update({ size: [p.size[0], v, p.size[2]] })} />
          <NumRow label="Size Z" value={p.size[2]} step={0.5} onChange={(v) => update({ size: [p.size[0], p.size[1], v] })} />
        </div>
        <ColorRow label="Colour" value={p.color} onChange={(v) => update({ color: v })} />
        <SelectRow label="Collision" value={p.collision} options={BASE_COLLISIONS.map((c) => ({ value: c, label: c }))} onChange={(v) => update({ collision: v as BasePart['collision'] })} />
      </>
    )}
  />
);
