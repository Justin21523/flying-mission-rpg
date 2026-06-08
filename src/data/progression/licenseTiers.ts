// POLI — rescue-license tiers (editable in the 🎖 License tab). The player's tier rises as they complete
// rescues (and optionally reach an exp threshold). GameAdaptation: tiers designed for playability.
export interface LicenseTier {
  id: string;
  name: string;        // English display name (zh-TW reference in comments)
  icon: string;
  requiredRescues: number; // rescues completed to reach this tier
  requiredExp: number;     // player exp to reach this tier (0 = none)
}

export const LICENSE_TIERS: LicenseTier[] = [
  { id: 'tier_trainee', name: 'Trainee', icon: '🪪', requiredRescues: 0, requiredExp: 0 },        // 見習
  { id: 'tier_junior', name: 'Junior Rescuer', icon: '🎖', requiredRescues: 3, requiredExp: 0 },   // 初級
  { id: 'tier_rescuer', name: 'Rescuer', icon: '🏅', requiredRescues: 8, requiredExp: 0 },         // 正式
  { id: 'tier_senior', name: 'Senior Rescuer', icon: '🥇', requiredRescues: 15, requiredExp: 0 },  // 資深
  { id: 'tier_hero', name: 'Rescue Hero', icon: '🏆', requiredRescues: 30, requiredExp: 0 },       // 英雄
];
