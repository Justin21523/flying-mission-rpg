// Batch 12 — authored flight-visual polish. A polish preset tunes the look of the (already-existing)
// flight effects per route mood (sunny / storm / sunset…). The FlightEffectQualityController combines a
// polish preset with the active quality preset + reduce-motion to decide what actually renders.

export interface SpeedLinePolish {
  color: string;
  minSpeedForLines: number;   // speedNorm below which no lines show
  maxIntensitySpeed: number;  // speedNorm at which lines are fully intense
  lineCount: number;          // >= 0
  lineLength: number;
  opacity: number;            // 0..1
  radialSpread: number;
  boostMultiplier: number;
}

export interface EngineTrailPolish {
  color: string;
  length: number;
}

export interface CloudBreakPolish {
  particleCount: number;      // >= 0
  burstScale: number;         // >= 0
}

export interface FlightPolishPreset {
  id: string;
  label: string;
  speedLine: SpeedLinePolish;
  engineTrail: EngineTrailPolish;
  cloudBreak: CloudBreakPolish;
  weatherTransitionSpeed: number; // seconds for a smooth weather/sky transition
  colorGradeTint: string;         // hex tint used by the safe-tint route color grade overlay
  cloudDensityMultiplier: number; // >= 0
  landmarkVisibilityDistance: number; // > 0 (reserved for the deferred distant-landmark renderer)
}
