import { useAmbientVfxPresetStore } from '../../stores/useEnvironmentEditorStore';

export function getAmbientVfxPresets(presetIds: string[] | undefined) {
  const presets = useAmbientVfxPresetStore.getState().items;
  return (presetIds ?? []).map((id) => presets.find((preset) => preset.id === id)).filter((preset) => !!preset);
}
