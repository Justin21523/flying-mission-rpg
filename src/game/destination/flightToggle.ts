// Pure flight-toggle rule for the destination robot: F flips flight only when the character can fly.
export function nextFlying(canFly: boolean | undefined, current: boolean): boolean {
  if (!canFly) return false;
  return !current;
}
