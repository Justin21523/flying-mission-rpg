import { useModelAnimations } from '../../game/world/useModelAnimations';
import { inp } from './editorShared';
import { buildAnimationTrackOptions } from './animationTrackOptions';

// Kit — animation dropdown that lists the model's REAL clip names (read from the GLB), falling back to a
// common set when the model has no animations. Disabled when no model is selected. Reused by NPC / Quest
// marker / Trigger inspectors.
export const AnimationPicker = ({ modelAssetId, value, onChange }: {
  modelAssetId: string | undefined;
  value: string | undefined;
  onChange: (v: string) => void;
}) => {
  const clips = useModelAnimations(modelAssetId);
  const options = buildAnimationTrackOptions({ clips, value, includeCommonFallback: true });
  return (
    <select value={value ?? options.find((option) => option.value)?.value ?? 'idle'} onChange={(e) => onChange(e.target.value)} disabled={!modelAssetId} className={inp}>
      {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
  );
};
