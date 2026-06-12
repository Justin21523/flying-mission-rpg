import type { QualityPreset, EffectQuality } from '../../../types/game/quality';
import type { FlightPolishPreset } from '../../../types/game/flightPolish';
import { effectiveQualityPreset } from '../../performance/QualityPresetController';
import { useGraphicsSettingsStore } from '../../../stores/graphicsSettingsStore';
import { useAudioStore } from '../../../stores/audioStore';
import { useFlightStore } from '../../../stores/game/useFlightStore';
import { getEditorRoute } from '../../../stores/game/editorRouteStore';
import { getEditorFlightPolishPreset } from '../../../stores/game/editorFlightPolishStore';
import { SUNNY_FLIGHT_POLISH, SKY_TO_FLIGHT_POLISH } from './FlightEffectPresets';
import { validateFlightPolish } from './flightPolishSchema';

// Batch 12 — single resolver for "what flight effects render right now and how strong". Pure `compute`
// (quality + polish + reduce-motion → config) is unit-tested; the store-reading accessors/hook layer on
// top. SpeedField / CloudBreak / RouteColorGrade read this instead of hardcoding behaviour, so quality
// settings and reduce-motion take effect without per-frame allocations.

export interface FlightEffectConfig {
  speedLines: boolean;
  speedLineIntensity: number;     // 0..1 multiplier on opacity/length
  speedLineCount: number;
  engineTrail: boolean;
  engineTrailColor: string;
  cloudBreak: boolean;
  cloudBreakParticles: number;
  airDistortion: boolean;
  colorGrade: boolean;
  colorGradeTint: string;
  cloudDensityMultiplier: number;
}

const PARTICLE_SCALE: Record<EffectQuality, number> = { off: 0, low: 0.4, medium: 0.7, high: 1 };

/** Pure combine of quality + polish + reduce-motion. */
export function computeFlightEffectConfig(quality: QualityPreset, polish: FlightPolishPreset, reduceMotion: boolean): FlightEffectConfig {
  const particleScale = PARTICLE_SCALE[quality.particleQuality];
  const cloudScale = quality.cloudQuality === 'low' ? 0.6 : quality.cloudQuality === 'medium' ? 0.85 : 1;
  return {
    speedLines: quality.speedLinesEnabled && !reduceMotion,
    speedLineIntensity: reduceMotion ? 0 : polish.speedLine.opacity,
    speedLineCount: Math.round(polish.speedLine.lineCount * Math.max(0.3, particleScale)),
    engineTrail: particleScale > 0,
    engineTrailColor: polish.engineTrail.color,
    cloudBreak: particleScale > 0,
    cloudBreakParticles: Math.round(polish.cloudBreak.particleCount * particleScale * quality.objectPoolBudgetMultiplier),
    airDistortion: quality.airDistortionEnabled && !reduceMotion,
    colorGrade: quality.colorGradingEnabled,
    colorGradeTint: polish.colorGradeTint,
    cloudDensityMultiplier: polish.cloudDensityMultiplier * cloudScale,
  };
}

/** Resolve the active flight polish preset from the current route's sky preset (editor → seed). */
export function activeFlightPolish(): FlightPolishPreset {
  const routeId = useFlightStore.getState().currentRouteId;
  const route = routeId ? getEditorRoute(routeId) : undefined;
  const sky = route?.editorEnvironment?.skyPreset ?? 'clear';
  const polishId = SKY_TO_FLIGHT_POLISH[sky] ?? SUNNY_FLIGHT_POLISH.id;
  const authored = getEditorFlightPolishPreset(polishId);
  if (authored && validateFlightPolish(authored).ok) return authored;
  return SUNNY_FLIGHT_POLISH;
}

/** The effective flight-effect config right now. Non-hook; safe to call from effects (not per-frame). */
export function getFlightEffectConfig(): FlightEffectConfig {
  const reduceMotion = useAudioStore.getState().reduceMotion;
  return computeFlightEffectConfig(effectiveQualityPreset(), activeFlightPolish(), reduceMotion);
}

// A cheap subscription helper effects can use to recompute only when settings change (not every frame).
type Listener = () => void;
const listeners = new Set<Listener>();
let wired = false;
function ensureWired(): void {
  if (wired) return;
  wired = true;
  const fire = (): void => listeners.forEach((l) => l());
  useGraphicsSettingsStore.subscribe(fire);
  useAudioStore.subscribe(fire);
  useFlightStore.subscribe(fire);
}
export function onFlightEffectConfigChange(fn: Listener): () => void {
  ensureWired();
  listeners.add(fn);
  return () => listeners.delete(fn);
}
