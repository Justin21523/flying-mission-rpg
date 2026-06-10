import { create } from 'zustand';

// POLI — UI locale. Player-facing HUD chrome is localized via the i18n strings table (useT); editor/dev tools
// stay English (per project rule). Defaults to Traditional Chinese (the user's preference); persisted.
export type Locale = 'en' | 'zh';
export const LOCALES: { id: Locale; label: string }[] = [{ id: 'zh', label: '繁體中文' }, { id: 'en', label: 'English' }];

const STORAGE_KEY = 'r3f-rpg-builder-poli-locale-v1';
function load(): Locale {
  try { const v = localStorage.getItem(STORAGE_KEY); if (v === 'en' || v === 'zh') return v; } catch { /* ignore */ }
  return 'zh';
}

interface LocaleState { locale: Locale; setLocale: (l: Locale) => void }
export const useLocaleStore = create<LocaleState>((set) => ({
  locale: load(),
  setLocale: (l) => { try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ } set({ locale: l }); },
}));
