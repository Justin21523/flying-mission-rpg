// Pure cooldown helpers over a `skillId → endMs` map (the same ms-timestamp style as transformStore's
// superCdUntil). The store holds the map; this module computes readiness / remaining. ignoreCooldown is the
// debug bypass (like DEBUG_UNLIMITED_ABILITY).

export function isReady(cooldowns: Record<string, number>, skillId: string, nowMs: number, ignoreCooldown = false): boolean {
  if (ignoreCooldown) return true;
  return nowMs >= (cooldowns[skillId] ?? 0);
}

export function remainingSeconds(cooldowns: Record<string, number>, skillId: string, nowMs: number): number {
  return Math.max(0, ((cooldowns[skillId] ?? 0) - nowMs) / 1000);
}

export function cooldownEndMs(nowMs: number, cooldownSeconds: number, ignoreCooldown = false): number {
  return ignoreCooldown ? 0 : nowMs + cooldownSeconds * 1000;
}

// Fraction 0..1 of the cooldown remaining (1 = just triggered, 0 = ready) — for HUD radial fills.
export function cooldownFraction(cooldowns: Record<string, number>, skillId: string, nowMs: number, cooldownSeconds: number): number {
  if (cooldownSeconds <= 0) return 0;
  return Math.max(0, Math.min(1, ((cooldowns[skillId] ?? 0) - nowMs) / (cooldownSeconds * 1000)));
}
