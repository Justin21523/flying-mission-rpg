import { nanoid } from 'nanoid';
import { useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { useEditorTransformationStore } from '../../../stores/game/editorTransformationStore';
import { CHARACTER_FORMS } from '../../../types/game/character';
import type { CharacterDefinition } from '../../../types/game/character';
import { csv, parseCsv, Field } from '../editorShared';
import { ModelPicker } from '../ModelPicker';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';

const makeNew = (): CharacterDefinition => ({
  id: `char_${nanoid(6)}`,
  codename: 'New Flyer',
  name: 'New Character',
  role: '',
  description: '',
  sourceConfidence: 'GameAdaptation',
  color: '#38bdf8',
  defaultForm: 'plane',
  stats: { flightSpeed: 5, agility: 5, controlDifficulty: 5, durability: 5 },
  abilities: [],
  missionSuitability: [],
  homeBaseLocationId: 'loc_homebase',
});

// 🛩 Characters — edit the authored flying roster (seeded from the project's Super Wings cards).
export const CharacterEditorTab = () => {
  const transformations = useEditorTransformationStore((s) => s.items);
  return (
    <CollectionEditor<CharacterDefinition>
      title="Characters"
      store={useEditorCharacterStore}
      makeNew={makeNew}
      getLabel={(c) => `${c.name} · ${c.codename}`}
      renderFields={(c, update) => (
        <>
          <TextRow label="Codename" value={c.codename} onChange={(v) => update({ codename: v })} />
          <TextRow label="Name" value={c.name} onChange={(v) => update({ name: v })} />
          <TextRow label="Role" value={c.role} onChange={(v) => update({ role: v })} />
          <TextRow label="Description" area value={c.description} onChange={(v) => update({ description: v })} />
          <ConfidenceRow value={c.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
          <ColorRow label="Colour" value={c.color} onChange={(v) => update({ color: v })} />
          <SelectRow
            label="Default form"
            value={c.defaultForm}
            options={CHARACTER_FORMS.map((f) => ({ value: f, label: f }))}
            onChange={(v) => update({ defaultForm: v as CharacterDefinition['defaultForm'] })}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Flight speed" value={c.stats.flightSpeed} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, flightSpeed: v } })} />
            <NumRow label="Agility" value={c.stats.agility} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, agility: v } })} />
            <NumRow label="Control difficulty" value={c.stats.controlDifficulty} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, controlDifficulty: v } })} />
            <NumRow label="Durability" value={c.stats.durability} min={1} max={10} onChange={(v) => update({ stats: { ...c.stats, durability: v } })} />
          </div>
          <TextRow label="Mission suitability (csv of MissionType)" value={csv(c.missionSuitability)} onChange={(v) => update({ missionSuitability: parseCsv(v) })} />
          <SelectRow
            label="Transformation"
            value={c.transformationId ?? ''}
            options={[{ value: '', label: '(none)' }, ...transformations.map((t) => ({ value: t.id, label: t.name }))]}
            onChange={(v) => update({ transformationId: v || undefined })}
          />
          <TextRow label="Card image (src/assets/cards)" value={c.cardImage ?? ''} onChange={(v) => update({ cardImage: v || undefined })} />
          <Field label="Model (robot/transformer)">
            <ModelPicker value={c.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(none)" />
          </Field>
          <p className="text-[10px] text-slate-500">Abilities: {c.abilities.length} (deep editor in a later batch).</p>
        </>
      )}
    />
  );
};
