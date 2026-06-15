// POLI — "focus the edit camera here" bus. Editor 🎯 buttons and add-actions call focusCameraOn(pos); the
// FollowCamera (edit mode) pans its OrbitControls target to that point so a selected / newly-added object —
// even one far away or off-screen — jumps into view with its gizmo ready. Plain module object, mutated
// outside React.
//
// focusCameraOn keeps the CURRENT view offset (angle + zoom) — good for "pan to here without changing how I'm
// looking". focusCameraOnFramed additionally reframes to a sensible distance (radius) with a minimum, so node
// "Focus" never over-zooms: you always still see the node AND its surrounding path.
export const cameraFocus = { x: 0, y: 0, z: 0, radius: 0, fireId: 0 };

export function focusCameraOn(x: number, y: number, z: number): void {
  cameraFocus.x = x; cameraFocus.y = y; cameraFocus.z = z; cameraFocus.radius = 0; cameraFocus.fireId += 1;
}

// Frame `radius` world units around the point (clamped to a sane minimum so close objects aren't over-zoomed).
export function focusCameraOnFramed(x: number, y: number, z: number, radius: number): void {
  cameraFocus.x = x; cameraFocus.y = y; cameraFocus.z = z; cameraFocus.radius = Math.max(0.001, radius); cameraFocus.fireId += 1;
}
