import type { IncidentPlan } from '../../../types/aiIncidentTypes';

// Repair (Batch G §16.3): fix small, safe omissions (missing editorMeta / objective order / out-of-range
// dangerLevel / duplicate ids). It NEVER invents missing core targets — those still fail validation. Pure.
export function repairPlan(plan: IncidentPlan): IncidentPlan {
  const danger = Math.min(5, Math.max(1, Math.round(plan.dangerLevel || 2))) as 1 | 2 | 3 | 4 | 5;

  // De-duplicate objective ids + ensure order is set.
  const seen = new Set<string>();
  const objectiveSteps = plan.objectiveSteps.map((o, i) => {
    let id = o.id || `obj_${i}`;
    while (seen.has(id)) id = `${id}_${i}`;
    seen.add(id);
    return { ...o, id, order: typeof o.order === 'number' ? o.order : i, optional: !!o.optional };
  });

  // Ensure each state change has an id.
  const fixChanges = (cs: IncidentPlan['initialStateChanges'] | undefined, prefix: string) =>
    cs?.map((c, i) => (c.id ? c : { ...c, id: `${prefix}_${i}` }));

  return {
    ...plan,
    dangerLevel: danger,
    objectiveSteps,
    initialStateChanges: fixChanges(plan.initialStateChanges, 'sc_init') ?? [],
    postSuccessStateChanges: fixChanges(plan.postSuccessStateChanges, 'sc_post'),
    postFailureStateChanges: fixChanges(plan.postFailureStateChanges, 'sc_fail'),
    recommendedCharacterIds: [...new Set(plan.recommendedCharacterIds ?? [])],
    requiredRescueRoles: [...new Set(plan.requiredRescueRoles ?? [])],
    editorMeta: plan.editorMeta ?? { generatedBy: 'mock' },
    aiControlParameters: plan.aiControlParameters ?? { allowEscalation: false, allowNPCStateChanges: true, allowObjectStateChanges: true, allowEnvironmentStateChanges: true },
  };
}
