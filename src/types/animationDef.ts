// Phase A (data model) — a thin registry over the existing AnimRule/animRunner system. AnimationDefinition
// names a clip (by clip name / asset id — NEVER an AnimationClip object) + playback metadata; an
// AnimationReactionProfile maps reaction keys (e.g. 'small_bump', 'hard_impact', 'greeting') to animation ids.
// Phase C/D wires these into the existing CharacterAnimationController (PlayerMesh / AnimatedGlbModel).
export type AnimationLayer = 'base' | 'upperBody' | 'additive' | 'reaction';
export const ANIMATION_LAYERS: AnimationLayer[] = ['base', 'upperBody', 'additive', 'reaction'];

export interface AnimationDefinition {
  id: string;
  displayName: string;
  clipName: string;        // the clip's name in the GLB (resolved at runtime; never stored as a clip object)
  layer: AnimationLayer;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
  speed: number;
  priority: number;
  interruptible: boolean;
  returnState?: string;    // animation id to fall back to when this finishes
}

// Maps reaction keys → animation ids for a given character/vehicle profile.
export interface AnimationReactionProfile {
  id: string;
  name: string;
  forKind: 'humanoid' | 'vehicle';
  entries: { reaction: string; animationId: string }[];
}
