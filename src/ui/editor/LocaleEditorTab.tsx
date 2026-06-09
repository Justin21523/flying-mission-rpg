import { useState } from 'react';
import { useLocaleStore } from '../../stores/localeStore';
import { inp, lbl } from './editorShared';

// 🌐 Strings tab — switch locale (English / 繁中) and edit the UI string table live. Add new keys, then
// call t('key') at more UI sites to widen coverage. Auto-saved.
export const LocaleEditorTab = () => {
  const locale = useLocaleStore((s) => s.locale);
  const strings = useLocaleStore((s) => s.strings);
  const st = useLocaleStore.getState();
  const [newKey, setNewKey] = useState('');
  const keys = Object.keys(strings).sort();

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
        <span className={lbl}>Active locale</span>
        <select value={locale} onChange={(e) => st.setLocale(e.target.value as 'en' | 'zh-TW')} className="ml-auto rounded bg-slate-800 px-2 py-1 text-slate-100">
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="new.key" className={`flex-1 ${inp}`} />
        <button disabled={!newKey.trim()} onClick={() => { st.addString(newKey.trim()); setNewKey(''); }} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 disabled:opacity-40">➕ key</button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-1 text-[10px] font-semibold text-slate-400">
        <span>key</span><span>English</span><span>繁中</span><span></span>
      </div>
      <div className="max-h-[28rem] space-y-1 overflow-y-auto">
        {keys.map((k) => (
          <div key={k} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-1">
            <span className="truncate text-[10px] text-slate-500" title={k}>{k}</span>
            <input value={strings[k].en} onChange={(e) => st.setString(k, 'en', e.target.value)} className={inp} />
            <input value={strings[k].zhTW} onChange={(e) => st.setString(k, 'zh-TW', e.target.value)} className={inp} />
            <button onClick={() => st.removeString(k)} className="rounded px-1 text-[10px] text-rose-400 hover:bg-slate-800">🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
};
