import { WorldSkyAmbience } from './WorldSkyAmbience';
import { SKY_PRESET_COLORS } from './skyPresets';
import { getActiveRoute } from './worldRoute';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';

// Applies the active route's editorEnvironment to the world-flight ambience: a named sky preset fills the
// base sky/fog colours, then any manual colour / fog / light fields override per-field. Subscribes to the
// route store so editing the 🌦 Environment tab recolours the sky live.
export const WorldFlightEnvironment = () => {
  useEditorRouteStore((s) => s.items); // reactive: re-resolve when routes are edited
  const env = getActiveRoute()?.editorEnvironment;
  const preset = env?.skyPreset ? SKY_PRESET_COLORS[env.skyPreset] : undefined;

  return (
    <WorldSkyAmbience
      top={env?.skyTop ?? preset?.top}
      bottom={env?.skyBottom ?? preset?.bottom}
      fog={env?.fogColor ?? preset?.fog}
      fogNear={env?.fogNear}
      fogFar={env?.fogFar}
      ambient={env?.ambientIntensity}
      sun={env?.sunIntensity}
    />
  );
};
