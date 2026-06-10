// Dev commands from the WorldFlightDebugPanel to the RouteFollower (applied next frame). Non-reactive.
export const worldFlightDev = {
  progressDelta: 0, // added to route u next frame (e.g. +0.1)
  jumpU: -1, // if >= 0, snap route u here next frame
};

export function devAddProgress(d: number): void {
  worldFlightDev.progressDelta += d;
}
export function devJumpU(u: number): void {
  worldFlightDev.jumpU = u;
}
