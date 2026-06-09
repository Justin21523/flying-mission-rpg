// POLI — the set of currently-held key codes, shared as a plain module singleton (like playerMotion) so the
// animation system can read `key` triggers without subscribing. Player.tsx writes it on key down/up.
export const playerKeysDown = new Set<string>();
