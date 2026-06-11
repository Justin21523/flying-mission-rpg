// Non-reactive bridge: FollowCamera (edit mode) writes the live camera position + orbit target here each
// frame, so the 🎥 Camera tab's "Capture current edit view" can read the exact framing without a React
// subscription. Plain mutable module object (the kit pattern for 3D→UI handles).
export const editCameraHandle = {
  camX: 0, camY: 6, camZ: 12,
  targetX: 0, targetY: 1, targetZ: 0,
};
