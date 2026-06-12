import { effectiveQualityPreset } from '../performance/QualityPresetController';

// Post-13 — distance LOD helpers. `lodForDistance` is pure (tested); the quality multiplier lets lower
// quality cull/simplify distant content sooner. A tiny shared counter reports how much is currently culled
// (surfaced as a Runtime Health gauge). Flight/transformation are NOT driven by this.
export type LodLevel = 'high' | 'low' | 'culled';

export interface LodThresholds { highWithin: number; cullBeyond: number }

export function lodForDistance(distance: number, t: LodThresholds): LodLevel {
  if (distance > t.cullBeyond) return 'culled';
  if (distance > t.highWithin) return 'low';
  return 'high';
}

/** Cull/LOD distance scale from the active quality tier (low sees less far, ultra a bit more). Pure-ish. */
export function qualityCullMultiplier(): number {
  switch (effectiveQualityPreset().renderLevel) {
    case 'low': return 0.7;
    case 'high': return 1.15;
    default: return 1;
  }
}

export function qualityCullRadius(baseRadius: number): number {
  return baseRadius * qualityCullMultiplier();
}

// Shared "currently culled" counter (best-effort telemetry for the health panel).
let culled = 0;
export function incCulled(): void { culled += 1; }
export function decCulled(): void { culled = Math.max(0, culled - 1); }
export function getCulledCount(): number { return culled; }
export function resetCulled(): void { culled = 0; }
