import { getModelAsset } from '../../data/modelLibrary';
import { Field, inp } from './editorShared';
import { useGltfClipNames } from './useGltfClipNames';
import { buildAnimationTrackOptions } from './animationTrackOptions';

export const AnimationTrackSelect = ({
  label,
  modelAssetId,
  clips,
  value,
  onChange,
  noneLabel,
  emptyLabel,
  includeCommonFallback = false,
}: {
  label: string;
  modelAssetId?: string;
  clips?: readonly string[];
  value?: string;
  onChange: (value: string | undefined) => void;
  noneLabel?: string;
  emptyLabel?: string;
  includeCommonFallback?: boolean;
}) => {
  const asset = modelAssetId ? getModelAsset(modelAssetId) : undefined;
  const modelClips = useGltfClipNames(clips ? undefined : asset?.path);
  const resolvedClips = clips ?? modelClips;
  const options = buildAnimationTrackOptions({
    clips: resolvedClips,
    value,
    noneLabel,
    emptyLabel: modelAssetId || clips ? emptyLabel : '(select a model first)',
    includeCommonFallback,
  });
  const disabled = options.every((option) => option.value === '' || option.disabled);

  return (
    <Field label={label}>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={inp}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
};
