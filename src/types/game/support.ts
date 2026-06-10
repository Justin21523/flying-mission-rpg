// A called-in support character during a mission (PDF Batch 8). Three-tier presence keeps perf bounded:
// only `active` ones take player/AI focus. Type only this batch — runtime arrives in Batch 8.
export type SupportStatus = 'active' | 'standby' | 'remote';
export const SUPPORT_STATUSES: readonly SupportStatus[] = ['active', 'standby', 'remote'];

export interface SupportMember {
  characterId: string;
  status: SupportStatus;
  etaSec?: number;
}
