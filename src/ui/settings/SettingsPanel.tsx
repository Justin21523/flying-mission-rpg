import { useState } from 'react';
import { PanelCard, closePanel } from '../play/playShared';
import { useLocaleStore, LOCALES } from '../../stores/localeStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useT } from '../../i18n/useT';
import { GraphicsSettingsTab } from './GraphicsSettingsTab';
import { AudioSettingsTab } from './AudioSettingsTab';
import { GameplaySettingsTab } from './GameplaySettingsTab';
import { AccessibilitySettingsTab } from './AccessibilitySettingsTab';

// Batch 12 — tabbed Settings panel (Graphics / Audio / Gameplay / Accessibility). Reuses the existing Dock
// mount + every existing settings store (no parallel settings source); language + onboarding replay stay at
// the top. Changes apply live and persist via the underlying stores.
type SettingsTab = 'graphics' | 'audio' | 'gameplay' | 'access';
const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'graphics', label: '🖥 Graphics' },
  { id: 'audio', label: '🔊 Audio' },
  { id: 'gameplay', label: '🎮 Gameplay' },
  { id: 'access', label: '♿ Access' },
];

export const SettingsPanel = () => {
  const [tab, setTab] = useState<SettingsTab>('graphics');
  const locale = useLocaleStore((s) => s.locale);
  const t = useT();

  return (
    <PanelCard title="Settings" icon="⚙" onClose={closePanel} width="22rem">
      <div className="space-y-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">{t('language')} / Language</span>
          <select value={locale} onChange={(e) => useLocaleStore.getState().setLocale(e.target.value as typeof locale)} className="rounded bg-slate-800 px-2 py-1 text-slate-100">
            {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <button onClick={() => { useOnboardingStore.getState().replay(); closePanel(); }} className="w-full rounded bg-slate-800 px-2 py-1 text-left text-slate-200 hover:bg-slate-700">🎓 {t('ob_replay')}</button>

        <div className="flex gap-1 border-b border-slate-700/60 pb-1">
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`rounded px-2 py-1 text-[11px] ${tab === tb.id ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{tb.label}</button>
          ))}
        </div>

        {tab === 'graphics' && <GraphicsSettingsTab />}
        {tab === 'audio' && <AudioSettingsTab />}
        {tab === 'gameplay' && <GameplaySettingsTab />}
        {tab === 'access' && <AccessibilitySettingsTab />}
      </div>
    </PanelCard>
  );
};
