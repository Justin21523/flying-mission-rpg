import type { Vec3Tuple, PathControlMode } from './path';

// Phase A (data model) — a BoostPad: a small pad the player auto-triggers by entering its sensor (no key
// press), getting a timed speed burst, optionally entering PathFollow along a linked path. Runtime (sensor +
// cooldown + debug arrow + impulse via the dashImpulse/pathFollow bus) is Phase B.
export type BoostMode = 'forward' | 'customDirection' | 'pathDirection';
export const BOOST_MODES: BoostMode[] = ['forward', 'customDirection', 'pathDirection'];

export type BoostExitBehavior = 'releaseControl' | 'continueMomentum' | 'stopAtEnd';
export const BOOST_EXIT_BEHAVIORS: BoostExitBehavior[] = ['releaseControl', 'continueMomentum', 'stopAtEnd'];

export interface BoostPadConfig {
  id: string;
  enabled: boolean;
  boostMode: BoostMode;
  boostSpeed: number;
  acceleration: number;
  duration: number;
  cooldown: number;            // per-pad re-trigger guard (s) — never fire every frame
  customDirection?: Vec3Tuple; // for boostMode 'customDirection'
  linkedPathId?: string;       // for boostMode 'pathDirection' / enterPathFollow
  enterPathFollow: boolean;
  pathControlMode?: PathControlMode; // how much control the follower keeps while on linkedPath (default forwardLocked)
  exitBehavior: BoostExitBehavior;
  requiredTags?: string[];     // only boosts followers carrying these tags
  blockedTags?: string[];
  activationAnimation?: string; // animation id (a Gameplay Event — pad never drives the mixer directly)
  activationSound?: string;
  // Placement (Edit Mode): a BoostPad is a world object.
  areaId?: string;
  position?: Vec3Tuple;
  rotation?: Vec3Tuple;        // 'forward' = pad's local +Z
}
