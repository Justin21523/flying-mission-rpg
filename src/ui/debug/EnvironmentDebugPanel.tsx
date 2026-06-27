import { previewEnvironmentTheme } from '../../game/environments/EnvironmentThemeDirector';
import { areStageHazardsEnabled, setStageHazardsEnabled } from '../../game/environments/EnvironmentHazardDirector';
import { useEnvironmentThemeStore } from '../../stores/useEnvironmentEditorStore';
import { Btn, panel } from '../game/screenChrome';

export const EnvironmentDebugPanel = () => {
  const themes = useEnvironmentThemeStore((state) => state.items);
  return (
    <div className={`${panel} fixed left-3 top-24 z-50 w-72 p-3 text-xs`}>
      <div className="mb-2 font-bold text-sky-200">Environment Debug</div>
      <Btn tone="ghost" onClick={() => setStageHazardsEnabled(!areStageHazardsEnabled())}>Toggle hazards</Btn>
      {themes.map((theme) => <button key={theme.id} className="mt-1 block text-left text-slate-300 hover:text-white" onClick={() => previewEnvironmentTheme(theme.id)}>{theme.name}</button>)}
    </div>
  );
};
