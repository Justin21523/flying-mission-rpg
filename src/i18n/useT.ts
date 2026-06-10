import { useLocaleStore } from '../stores/localeStore';
import { STRINGS } from '../data/i18n/strings';

// POLI — translation helpers. `useT()` returns a `t(key, fallback?)` that re-renders on locale change; `tr()`
// is the non-reactive getter for use outside React. English is the fallback when a key is missing.
export type T = (key: string, fallback?: string) => string;

export function useT(): T {
  const locale = useLocaleStore((s) => s.locale);
  return (key, fallback) => STRINGS[locale][key] ?? STRINGS.en[key] ?? fallback ?? key;
}

export function tr(key: string, fallback?: string): string {
  const locale = useLocaleStore.getState().locale;
  return STRINGS[locale][key] ?? STRINGS.en[key] ?? fallback ?? key;
}
