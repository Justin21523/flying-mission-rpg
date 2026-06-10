// POLI — "focus the edit camera here" bus. Editor 🎯 buttons and add-actions call focusCameraOn(pos); the
// FollowCamera (edit mode) pans its OrbitControls target to that point (keeping angle/zoom) so a selected /
// newly-added object — even one far away or off-screen — jumps into view with its gizmo ready. Plain module
// object, mutated outside React.
export const cameraFocus = { x: 0, y: 0, z: 0, fireId: 0 };

export function focusCameraOn(x: number, y: number, z: number): void {
  cameraFocus.x = x; cameraFocus.y = y; cameraFocus.z = z; cameraFocus.fireId += 1;
}
