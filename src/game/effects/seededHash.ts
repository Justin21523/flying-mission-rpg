// Stateless, frame-stable pseudo-random hash for effect renderers (particle scatter / "random points"). Unlike a
// stateful RNG sequence, the output depends ONLY on its inputs — so it can be called fresh every frame for the
// same particle index and always yield the same value (deterministic, scrub-correct). Mixing a per-effect `seed`
// into the input makes the scatter EDITABLE & re-rollable while staying reproducible (the seed rides the effect
// config through copy/paste/preset/version). At `seed = 0` it reduces to the renderers' original inline formula
// (`frac(sin(n*k + c) * 43758.5453)`), so existing authored looks are unchanged.
export function seededHash(n: number, seed = 0, k = 127.1, c = 311.7): number {
  const x = Math.sin((n + seed * 1013) * k + c) * 43758.5453;
  return x - Math.floor(x);
}
