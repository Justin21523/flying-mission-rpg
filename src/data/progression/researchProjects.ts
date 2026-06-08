// POLI — Jin's research-station projects (editable in the 🔬 Research tab). Each project spends research
// points (earned from rescues + quests) to unlock a rescue tool. Prerequisites form a small research tree.
// GameAdaptation: designed for playability. Tool ids match data/tools/poliTools.
export interface ResearchProject {
  id: string;
  name: string;          // English display name
  description: string;
  cost: number;          // research points
  unlocksToolId: string; // a ToolId unlocked on completion
  prerequisiteProjectIds: string[];
}

export const RESEARCH_PROJECTS: ResearchProject[] = [
  { id: 'proj_stretcher', name: 'Folding Stretcher', description: 'Develop a quick-deploy stretcher for medical rescues.', cost: 2, unlocksToolId: 'stretcher', prerequisiteProjectIds: [] },
  { id: 'proj_rope', name: 'Rescue Rope Mk.I', description: 'A strong, light rope for lifting and pulling rescues.', cost: 3, unlocksToolId: 'rescue_rope', prerequisiteProjectIds: [] },
  { id: 'proj_megaphone', name: 'Smart Megaphone', description: 'A loud, clear megaphone to guide residents to safety.', cost: 3, unlocksToolId: 'megaphone', prerequisiteProjectIds: [] },
  { id: 'proj_scanner', name: 'Signal Scanner', description: 'Detect failing signals and hazards from a distance.', cost: 4, unlocksToolId: 'signal_scanner', prerequisiteProjectIds: ['proj_rope'] },
];
