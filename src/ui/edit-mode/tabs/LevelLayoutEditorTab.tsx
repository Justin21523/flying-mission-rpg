import { useLevelLayoutStore } from '../../../stores/useLevelEditorStore';

export const LevelLayoutEditorTab = () => {
  const layouts = useLevelLayoutStore((state) => state.items);
  return <div className="space-y-2 text-xs text-slate-300">{layouts.map((layout) => <div key={layout.id} className="rounded border border-slate-700 p-2"><b>{layout.name}</b><br />{layout.layoutType}<br />Segments: {layout.segmentIds.join(' → ')}</div>)}</div>;
};
