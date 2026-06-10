// Phase H3 — a guaranteed, art-free reaction: a brief squash-bounce on the player mesh. animationRegistry
// .playReaction fires this alongside the (clip-dependent) reaction animation, so a collision reaction is always
// visible even when the placeholder GLB lacks the named clip. Plain module object — no React, no alloc.
export const proceduralReaction = { fireId: 0 };

export function fireProceduralReaction(): void {
  proceduralReaction.fireId += 1;
}
