import { nanoid } from 'nanoid';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { LOCATION_KINDS } from '../../../types/game/world';
import type { WorldLocation } from '../../../types/game/world';
import { Check } from '../editorShared';
import { CollectionEditor, TextRow, NumRow, SelectRow, ConfidenceRow } from './CollectionEditor';

const makeNew = (): WorldLocation => ({
  id: `loc_${nanoid(6)}`,
  codename: 'New Place',
  name: 'New Location',
  sourceConfidence: 'GameAdaptation',
  kind: 'city',
  isBase: false,
  description: '',
  coordinate: { x: 0, y: 0, z: 0 },
  mapPosition: { x: 50, y: 50 },
  environment: '',
});

// 🌍 Locations — the world's base + destinations (3D anchor + 2D map position for the Batch 2 map).
export const LocationEditorTab = () => (
  <CollectionEditor<WorldLocation>
    title="Locations"
    store={useEditorLocationStore}
    makeNew={makeNew}
    getLabel={(l) => `${l.name}${l.isBase ? ' ★' : ''}`}
    renderFields={(l, update) => (
      <>
        <TextRow label="Codename" value={l.codename} onChange={(v) => update({ codename: v })} />
        <TextRow label="Name" value={l.name} onChange={(v) => update({ name: v })} />
        <SelectRow
          label="Kind"
          value={l.kind}
          options={LOCATION_KINDS.map((k) => ({ value: k, label: k }))}
          onChange={(v) => update({ kind: v as WorldLocation['kind'] })}
        />
        <Check label="Is home base" checked={l.isBase} onChange={(v) => update({ isBase: v })} />
        <TextRow label="Description" area value={l.description} onChange={(v) => update({ description: v })} />
        <ConfidenceRow value={l.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
        <div className="grid grid-cols-3 gap-2">
          <NumRow label="World x" value={l.coordinate.x} step={10} onChange={(v) => update({ coordinate: { ...l.coordinate, x: v } })} />
          <NumRow label="World y" value={l.coordinate.y} step={10} onChange={(v) => update({ coordinate: { ...l.coordinate, y: v } })} />
          <NumRow label="World z" value={l.coordinate.z} step={10} onChange={(v) => update({ coordinate: { ...l.coordinate, z: v } })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumRow label="Map x (0-100)" value={l.mapPosition.x} min={0} max={100} onChange={(v) => update({ mapPosition: { ...l.mapPosition, x: v } })} />
          <NumRow label="Map y (0-100)" value={l.mapPosition.y} min={0} max={100} onChange={(v) => update({ mapPosition: { ...l.mapPosition, y: v } })} />
        </div>
        <TextRow label="Environment" value={l.environment ?? ''} onChange={(v) => update({ environment: v || undefined })} />
      </>
    )}
  />
);
