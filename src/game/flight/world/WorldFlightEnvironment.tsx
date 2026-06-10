import { WorldSkyAmbience } from './WorldSkyAmbience';
import { getActiveRoute } from './worldRoute';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';

// Applies the active route's editorEnvironment (sky colours) to the world-flight ambience. Subscribes to the
// route store so editing the 🌦 Environment tab recolours the sky live. Cloud density / weather overrides
// ride on the same route data (consumed by CloudField via the route).
export const WorldFlightEnvironment = () => {
  useEditorRouteStore((s) => s.items); // reactive: re-resolve when routes are edited
  const env = getActiveRoute()?.editorEnvironment;
  return <WorldSkyAmbience top={env?.skyTop} bottom={env?.skyBottom} />;
};
