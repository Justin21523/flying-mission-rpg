import { useMemo, useState } from 'react';
import { MODEL_ASSET_LIST } from '../../../data/modelLibrary';
import { useGameStore } from '../../../stores/game/useGameStore';
import { editorSpawn, useSceneEditStore } from '../../../stores/sceneEditStore';
import { useEditorDestinationStore } from '../../../stores/game/editorDestinationStore';
import { destinationPartKey } from '../../../game/destination/destinationPartKey';
import type { DestinationPartKind } from '../../../types/game/destination';
import { makeMissionAreaPart, MISSION_AREA_ID, MISSION_PART_PRESETS } from './missionAreaQuickAdd';

const DESTINATION_PHASES = new Set(['DESCENT', 'LANDING', 'NPC_GREETING', 'MISSION_GAMEPLAY', 'SUPPORT_SELECTION', 'MISSION_COMPLETE']);

export const MissionAreaQuickAddOverlay = () => {
  const phase = useGameStore((s) => s.phase);
  const addModel = useSceneEditStore((s) => s.addModel);
  const upsertPart = useEditorDestinationStore((s) => s.upsert);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState('');

  const models = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return MODEL_ASSET_LIST
      .filter((asset) => !q || asset.label.toLowerCase().includes(q) || asset.id.toLowerCase().includes(q))
      .slice(0, 28);
  }, [filter]);

  if (!DESTINATION_PHASES.has(phase)) return null;

  const addPart = (kind: DestinationPartKind) => {
    const part = makeMissionAreaPart(kind, [editorSpawn.x, editorSpawn.y, editorSpawn.z]);
    upsertPart(part);
    useSceneEditStore.getState().requestSelect(destinationPartKey(part.id));
  };

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-[71] w-80 rounded-xl border border-emerald-700/50 bg-slate-950/90 p-3 text-slate-100 shadow-2xl backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-emerald-100">Mission Area Quick Add</span>
        <button onClick={() => setCollapsed((v) => !v)} className="rounded px-1.5 text-sm text-slate-400 hover:bg-slate-800">{collapsed ? '▸' : '▾'}</button>
      </div>
      {!collapsed && (
        <div className="space-y-2">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mission objects</div>
            <div className="grid grid-cols-2 gap-1">
              {MISSION_PART_PRESETS.map((preset) => (
                <button key={preset.kind} onClick={() => addPart(preset.kind)} className="truncate rounded bg-emerald-700/25 px-2 py-1 text-left text-[11px] text-emerald-100 hover:bg-emerald-700/40">
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Environment models</span>
              <span className="text-[10px] text-slate-500">{models.length}</span>
            </div>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="search models..." className="mb-1.5 w-full rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100" />
            <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
              {models.map((asset) => (
                <button key={asset.id} onClick={() => addModel(MISSION_AREA_ID, asset.id, 1)} className="block w-full truncate rounded px-2 py-1 text-left text-[11px] text-slate-300 hover:bg-violet-500/20 hover:text-violet-100">
                  {asset.label}
                </button>
              ))}
              {models.length === 0 && <div className="rounded bg-slate-900/60 px-2 py-2 text-[11px] text-slate-500">No matching models.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
