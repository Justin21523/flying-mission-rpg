import type { RescueRoleTag } from '../../types/incidentTypes';

// Maps an incident RescueRoleTag → the hero characters that can fill it (Batch G). Derived from the character
// kit role types so incident objectives never hard-require a single character (each role has ≥2 heroes where
// possible). Pure data — used by validation (recommendedCharacterIds resolve) + the solution-hint HUD.

export const ROLE_TO_CHARACTER_IDS: Record<RescueRoleTag, string[]> = {
  'traffic-control': ['char_paul', 'char_jerome'],
  'fire-rescue': ['char_paul', 'char_jett'],
  'medical': ['char_bello', 'char_paul'],
  'air-rescue': ['char_jett', 'char_flip'],
  'repair': ['char_donnie', 'char_chase'],
  'engineering': ['char_donnie', 'char_todd'],
  'scan': ['char_chase', 'char_bello'],
  'shield': ['char_paul', 'char_jerome'],
  'combat': ['char_jett', 'char_todd', 'char_paul'],
  'evacuation': ['char_jett', 'char_paul', 'char_flip'],
  'heavy-break': ['char_todd', 'char_donnie'],
};

export function charactersForRole(role: RescueRoleTag): string[] {
  return ROLE_TO_CHARACTER_IDS[role] ?? [];
}

export function charactersForRoles(roles: RescueRoleTag[]): string[] {
  const set = new Set<string>();
  for (const r of roles) for (const c of charactersForRole(r)) set.add(c);
  return [...set];
}

// Support ability type → which incident roles it can satisfy (used by solution hints).
export const SUPPORT_TYPE_TO_ROLES: Record<string, RescueRoleTag[]> = {
  'repair-support': ['repair', 'engineering'],
  'scan-support': ['scan'],
  'shield-support': ['shield', 'evacuation'],
  'taunt-support': ['shield'],
  'break-support': ['heavy-break'],
  'strike-support': ['combat'],
};
