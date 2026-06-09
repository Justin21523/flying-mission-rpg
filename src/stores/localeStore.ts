import { create } from 'zustand';
import { UI_STRINGS } from '../data/i18n/strings';
import type { LocaleKey, LocaleString } from '../data/i18n/strings';

// POLI — localization (English / Traditional Chinese). The string table is editable in the 🌐 Strings tab.
// t(key) returns the active locale's string (falling back to the key). Auto-persisted. Components that show
// text subscribe to `locale` (and `strings`) so switching locale / editing updates live.
interface LocaleState {
  locale: LocaleKey;
  strings: Record<string, LocaleString>;
  setLocale: (l: LocaleKey) => void;
  setString: (key: string, locale: LocaleKey, value: string) => void;
  addString: (key: string) => void;
  removeString: (key: string) => void;
  importState: (data: { locale?: LocaleKey; strings?: Record<string, LocaleString> }) => void;
  reset: () => void;
}

const STORAGE_KEY = 'r3f-rpg-builder-poli-locale-v1';
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function persist(s: Pick<LocaleState, 'locale' | 'strings'>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: s.locale, strings: s.strings })); } catch { /* ignore */ }
}
function load(): Pick<LocaleState, 'locale' | 'strings'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      // Merge base over saved so newly-added base keys always appear.
      return { locale: p.locale === 'zh-TW' ? 'zh-TW' : 'en', strings: { ...clone(UI_STRINGS), ...(p.strings ?? {}) } };
    }
  } catch { /* ignore */ }
  return { locale: 'en', strings: clone(UI_STRINGS) };
}

export const useLocaleStore = create<LocaleState>((set, get) => {
  const save = () => persist(get());
  return {
    ...load(),
    setLocale: (l) => { set({ locale: l }); save(); },
    setString: (key, locale, value) => {
      const cur = get().strings[key] ?? { en: key, zhTW: key };
      const next = { ...cur, [locale === 'zh-TW' ? 'zhTW' : 'en']: value };
      set({ strings: { ...get().strings, [key]: next } }); save();
    },
    addString: (key) => { if (!key || get().strings[key]) return; set({ strings: { ...get().strings, [key]: { en: key, zhTW: key } } }); save(); },
    removeString: (key) => { const s = { ...get().strings }; delete s[key]; set({ strings: s }); save(); },
    importState: (data) => {
      set({ locale: data.locale === 'zh-TW' ? 'zh-TW' : (data.locale === 'en' ? 'en' : get().locale), strings: data.strings ? { ...clone(UI_STRINGS), ...data.strings } : get().strings });
      save();
    },
    reset: () => { set({ locale: 'en', strings: clone(UI_STRINGS) }); save(); },
  };
});

// Hook: returns a t(key) bound to the current locale (re-renders on locale / string change).
export function useT(): (key: string) => string {
  const locale = useLocaleStore((s) => s.locale);
  const strings = useLocaleStore((s) => s.strings);
  return (key: string) => {
    const e = strings[key];
    if (!e) return key;
    return (locale === 'zh-TW' ? e.zhTW : e.en) || e.en || key;
  };
}

// Non-hook accessor for 3D / non-component code.
export function t(key: string): string {
  const { locale, strings } = useLocaleStore.getState();
  const e = strings[key];
  if (!e) return key;
  return (locale === 'zh-TW' ? e.zhTW : e.en) || e.en || key;
}
