// Pure safe-landing evaluation (no R3F → unit-testable). Speeds are absolute magnitudes; zones come from
// the editable destination parts (landing_zone / safe_zone with radius). Quality is recoverable — unsafe
// landings bounce and retry, never crash (child-friendly rule).
export interface LandingZoneInput {
  id: string;
  x: number;
  z: number;
  radius: number;
  kind: 'landing_zone' | 'safe_zone';
}

export interface LandingInput {
  x: number;
  z: number;
  verticalSpeed: number; // downward, positive
  horizontalSpeed: number;
  zones: LandingZoneInput[];
  boundaryHalf?: { x: number; z: number } | null; // half-extents of the play area (centred at origin)
}

export interface LandingEvaluation {
  safe: boolean;
  quality: 'perfect' | 'good' | 'rough' | 'unsafe';
  reasons: string[];
  verticalSpeed: number;
  horizontalSpeed: number;
  zoneId?: string;
}

// Editable-ish thresholds (kept here as named constants; zones/radii are the author-editable part).
export const LANDING_V_PERFECT = 3;
export const LANDING_V_GOOD = 6;
export const LANDING_V_ROUGH = 12;
export const LANDING_H_PERFECT = 2.5;
export const LANDING_H_GOOD = 5;
export const LANDING_H_ROUGH = 9;

export function zoneAt(x: number, z: number, zones: LandingZoneInput[]): LandingZoneInput | undefined {
  let best: LandingZoneInput | undefined;
  let bestD = Infinity;
  for (const zn of zones) {
    const d = Math.hypot(x - zn.x, z - zn.z);
    if (d <= zn.radius && d < bestD) { best = zn; bestD = d; }
  }
  return best;
}

export function evaluateLanding(input: LandingInput): LandingEvaluation {
  const reasons: string[] = [];
  const v = Math.abs(input.verticalSpeed);
  const h = Math.abs(input.horizontalSpeed);

  const outOfBounds = !!input.boundaryHalf && (Math.abs(input.x) > input.boundaryHalf.x || Math.abs(input.z) > input.boundaryHalf.z);
  if (outOfBounds) reasons.push('Outside the destination boundary.');

  const zone = zoneAt(input.x, input.z, input.zones);
  if (!zone) reasons.push('Not over a landing or safe zone.');
  if (v > LANDING_V_ROUGH) reasons.push(`Falling too fast (${v.toFixed(1)} > ${LANDING_V_ROUGH}).`);
  else if (v > LANDING_V_GOOD) reasons.push(`Vertical speed is high (${v.toFixed(1)}).`);
  if (h > LANDING_H_ROUGH) reasons.push(`Moving sideways too fast (${h.toFixed(1)} > ${LANDING_H_ROUGH}).`);
  else if (h > LANDING_H_GOOD) reasons.push(`Horizontal speed is high (${h.toFixed(1)}).`);

  let quality: LandingEvaluation['quality'];
  if (outOfBounds || v > LANDING_V_ROUGH || h > LANDING_H_ROUGH) quality = 'unsafe';
  else if (zone && v <= LANDING_V_PERFECT && h <= LANDING_H_PERFECT) quality = 'perfect';
  else if (zone && v <= LANDING_V_GOOD && h <= LANDING_H_GOOD) quality = 'good';
  else quality = 'rough'; // touched down survivably, but off-zone or fast-ish

  return { safe: quality !== 'unsafe', quality, reasons, verticalSpeed: v, horizontalSpeed: h, zoneId: zone?.id };
}
