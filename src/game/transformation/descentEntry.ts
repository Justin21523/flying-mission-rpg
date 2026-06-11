// Momentum handed from the transformation exit into DESCENT (computed from momentumTransferConfig). The
// minimal DESCENT scene reads this now; the full descent controller (Batch 7) will consume it properly.
export const descentEntry = {
  velocity: 8, // initial downward speed
  faceCamera: true,
};
