// Phase C — the reaction-animation bus. animationRegistry.playReaction() sets a one-shot clip request here for
// a target tag; the target's mesh consumes it on a rising-edge fireId and plays the clip ONCE through its
// existing one-shot mixer path (no parallel mixer). Currently the player is the wired target (NPC/vehicle
// targets opt in later, Phase E). Plain mutable module object — no re-render, no per-frame allocation.
export const reactionAnim: {
  player: { clip: string; speed: number; fadeIn: number; fireId: number };
} = {
  player: { clip: '', speed: 1, fadeIn: 0.15, fireId: 0 },
};

export function requestPlayerReaction(clip: string, speed = 1, fadeIn = 0.15): void {
  const p = reactionAnim.player;
  p.clip = clip; p.speed = speed; p.fadeIn = fadeIn; p.fireId += 1;
}
