import { nanoid } from 'nanoid';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import type { TransformationDefinition } from '../../../types/game/transformation';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';

const makeNew = (): TransformationDefinition => ({
  id: `xf_${nanoid(6)}`,
  name: 'New Transformation',
  durationSec: 4,
  backdropColor: '#0b1220',
  particleColor: '#38bdf8',
  steps: [],
});

// ✨ Transform — vehicle⇄robot transformation definitions (timeline shell; Batch 6 builds the director).
export const TransformationEditorTab = () => {
  const characters = useEditorCharacterStore((s) => s.items);
  const none = { value: '', label: '(none)' };
  return (
    <CollectionEditor<TransformationDefinition>
      title="Transformations"
      store={useEditorTransformationStore}
      makeNew={makeNew}
      getLabel={(t) => t.name}
      renderFields={(t, update) => (
        <>
          <TextRow label="Name" value={t.name} onChange={(v) => update({ name: v })} />
          <SelectRow label="Character" value={t.characterId ?? ''} options={[none, ...characters.map((c) => ({ value: c.id, label: c.name }))]} onChange={(v) => update({ characterId: v || undefined })} />
          <NumRow label="Duration (sec)" value={t.durationSec} step={0.5} min={0} onChange={(v) => update({ durationSec: v })} />
          <ColorRow label="Backdrop colour" value={t.backdropColor} onChange={(v) => update({ backdropColor: v })} />
          <ColorRow label="Particle colour" value={t.particleColor} onChange={(v) => update({ particleColor: v })} />
          <p className="text-[10px] text-slate-500">Timeline steps: {t.steps.length} (deep editor in Batch 6).</p>
        </>
      )}
    />
  );
};
