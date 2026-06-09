import type { DialogueCondition } from '../../types/dialogue';
import { inp, lbl, useQuestOptions, useItemOptions } from './editorShared';
import { IdSelect } from './idPickers';

// Shared editor for a single (optional) condition — used by dialogue-tree gates + quest prerequisites. Covers
// the common DialogueCondition kinds with id dropdowns where possible. '(always)' = no condition (undefined).
type Kind = 'none' | 'worldFlagSet' | 'questCompleted' | 'questInProgress' | 'playerLevel' | 'hasItem' | 'trustLevel';
const KIND_LABEL: Record<Kind, string> = {
  none: '(always)', worldFlagSet: 'world flag set', questCompleted: 'quest completed',
  questInProgress: 'quest in progress', playerLevel: 'player level ≥', hasItem: 'has item', trustLevel: 'trust ≥',
};

export const ConditionEditor = ({ value, onChange }: { value?: DialogueCondition; onChange: (v?: DialogueCondition) => void }) => {
  const quests = useQuestOptions();
  const items = useItemOptions();
  const kind: Kind = (value?.type as Kind) ?? 'none';

  const setKind = (k: Kind) => {
    switch (k) {
      case 'none': onChange(undefined); break;
      case 'worldFlagSet': onChange({ type: 'worldFlagSet', flag: '' }); break;
      case 'questCompleted': onChange({ type: 'questCompleted', targetId: '' }); break;
      case 'questInProgress': onChange({ type: 'questInProgress', targetId: '' }); break;
      case 'playerLevel': onChange({ type: 'playerLevel', level: 1 }); break;
      case 'hasItem': onChange({ type: 'hasItem', targetId: '' }); break;
      case 'trustLevel': onChange({ type: 'trustLevel', characterId: '', minTrust: 1 }); break;
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-1.5">
      <label className="flex flex-col gap-0.5">
        <span className={lbl}>condition</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={inp}>
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </label>
      {value?.type === 'worldFlagSet' && (
        <input value={value.flag} onChange={(e) => onChange({ type: 'worldFlagSet', flag: e.target.value })} placeholder="flag id" className={inp + ' flex-1'} />
      )}
      {(value?.type === 'questCompleted' || value?.type === 'questInProgress') && (
        <IdSelect value={value.targetId} onChange={(v) => onChange({ type: value.type, targetId: v ?? '' })} options={quests} placeholder="(quest)" />
      )}
      {value?.type === 'hasItem' && (
        <IdSelect value={value.targetId} onChange={(v) => onChange({ type: 'hasItem', targetId: v ?? '' })} options={items} placeholder="(item)" />
      )}
      {value?.type === 'playerLevel' && (
        <input type="number" min={1} value={value.level} onChange={(e) => onChange({ type: 'playerLevel', level: parseInt(e.target.value, 10) || 1 })} className={inp + ' w-20'} />
      )}
      {value?.type === 'trustLevel' && (
        <>
          <input value={value.characterId} onChange={(e) => onChange({ type: 'trustLevel', characterId: e.target.value, minTrust: value.minTrust })} placeholder="char id" className={inp + ' w-24'} />
          <input type="number" value={value.minTrust} onChange={(e) => onChange({ type: 'trustLevel', characterId: value.characterId, minTrust: parseInt(e.target.value, 10) || 0 })} className={inp + ' w-16'} />
        </>
      )}
    </div>
  );
};
