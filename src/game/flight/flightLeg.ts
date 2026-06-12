import { WORLD_PATH_ID } from '../../data/game/worldRoutes';
import type { FlightRoute } from '../../types/game/flight';

export type FlightLegKind = 'outbound' | 'return';
export type FlightLegDirection = 'forward' | 'reverse';

export interface ResolvedFlightLeg {
  kind: FlightLegKind;
  pathId: string;
  cueKey: string;
  direction: FlightLegDirection;
}

export function sampleUForDirection(u: number, direction: FlightLegDirection): number {
  const clamped = u < 0 ? 0 : u > 1 ? 1 : u;
  return direction === 'reverse' ? 1 - clamped : clamped;
}

export function resolveFlightLeg(route: FlightRoute | undefined, kind: FlightLegKind): ResolvedFlightLeg {
  const outboundPathId = route?.pathId?.trim() || WORLD_PATH_ID;
  if (kind === 'outbound') {
    return {
      kind,
      pathId: outboundPathId,
      cueKey: `${outboundPathId}:outbound`,
      direction: 'forward',
    };
  }

  const returnPathId = route?.returnPathId?.trim() || outboundPathId;
  const explicitDirection = route?.returnPathDirection ?? (route?.returnPathId?.trim() ? 'forward' : 'reverse');
  return {
    kind,
    pathId: returnPathId,
    cueKey: `${returnPathId}:return:${explicitDirection}`,
    direction: explicitDirection,
  };
}
