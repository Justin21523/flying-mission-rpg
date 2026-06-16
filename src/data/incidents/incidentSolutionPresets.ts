import type { IncidentSolutionDefinition, RescueRoleTag, IncidentStateChange } from '../../types/incidentTypes';

// Reusable solution presets (Batch G). Each incident exposes ≥2 solutions so it's never single-character.
let n = 0;
const solId = (p: string) => `sol_${p}_${n++}`;

export function repairSolution(deviceSlot: string, expected: IncidentStateChange[]): IncidentSolutionDefinition {
  return {
    id: solId('repair'), label: 'Repair the device', description: 'Donnie repairs the device, or a Repair Support ability finishes it.',
    solutionType: 'repair', requiredRoleTags: ['repair', 'engineering'], requiredSkillTags: ['repair'], requiredSupportAbilityTypes: ['repair-support'],
    targetIds: [deviceSlot], expectedStateChanges: expected, risk: { canFail: false },
  };
}

export function clearObstacleSolution(obstacleSlot: string, expected: IncidentStateChange[]): IncidentSolutionDefinition {
  return {
    id: solId('clear'), label: 'Clear the blockage', description: 'A heavy-break skill or Break Support clears the obstacle.',
    solutionType: 'multi-step', requiredRoleTags: ['heavy-break', 'engineering'], requiredSkillTags: ['heavy', 'break'], requiredSupportAbilityTypes: ['break-support'],
    targetIds: [obstacleSlot], expectedStateChanges: expected, risk: { canFail: false },
  };
}

export function scanSolution(targetSlot: string, expected: IncidentStateChange[]): IncidentSolutionDefinition {
  return {
    id: solId('scan'), label: 'Scan the problem', description: 'Chase scans, or a Scan Support reveals the repair point / hidden target.',
    solutionType: 'scan', requiredRoleTags: ['scan'], requiredSkillTags: ['scan'], requiredSupportAbilityTypes: ['scan-support'],
    targetIds: [targetSlot], expectedStateChanges: expected, risk: { canFail: false },
  };
}

export function protectSolution(areaSlot: string, roles: RescueRoleTag[] = ['shield', 'traffic-control']): IncidentSolutionDefinition {
  return {
    id: solId('protect'), label: 'Protect the area', description: 'Paul shields / blocks traffic, or Shield Support holds the line while NPCs evacuate.',
    solutionType: 'support-ability', requiredRoleTags: roles, requiredSupportAbilityTypes: ['shield-support', 'taunt-support'],
    targetIds: [areaSlot], expectedStateChanges: [], risk: { canFail: false },
  };
}

export function rescueSolution(npcSlot: string, expected: IncidentStateChange[]): IncidentSolutionDefinition {
  return {
    id: solId('rescue'), label: 'Reach + rescue', description: 'Jett rushes the rescue line, or any evacuation-role hero escorts the NPC to safety.',
    solutionType: 'evacuation', requiredRoleTags: ['air-rescue', 'evacuation'], requiredSkillTags: ['rescue', 'dash'],
    targetIds: [npcSlot], expectedStateChanges: expected, risk: { canFail: false },
  };
}

export function medicalSolution(npcSlot: string, expected: IncidentStateChange[]): IncidentSolutionDefinition {
  return {
    id: solId('medical'), label: 'Stabilize the casualty', description: 'A medical-role hero (Bello / Paul) stabilizes the injured NPC before evacuation.',
    solutionType: 'multi-step', requiredRoleTags: ['medical', 'evacuation'], requiredSkillTags: ['scan', 'support'],
    targetIds: [npcSlot], expectedStateChanges: expected, risk: { canFail: false },
  };
}

export function trafficControlSolution(areaSlot: string): IncidentSolutionDefinition {
  return {
    id: solId('traffic'), label: 'Control the traffic', description: 'Paul / Jerome direct traffic to clear the snarl and protect bystanders.',
    solutionType: 'support-ability', requiredRoleTags: ['traffic-control', 'shield'], requiredSupportAbilityTypes: ['shield-support', 'taunt-support'],
    targetIds: [areaSlot], expectedStateChanges: [], risk: { canFail: false },
  };
}

export function scanRevealSolution(targetSlot: string, expected: IncidentStateChange[]): IncidentSolutionDefinition {
  return {
    id: solId('scanreveal'), label: 'Scan to reveal', description: 'Chase / Bello scans to reveal the hidden fault, victim or safe route.',
    solutionType: 'scan', requiredRoleTags: ['scan'], requiredSkillTags: ['scan'], requiredSupportAbilityTypes: ['scan-support'],
    targetIds: [targetSlot], expectedStateChanges: expected, risk: { canFail: false },
  };
}
