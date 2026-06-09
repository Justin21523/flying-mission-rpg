// POLI — base UI string table (English + Traditional Chinese). Editable in the 🌐 Strings tab (localeStore
// seeds from this). Per the project rule, in-game UI may be zh-TW while code/keys stay English. This is an
// MVP set covering the new POLI HUDs; widen coverage by adding keys here + calling t('key') at more sites.
export type LocaleKey = 'en' | 'zh-TW';
export interface LocaleString { en: string; zhTW: string }

export const UI_STRINGS: Record<string, LocaleString> = {
  // Rescue license badge
  'license.rescues': { en: 'rescues', zhTW: '次救援' },
  'license.next': { en: 'next', zhTW: '下一級' },
  'license.in': { en: 'in', zhTW: '還差' },
  'license.max': { en: 'max tier', zhTW: '已達最高級' },
  // Jin research station
  'research.station': { en: "Jin's Research Station", zhTW: '金博士研究站' },
  'research.title': { en: 'Research Station', zhTW: '研究站' },
  'research.points': { en: 'pts', zhTW: '點' },
  'research.research': { en: 'Research', zhTW: '研究' },
  'research.done': { en: 'researched', zhTW: '已研究' },
  'research.needsPrereq': { en: 'needs prereq', zhTW: '需先決條件' },
  'research.hint': { en: 'Unlocked tools equip in the Tool Belt (top-right).', zhTW: '已解鎖的工具可在右上角工具列裝備。' },
  // Tool belt
  'toolbelt.title': { en: 'Tool Belt', zhTW: '工具列' },
  'toolbelt.empty': { en: 'empty', zhTW: '空' },
  // Common
  'common.close': { en: 'Close', zhTW: '關閉' },
};
