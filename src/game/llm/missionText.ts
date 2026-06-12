import { z } from 'zod';
import type { MissionDefinition } from '../../types/game/mission';
import { generateJson } from './generateJson';
import type { LlmMessage } from './llmProvider';

// LLM-generated mission TEXT only — name / summary / per-objective description. Structure (kinds, targets,
// rewards, conditions) is NEVER produced by the LLM; applyMissionText maps the validated strings back by id.
export const MissionTextSchema = z.object({
  name: z.string().min(1).max(60),
  summary: z.string().min(1).max(220),
  objectives: z.array(z.object({ id: z.string(), description: z.string().min(1).max(140) })),
});
export type MissionText = z.infer<typeof MissionTextSchema>;

export function missionTextOf(m: MissionDefinition): MissionText {
  return { name: m.name, summary: m.summary, objectives: m.objectives.map((o) => ({ id: o.id, description: o.description })) };
}

export function buildMissionTextMessages(m: MissionDefinition): LlmMessage[] {
  const objLines = m.objectives.map((o) => `- id "${o.id}" (${o.kind}): ${o.description}`).join('\n');
  return [
    {
      role: 'system',
      content:
        'You write warm, child-friendly, NON-COMBAT flavour text for a kids rescue game about friendly flying robots. ' +
        'Rewrite ONLY the wording — never invent new objectives or change what must be done. Keep it short and in English, ' +
        'no scary or violent themes. Return ONLY a JSON object of the form ' +
        '{"name": string, "summary": string, "objectives": [{"id": string, "description": string}]}. ' +
        'Keep every objective id EXACTLY as given; do not add, remove, or reorder objectives.',
    },
    {
      role: 'user',
      content:
        `Mission type: ${m.type}. Difficulty: ${m.difficulty}.\n` +
        `Current name: ${m.name}\nCurrent summary: ${m.summary}\nObjectives:\n${objLines}\n\n` +
        'Rewrite the name (<=60 chars), the summary (<=200 chars), and each objective description (<=120 chars), keeping each id.',
    },
  ];
}

// Apply validated LLM text onto the mission — ONLY name/summary/objective.description, matched by id. Everything
// structural is preserved; unknown ids are ignored, missing ones keep their original text.
export function applyMissionText(m: MissionDefinition, text: MissionText): MissionDefinition {
  const byId = new Map(text.objectives.map((o) => [o.id, o.description]));
  return {
    ...m,
    name: text.name.trim() || m.name,
    summary: text.summary.trim() || m.summary,
    objectives: m.objectives.map((o) => ({ ...o, description: byId.get(o.id)?.trim() || o.description })),
  };
}

export async function enhanceMissionText(m: MissionDefinition): Promise<MissionDefinition> {
  const { value } = await generateJson(buildMissionTextMessages(m), MissionTextSchema, () => missionTextOf(m));
  return applyMissionText(m, value);
}
