import { useUiStore } from '../../stores/uiStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';

export const ModeIndicatorBadge = () => {
  const editMode = useUiStore((state) => state.editMode);
  const demo = useDemoModeStore((state) => state.enabled);
  const label = editMode ? 'Edit Mode' : demo ? 'Demo Mode' : 'Play Mode';
  return <span className="rounded border border-slate-600 bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-slate-200">{label}</span>;
};
