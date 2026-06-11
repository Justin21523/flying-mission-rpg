// Non-reactive bridge from the edit-only flight cue runner to the camera + preview craft (no per-frame React
// writes). FlightCuePreview resolves the cue timeline each frame and writes here; FlightCamera reads camActive
// to override its framing, and FlightPreviewController reads animClip to drive the craft's animation.
export const flightCueHandle = {
  camActive: false, // a camera cue is steering the preview camera right now
  distance: 12,
  height: 4,
  angleDeg: 0, // orbit yaw offset around the craft
  fov: 55,
  animClip: '' as string, // active animation cue clip ('' = none)
  animSpeed: 1,
  bankDeg: 0,
};
