export interface CharacterSwitchCameraConfig {
  transitionSeconds: number;
  useFadeWhenDistanceAbove: number;
  transitionHeightOffset: number;
  transitionDistanceMultiplier: number;
  easing: 'linear' | 'easeInOut';
}

export const DEFAULT_CHARACTER_SWITCH_CAMERA: CharacterSwitchCameraConfig = {
  transitionSeconds: 0.45,
  useFadeWhenDistanceAbove: 80,
  transitionHeightOffset: 3,
  transitionDistanceMultiplier: 1.2,
  easing: 'easeInOut',
};
