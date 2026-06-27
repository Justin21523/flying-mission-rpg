import type { StageDefinition } from '../../types/stageTypes';
import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';

export const StageBriefingMapPreview = ({ stage }: { stage: StageDefinition }) => {
  const theme = getEnvironmentTheme(stage.environmentThemeId);
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
      <div className="text-[10px] font-bold uppercase text-slate-500">Location Preview</div>
      <div className="mt-2 aspect-[16/9] rounded-md border border-slate-800 bg-gradient-to-br from-slate-900 via-sky-950/50 to-emerald-950/30 p-3">
        <div className="text-lg font-black text-slate-100">{theme?.name ?? stage.environmentThemeId}</div>
        <div className="mt-1 text-xs text-slate-300">{theme?.themeType ?? stage.locationId}</div>
        <div className="mt-4 grid grid-cols-3 gap-1 text-[10px] text-slate-300">
          <span className="rounded bg-slate-900/70 px-2 py-1">Sky {theme?.sky.preset ?? 'custom'}</span>
          <span className="rounded bg-slate-900/70 px-2 py-1">Weather {theme?.weather?.type ?? 'none'}</span>
          <span className="rounded bg-slate-900/70 px-2 py-1">Layout {stage.levelLayoutId}</span>
        </div>
      </div>
    </div>
  );
};
