import { getEnvironmentTheme } from '../../stores/useEnvironmentEditorStore';
import { getStagePolishPreset } from '../../stores/useStageContentEditorStore';

export const StageThemePreview = ({ stageId, themeId }: { stageId: string; themeId: string }) => {
  const theme = getEnvironmentTheme(themeId);
  const polish = getStagePolishPreset(stageId);
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-300">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-600 bg-slate-900">{polish?.themeIcon ?? '◇'}</span>
      <span>{theme?.name ?? themeId}</span>
    </div>
  );
};
