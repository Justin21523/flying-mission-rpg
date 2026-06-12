import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../stores/audioStore';
import { useFlightStore } from '../../stores/game/useFlightStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { getEditorRoute } from '../../stores/game/editorRouteStore';
import { effectiveQualityPreset } from '../../game/performance/QualityPresetController';
import { activeFlightPolish } from '../../game/flight/effects/FlightEffectQualityController';

// Batch 12 — route color grade via the SAFE TINT fallback (no EffectComposer in world flight, which would
// white-out the unlit gradient sky). A subtle full-screen DOM tint, blended over the canvas, driven by the
// active route's polish preset. Shown only during world-flight phases and only when color grading is on;
// damped under reduce-motion. Pointer-events-none so it never blocks input.

const WORLD_FLIGHT_PHASES = new Set(['CLOUD_ASCENT', 'WORLD_FLIGHT', 'DESTINATION_APPROACH']);

export const RouteColorGradeOverlay = () => {
  const phase = useGameStore((s) => s.phase);
  const tier = useGraphicsSettingsStore((s) => s.tier);
  const customPreset = useGraphicsSettingsStore((s) => s.customPreset);
  const reduceMotion = useAudioStore((s) => s.reduceMotion);
  // currentRouteId drives which tint we use; subscribe so it updates on route change.
  const routeId = useFlightStore((s) => s.currentRouteId);

  void tier; void customPreset; // referenced to re-render on quality changes
  if (!WORLD_FLIGHT_PHASES.has(phase)) return null;
  const preset = effectiveQualityPreset();
  if (!preset.colorGradingEnabled) return null;

  const route = routeId ? getEditorRoute(routeId) : undefined;
  void route;
  const tint = activeFlightPolish().colorGradeTint;
  // Keep it subtle; reduce-motion lowers it further so it never pulses or distracts.
  const alpha = reduceMotion ? 0.06 : 0.14;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5]"
      style={{ backgroundColor: tint, opacity: alpha, mixBlendMode: 'soft-light' }}
    />
  );
};
