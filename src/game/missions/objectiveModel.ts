import type { MissionObjective } from '../../types/game/mission';

// Pure objective runtime (no R3F → unit-testable). Drives the three data-driven objective kinds of the
// destination slice: carry (pickup → attached → dropoff), find (locate + pick up) and activate/repair
// (completed by a mini-game success through the Phaser bridge). Objectives whose target objects don't
// exist in the destination layout stay INACTIVE (invalid data never starts — and never crashes).
export type ObjectiveState = 'inactive' | 'available' | 'active' | 'completed' | 'failed' | 'cancelled';

export class ObjectiveModel {
  states: Record<string, ObjectiveState> = {};
  counts: Record<string, number> = {};
  carryingObjectId: string | null = null;

  constructor(
    private objectives: MissionObjective[],
    private validTargetIds?: ReadonlySet<string>,
  ) {
    for (const o of objectives) {
      const invalid =
        !!this.validTargetIds &&
        (o.targetObjectIds ?? []).some((id) => !this.validTargetIds!.has(id));
      this.states[o.id] = invalid ? 'inactive' : 'available';
      this.counts[o.id] = 0;
    }
  }

  startAll(): void {
    for (const o of this.objectives) if (this.states[o.id] === 'available') this.states[o.id] = 'active';
  }

  get(id: string): ObjectiveState {
    return this.states[id] ?? 'inactive';
  }

  private objectiveFor(predicate: (o: MissionObjective) => boolean): MissionObjective | undefined {
    return this.objectives.find((o) => this.states[o.id] === 'active' && predicate(o));
  }

  // Player picked up a world object. carry → attach (one at a time); find → count toward completion.
  tryPickup(objectId: string): { objective?: MissionObjective; attached: boolean; completed: boolean } {
    const carry = this.objectiveFor((o) => o.kind === 'carry' && (o.targetObjectIds ?? []).includes(objectId));
    if (carry) {
      if (this.carryingObjectId) return { objective: carry, attached: false, completed: false }; // hands full
      this.carryingObjectId = objectId;
      return { objective: carry, attached: true, completed: false };
    }
    const find = this.objectiveFor((o) => o.kind === 'find' && (o.targetObjectIds ?? []).includes(objectId));
    if (find) {
      this.counts[find.id] += 1;
      const completed = this.counts[find.id] >= find.targetCount;
      if (completed) this.states[find.id] = 'completed';
      return { objective: find, attached: false, completed };
    }
    return { attached: false, completed: false };
  }

  // Player stands in a dropoff zone with the carried item.
  tryDropoff(zoneId: string): { objective?: MissionObjective; completed: boolean } {
    if (!this.carryingObjectId) return { completed: false };
    const carry = this.objectiveFor(
      (o) => o.kind === 'carry' && o.dropoffZoneId === zoneId && (o.targetObjectIds ?? []).includes(this.carryingObjectId!),
    );
    if (!carry) return { completed: false };
    this.carryingObjectId = null;
    this.counts[carry.id] += 1;
    const completed = this.counts[carry.id] >= carry.targetCount;
    if (completed) this.states[carry.id] = 'completed';
    return { objective: carry, completed };
  }

  // Resets a dropped/lost carried item back to the world (recoverable, never stuck).
  resetCarry(): string | null {
    const id = this.carryingObjectId;
    this.carryingObjectId = null;
    return id;
  }

  // Phaser bridge result for activate (repair) objectives. Success completes; fail/cancel leave it active (retry).
  miniGameResult(miniGameId: string, success: boolean): { objective?: MissionObjective; completed: boolean } {
    const o = this.objectiveFor((x) => x.kind === 'activate' && x.miniGameId === miniGameId);
    if (!o) return { completed: false };
    if (!success) return { objective: o, completed: false };
    this.counts[o.id] = o.targetCount;
    this.states[o.id] = 'completed';
    return { objective: o, completed: true };
  }

  allRequiredDone(): boolean {
    const someCompleted = this.objectives.some((o) => this.states[o.id] === 'completed');
    return someCompleted && this.objectives.every((o) => o.optional || this.states[o.id] === 'completed' || this.states[o.id] === 'inactive');
  }
}
