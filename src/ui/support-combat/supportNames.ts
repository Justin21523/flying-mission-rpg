// Display names + theme colors for the MVP support heroes (Batch E UI). Kept tiny + non-component so the
// HUD / panel / debug share it (react-refresh: constants live outside component files).
export const SUPPORT_NAMES: Record<string, string> = {
  char_jett: 'Jett',
  char_donnie: 'Donnie',
  char_paul: 'Paul',
  char_chase: 'Chase',
};

export const supportName = (id: string): string => SUPPORT_NAMES[id] ?? id;

export const SUPPORT_TYPE_LABEL: Record<string, string> = {
  'strike-support': 'Strike',
  'shield-support': 'Shield',
  'repair-support': 'Repair',
  'scan-support': 'Scan',
  'taunt-support': 'Taunt',
  'break-support': 'Break',
  'platform-support-placeholder': 'Platform',
  'fusion-placeholder': 'Fusion',
};
