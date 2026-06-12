export interface AnimationTrackOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BuildAnimationTrackOptionsConfig {
  clips: readonly string[];
  value?: string;
  noneLabel?: string;
  emptyLabel?: string;
  includeCommonFallback?: boolean;
}

export const COMMON_ANIMATION_TRACKS: readonly string[] = ['idle', 'walk', 'run', 'attack', 'wave', 'talk'];

export function buildAnimationTrackOptions({
  clips,
  value,
  noneLabel = '(none)',
  emptyLabel = '(no tracks detected)',
  includeCommonFallback = false,
}: BuildAnimationTrackOptionsConfig): AnimationTrackOption[] {
  const seen = new Set<string>();
  const options: AnimationTrackOption[] = [];
  options.push({ value: '', label: noneLabel });

  for (const clip of clips) {
    if (!clip || seen.has(clip)) continue;
    seen.add(clip);
    options.push({ value: clip, label: clip });
  }

  if (options.length === 1 && includeCommonFallback) {
    for (const clip of COMMON_ANIMATION_TRACKS) {
      if (seen.has(clip)) continue;
      seen.add(clip);
      options.push({ value: clip, label: clip });
    }
  }

  if (value && !seen.has(value)) {
    options.push({ value, label: `${value} (saved)` });
    seen.add(value);
  }

  if (options.length === 1) options.push({ value: '__no_tracks__', label: emptyLabel, disabled: true });
  return options;
}
