import { useLevelSegmentStore } from '../../../stores/useLevelEditorStore';

export const LevelSegmentEditorTab = () => {
  const segments = useLevelSegmentStore((state) => state.items);
  return <div className="space-y-1 text-xs text-slate-300">{segments.map((segment) => <div key={segment.id} className="rounded border border-slate-700 p-2">{segment.order}. <b>{segment.name}</b> · {segment.layoutId}</div>)}</div>;
};
