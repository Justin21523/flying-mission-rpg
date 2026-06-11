import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorRegionStore, getEditorRegion } from '../../../stores/game/editorRegionStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useUiStore } from '../../../stores/uiStore';
import type { Region } from '../../../types/game/region';
import type { WorldLocation } from '../../../types/game/world';
import { WorldMapPanel } from '../../game/WorldMapPanel';
import { Check, lbl, MoveButtons, FocusButton } from '../editorShared';
import { TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';

// 🗺 Map — the managed map system. Drag location pins on the 2D map (writes mapPosition live), group locations
// into colour-coded regions, lock/unlock them, and see each location's missions + NPCs at a glance.
const RegionsList = () => {
  const regions = useEditorRegionStore((s) => s.items);
  const add = () => useEditorRegionStore.getState().upsert({ id: `reg_${nanoid(6)}`, name: 'New Region', color: '#a78bfa', order: regions.length });
  const update = (id: string, p: Partial<Region>) => useEditorRegionStore.getState().update(id, p);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Regions · {regions.length}</div>
        <button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Region</button>
      </div>
      <div className="mt-1 space-y-1.5">
        {regions.map((r, i) => (
          <div key={r.id} className="rounded border border-slate-800 bg-slate-900/55 p-1.5">
            <div className="mb-1 flex items-center gap-1">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.color }} />
              <span className="flex-1 truncate text-[11px] font-semibold text-slate-200">{r.name}</span>
              <MoveButtons index={i} count={regions.length} onMove={(d) => useEditorRegionStore.getState().reorder(r.id, d)} />
              <button onClick={() => useEditorRegionStore.getState().remove(r.id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">🗑</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <TextRow label="Name" value={r.name} onChange={(v) => update(r.id, { name: v })} />
              <ColorRow label="Colour" value={r.color} onChange={(v) => update(r.id, { color: v })} />
            </div>
            <Check label="Unlocked (available in Mission Control)" checked={r.unlocked !== false} onChange={(v) => update(r.id, { unlocked: v })} />
          </div>
        ))}
        {regions.length === 0 && <div className="text-[11px] text-slate-500">No regions — ➕ to add one.</div>}
      </div>
    </div>
  );
};

const LocationPanel = ({ loc }: { loc: WorldLocation }) => {
  const regions = useEditorRegionStore((s) => s.items);
  const missions = useEditorMissionStore((s) => s.items).filter((m) => m.locationId === loc.id);
  const npcs = useEditorGameNpcStore((s) => s.items).filter((n) => n.locationId === loc.id);
  const update = (p: Partial<WorldLocation>) => useEditorLocationStore.getState().update(loc.id, p);
  const goto = (tab: string) => useUiStore.getState().setEditorHubTab(tab);
  return (
    <div className="rounded border border-sky-700/40 bg-sky-950/15 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-bold text-sky-100">{loc.name}{loc.isBase ? ' ★' : ''}</span>
        <FocusButton position={[loc.coordinate.x, loc.coordinate.y, loc.coordinate.z]} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <SelectRow label="Region" value={loc.regionId ?? ''} options={[{ value: '', label: '(unassigned)' }, ...regions.map((r) => ({ value: r.id, label: r.name }))]} onChange={(v) => update({ regionId: v || undefined })} />
        <NumRow label="Order in region" value={loc.order ?? 0} step={1} onChange={(v) => update({ order: v })} />
      </div>
      <Check label="Unlocked (available in Mission Control)" checked={loc.unlocked !== false} onChange={(v) => update({ unlocked: v })} />
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <div className="rounded bg-slate-900/55 p-1.5">
          <div className="flex items-center justify-between"><span className={lbl}>Missions · {missions.length}</span><button onClick={() => goto('gmission')} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-sky-200 hover:bg-slate-700">→ 🎯</button></div>
          <ul className="mt-0.5 space-y-0.5 text-[11px] text-slate-300">{missions.map((m) => <li key={m.id} className="truncate">• {m.name}</li>)}{missions.length === 0 && <li className="text-slate-500">none</li>}</ul>
        </div>
        <div className="rounded bg-slate-900/55 p-1.5">
          <div className="flex items-center justify-between"><span className={lbl}>NPCs · {npcs.length}</span><button onClick={() => goto('gnpc')} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-sky-200 hover:bg-slate-700">→ 🧑</button></div>
          <ul className="mt-0.5 space-y-0.5 text-[11px] text-slate-300">{npcs.map((n) => <li key={n.id} className="truncate">• {n.name}</li>)}{npcs.length === 0 && <li className="text-slate-500">none</li>}</ul>
        </div>
      </div>
    </div>
  );
};

export const MapEditorTab = () => {
  const locations = useEditorLocationStore((s) => s.items);
  const missions = useEditorMissionStore((s) => s.items);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = locations.find((l) => l.id === selId) ?? null;
  const regionColorFor = (l: WorldLocation) => getEditorRegion(l.regionId)?.color;
  const missionCountFor = (id: string) => missions.filter((m) => m.locationId === id).length;
  return (
    <div className="space-y-2 text-xs">
      <p className="text-[10px] text-slate-500">Drag pins to move locations on the map (writes their map position live). Pins are coloured by region. Select a pin to assign its region, lock state and see its missions/NPCs.</p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_1fr]">
        <WorldMapPanel
          activeLocationId={null}
          selectedId={selId}
          onPick={setSelId}
          editable
          onMovePin={(id, x, y) => useEditorLocationStore.getState().update(id, { mapPosition: { x, y } })}
          regionColorFor={regionColorFor}
          missionCountFor={missionCountFor}
        />
        <div className="min-w-0 space-y-2">
          <RegionsList />
          {sel ? <LocationPanel loc={sel} /> : <div className="rounded border border-slate-800 bg-slate-900/45 p-2 text-[11px] text-slate-500">Select a pin on the map to edit its region / lock / links.</div>}
        </div>
      </div>
    </div>
  );
};
