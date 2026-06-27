let slowMotionUntil = 0;
let slowMotionScale = 1;

export function triggerSlowMotion(durationMs: number, scale = 0.55): void {
  slowMotionUntil = Date.now() + Math.max(0, durationMs);
  slowMotionScale = Math.max(0.1, Math.min(1, scale));
}

export function getSlowMotionScale(now = Date.now()): number {
  return now < slowMotionUntil ? slowMotionScale : 1;
}

export function clearSlowMotion(): void {
  slowMotionUntil = 0;
  slowMotionScale = 1;
}
