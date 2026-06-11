import { WorldSkyAmbience } from './WorldSkyAmbience';
import { SKY_PRESET_COLORS } from './skyPresets';
import { getActiveRoute } from './worldRoute';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useFlightPreviewStore } from '../../../stores/game/flightPreviewStore';

// Applies the active route's editorEnvironment to the world-flight ambience: a named sky preset fills the
// base sky/fog colours, then any manual colour / fog / light fields override per-field. Subscribes to the
// route store so editing the 🌦 Environment tab recolours the sky live. An active ENVIRONMENT CUE (flight cue
// timeline) takes top priority — it recolours the real sky + adds haze at that point of the route.
export const WorldFlightEnvironment = () => {
  useEditorRouteStore((s) => s.items); // reactive: re-resolve when routes are edited
  const cueEnv = useFlightPreviewStore((s) => s.activeEnv); // sparse — changes only when crossing a cue
  const env = getActiveRoute()?.editorEnvironment;
  const preset = env?.skyPreset ? SKY_PRESET_COLORS[env.skyPreset] : undefined;
  // Map a cue's haze (0..1) onto a far/soft fog so it never whites out (far pulls in as haze rises).
  const haze = cueEnv?.fogDensity ?? 0;
  const cueFog = haze > 0 ? { color: cueEnv?.skyBottom ?? env?.fogColor ?? preset?.fog, near: 400, far: 8000 - haze * 6000 } : null;

  return (
    <WorldSkyAmbience
      top={cueEnv?.skyTop ?? env?.skyTop ?? preset?.top}
      bottom={cueEnv?.skyBottom ?? env?.skyBottom ?? preset?.bottom}
      fog={cueFog?.color ?? env?.fogColor ?? preset?.fog}
      fogNear={cueFog?.near ?? env?.fogNear}
      fogFar={cueFog?.far ?? env?.fogFar}
      ambient={env?.ambientIntensity}
      sun={env?.sunIntensity}
    />
  );
};
