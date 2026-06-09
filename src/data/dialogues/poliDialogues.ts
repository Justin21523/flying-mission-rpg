import type { DialogueTree } from '../../types/dialogue';

// POLI rescue team and resident dialogue trees.
// All characters: OfficialConfirmed or labelled per residents.ts sourceConfidence.
// Quest givers (site_foreman, mayor_lee, dr_kim) use conditional roots to branch
// on quest state: completed → thanks | in progress → check-in | not started → offer.
export const POLI_DIALOGUES: DialogueTree[] = [
  // ────────────────────────────── Roy ──────────────────────────────
  {
    id: 'dlg_roy',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Roy',
        text: 'Hey! Great timing. I\'m about to run a rescue drill on Main Road. Want to help?',
        emotion: 'happy',
        nextNodeId: 'drill_offer',
      },
      drill_offer: {
        id: 'drill_offer',
        speaker: 'Roy',
        text: 'Every practice run makes us better prepared for real emergencies!',
        emotion: 'excited',
        choices: [
          { id: 'learn', text: 'Tell me about the drills.', nextNodeId: 'drill_detail' },
          {
            id: 'help',
            text: "I'll protect Brooms Town!",
            nextNodeId: 'encourage',
            effect: { type: 'increaseTrust', characterId: 'roy', amount: 5 },
          },
          { id: 'later', text: 'Maybe later.', nextNodeId: null },
        ],
      },
      drill_detail: {
        id: 'drill_detail',
        speaker: 'Roy',
        text: 'We rush to the incident scene, assess the situation, then guide citizens to safety. Speed and calm are both key!',
        emotion: 'thinking',
        actions: [{ type: 'increaseTrust', characterId: 'roy', amount: 10 }],
        nextNodeId: null,
      },
      encourage: {
        id: 'encourage',
        speaker: 'Roy',
        text: "That spirit is what Brooms Town needs! We protect this place together.",
        emotion: 'excited',
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Helly ──────────────────────────────
  {
    id: 'dlg_helly',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Helly',
        text: "Hi! I just finished an aerial survey. Everything looks peaceful from above!",
        emotion: 'happy',
        nextNodeId: 'area_report',
      },
      area_report: {
        id: 'area_report',
        speaker: 'Helly',
        text: "The harbor is busy, the forest is calm, and the construction site is progressing well.",
        emotion: 'neutral',
        choices: [
          { id: 'danger', text: 'Any danger areas?', nextNodeId: 'all_clear' },
          {
            id: 'map',
            text: 'Can you show me your map?',
            nextNodeId: 'map_hint',
            condition: { type: 'trustLevel', characterId: 'helly', minTrust: 21 },
          },
          { id: 'thanks', text: "Thanks, Helly!", nextNodeId: null },
        ],
      },
      all_clear: {
        id: 'all_clear',
        speaker: 'Helly',
        text: "All clear for now! But weather can change fast — I keep watch every day.",
        emotion: 'happy',
        nextNodeId: null,
      },
      map_hint: {
        id: 'map_hint',
        speaker: 'Helly',
        text: "Of course! I mapped all 8 districts. Watch the harbor area especially — the docks get tricky in fog.",
        emotion: 'excited',
        actions: [{ type: 'setWorldFlag', flag: 'helly_map_shared' }],
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Mayor Lee (quest giver: quest_town_patrol) ──────────────────────────────
  {
    id: 'dlg_mayor',
    rootNodeId: 'start',
    nodes: {
      // Routing gate: questCompleted → thank-you | else → check in-progress
      start: {
        id: 'start',
        speaker: 'Mayor Lee',
        text: "Excellent work! Brooms Town is even safer thanks to your patrol report.",
        emotion: 'excited',
        conditions: [{ type: 'questCompleted', targetId: 'quest_town_patrol' }],
        fallbackNodeId: 'patrol_check',
        nextNodeId: null,
      },
      // If quest in progress → show check-in with report-back choice
      patrol_check: {
        id: 'patrol_check',
        speaker: 'Mayor Lee',
        text: "Have you finished scouting Harbor Front, Construction Site, and Forest Edge yet?",
        emotion: 'neutral',
        conditions: [{ type: 'questInProgress', targetId: 'quest_town_patrol' }],
        fallbackNodeId: 'town_history',
        choices: [
          { id: 'report', text: "I've scouted all three areas.", nextNodeId: 'patrol_report' },
          { id: 'still', text: 'Still patrolling.', nextNodeId: 'patrol_still' },
        ],
      },
      patrol_report: {
        id: 'patrol_report',
        speaker: 'Mayor Lee',
        text: "Wonderful! I knew I could count on you. Brooms Town is in safe hands!",
        emotion: 'excited',
        actions: [{ type: 'completeObjective', questId: 'quest_town_patrol', objectiveId: 'obj_report_mayor' }],
        nextNodeId: null,
      },
      patrol_still: {
        id: 'patrol_still',
        speaker: 'Mayor Lee',
        text: "No rush! Visit all three areas when you can — your safety comes first.",
        emotion: 'neutral',
        nextNodeId: null,
      },
      // Original welcome flow (quest not started)
      town_history: {
        id: 'town_history',
        speaker: 'Mayor Lee',
        text: "Welcome to Brooms Town! I'm Mayor Lee. Our city is peaceful, thanks to our wonderful rescue team.",
        emotion: 'happy',
        nextNodeId: 'rescue_origin',
      },
      rescue_origin: {
        id: 'rescue_origin',
        speaker: 'Mayor Lee',
        text: "Poli and the team keep everyone safe — from fires to floods, they handle it all!",
        emotion: 'happy',
        choices: [
          { id: 'team', text: 'Tell me about the rescue team.', nextNodeId: 'team_info' },
          {
            id: 'help',
            text: 'How can I help the town?',
            nextNodeId: 'help_appeal',
            effect: { type: 'increaseTrust', characterId: 'mayor_lee', amount: 5 },
          },
          {
            id: 'patrol',
            text: "I'll scout the outer districts for you!",
            nextNodeId: 'patrol_accepted',
            effect: { type: 'startQuest', questId: 'quest_town_patrol' },
          },
        ],
      },
      patrol_accepted: {
        id: 'patrol_accepted',
        speaker: 'Mayor Lee',
        text: "Wonderful! Please visit Harbor Front, Construction Site, and Forest Edge — then come back and tell me what you found.",
        emotion: 'excited',
        nextNodeId: null,
      },
      team_info: {
        id: 'team_info',
        speaker: 'Mayor Lee',
        text: "Roy handles fires, Helly handles aerial rescues, Spoki keeps order, and Jin invents the tools they need. A great team!",
        emotion: 'excited',
        nextNodeId: null,
      },
      help_appeal: {
        id: 'help_appeal',
        speaker: 'Mayor Lee',
        text: "Wonderful! The best way to help is to stay alert and report any unusual situations to the rescue team.",
        emotion: 'happy',
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Teacher Mi ──────────────────────────────
  {
    id: 'dlg_teacher',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Teacher Mi',
        text: "Hello! Safety is the most important lesson I teach. May I share a tip?",
        emotion: 'happy',
        nextNodeId: 'lesson_1',
      },
      lesson_1: {
        id: 'lesson_1',
        speaker: 'Teacher Mi',
        text: "Lesson 1: If you see something dangerous — fire, flood, or someone hurt — stay calm and call for help right away.",
        emotion: 'thinking',
        nextNodeId: 'lesson_2',
      },
      lesson_2: {
        id: 'lesson_2',
        speaker: 'Teacher Mi',
        text: "Lesson 2: Never handle a serious emergency alone. The rescue team is always ready to help!",
        emotion: 'thinking',
        nextNodeId: 'lesson_done',
      },
      lesson_done: {
        id: 'lesson_done',
        speaker: 'Teacher Mi',
        text: "Remember: knowing when to ask for help IS real bravery. Stay safe out there!",
        emotion: 'excited',
        actions: [
          { type: 'setWorldFlag', flag: 'safety_lesson_1' },
          { type: 'setWorldFlag', flag: 'npc_talked_teacher_mi' },
          { type: 'increaseTrust', characterId: 'teacher_mi', amount: 10 },
        ],
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Spoki ──────────────────────────────
  {
    id: 'dlg_spoki',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Spoki',
        text: "Halt! … Just kidding. Hi! I'm Officer Spoki, keeping Brooms Town safe and orderly.",
        emotion: 'happy',
        nextNodeId: 'order_speech',
      },
      order_speech: {
        id: 'order_speech',
        speaker: 'Spoki',
        text: "My job is to make sure everyone follows the rules — not because rules are fun, but because they keep people safe!",
        emotion: 'neutral',
        choices: [
          { id: 'incidents', text: 'Any incidents recently?', nextNodeId: 'quiet_report' },
          {
            id: 'watch',
            text: "I'll keep watch too!",
            nextNodeId: 'partner_mode',
            effect: { type: 'increaseTrust', characterId: 'spoki', amount: 8 },
          },
        ],
      },
      quiet_report: {
        id: 'quiet_report',
        speaker: 'Spoki',
        text: "Quiet day so far! The harbor workers are a bit noisy, but nothing serious. Stay alert though — incidents happen fast.",
        emotion: 'neutral',
        nextNodeId: null,
      },
      partner_mode: {
        id: 'partner_mode',
        speaker: 'Spoki',
        text: "That's the spirit! With two of us watching, nothing slips by. Welcome to the neighborhood watch!",
        emotion: 'excited',
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Jin (trust-gated research tiers) ──────────────────────────────
  {
    id: 'dlg_jin',
    rootNodeId: 'start',
    nodes: {
      // Router: trust 50+ → expert tier; else check mid tier
      start: {
        id: 'start',
        speaker: 'Jin',
        text: "Ah, perfect timing! I'm deep in research on optimising our rescue response times.",
        emotion: 'excited',
        conditions: [{ type: 'trustLevel', characterId: 'jin', minTrust: 50 }],
        fallbackNodeId: 'jin_mid_check',
        nextNodeId: 'jin_expert',
      },
      // Router: trust 21–49 → research 2; else → basic intro
      jin_mid_check: {
        id: 'jin_mid_check',
        speaker: 'Jin',
        text: "Ah, good to see you! I have some interesting data to share.",
        emotion: 'thinking',
        conditions: [{ type: 'trustLevel', characterId: 'jin', minTrust: 21 }],
        fallbackNodeId: 'jin_intro',
        nextNodeId: 'jin_research_2',
      },
      // ── Tier 1: trust 0–20 ──
      jin_intro: {
        id: 'jin_intro',
        speaker: 'Jin',
        text: "Fascinating! I'm running calculations on the latest rescue scenario. Science helps us save lives more efficiently!",
        emotion: 'excited',
        nextNodeId: 'jin_research_1',
      },
      jin_research_1: {
        id: 'jin_research_1',
        speaker: 'Jin',
        text: "My current project: a faster way to detect flooding before it reaches homes. Prevention is always better than rescue!",
        emotion: 'thinking',
        actions: [{ type: 'increaseTrust', characterId: 'jin', amount: 5 }],
        nextNodeId: null,
      },
      // ── Tier 2: trust 21–49 ──
      jin_research_2: {
        id: 'jin_research_2',
        speaker: 'Jin',
        text: "I've finished prototyping the rescue stretcher and the rope system. I'd like you to carry them on missions.",
        emotion: 'excited',
        actions: [
          { type: 'unlockTool', toolId: 'stretcher' },
          { type: 'unlockTool', toolId: 'rescue_rope' },
          { type: 'increaseTrust', characterId: 'jin', amount: 8 },
        ],
        nextNodeId: 'jin_research_2_done',
      },
      jin_research_2_done: {
        id: 'jin_research_2_done',
        speaker: 'Jin',
        text: "The stretcher reduces handling time, and the rope extends your search radius in open terrain. Use them wisely!",
        emotion: 'thinking',
        nextNodeId: null,
      },
      // ── Tier 3: trust 50+ ──
      jin_expert: {
        id: 'jin_expert',
        speaker: 'Jin',
        text: "I've completed two major breakthroughs: a signal scanner that detects life signs, and a high-powered megaphone. Which would you like first?",
        emotion: 'excited',
        choices: [
          { id: 'scanner', text: 'Tell me about the scanner.', nextNodeId: 'jin_scanner' },
          { id: 'megaphone', text: 'I need the megaphone.', nextNodeId: 'jin_megaphone' },
        ],
      },
      jin_scanner: {
        id: 'jin_scanner',
        speaker: 'Jin',
        text: "The signal scanner detects bio-electric signatures up to 20 metres away — perfect for locating missing persons fast!",
        emotion: 'excited',
        actions: [
          { type: 'unlockTool', toolId: 'signal_scanner' },
          { type: 'increaseTrust', characterId: 'jin', amount: 10 },
        ],
        nextNodeId: null,
      },
      jin_megaphone: {
        id: 'jin_megaphone',
        speaker: 'Jin',
        text: "The megaphone can clear a whole city block in 30 seconds. That extra time could save lives at construction emergencies!",
        emotion: 'excited',
        actions: [
          { type: 'unlockTool', toolId: 'megaphone' },
          { type: 'increaseTrust', characterId: 'jin', amount: 10 },
        ],
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Amber ──────────────────────────────
  {
    id: 'dlg_amber',
    rootNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Amber',
        text: "Hi! I'm Amber, the ambulance rescue bot. I'm always ready for medical emergencies. Can I share a quick health tip?",
        emotion: 'happy',
        nextNodeId: 'amber_tip',
      },
      amber_tip: {
        id: 'amber_tip',
        speaker: 'Amber',
        text: "If someone is hurt, call 119 right away! Don't move an injured person unless there's immediate danger — wait for medical help.",
        emotion: 'thinking',
        nextNodeId: 'amber_offer',
      },
      amber_offer: {
        id: 'amber_offer',
        speaker: 'Amber',
        text: "Would you like to learn some basic first-aid principles? It could help in a real emergency!",
        emotion: 'happy',
        choices: [
          { id: 'yes', text: "Yes, teach me!", nextNodeId: 'amber_medical' },
          { id: 'no', text: "Maybe next time.", nextNodeId: 'amber_bye' },
        ],
      },
      amber_medical: {
        id: 'amber_medical',
        speaker: 'Amber',
        text: "Great! Step one: Stay calm. Step two: Check for danger. Step three: Call for help. Step four: Keep the person warm and still until help arrives.",
        emotion: 'excited',
        actions: [{ type: 'increaseTrust', characterId: 'amber', amount: 8 }],
        nextNodeId: null,
      },
      amber_bye: {
        id: 'amber_bye',
        speaker: 'Amber',
        text: "No problem! You know where to find me if you change your mind. Stay safe out there!",
        emotion: 'happy',
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Dr. Kim (quest giver: quest_house_calls) ──────────────────────────────
  {
    id: 'dlg_dr_kim',
    rootNodeId: 'start',
    nodes: {
      // Routing gate: questCompleted → thank-you | else → check in-progress
      start: {
        id: 'start',
        speaker: 'Dr. Kim',
        text: "Thank you for helping me check on everyone! Brooms Town is healthier for your kindness.",
        emotion: 'excited',
        conditions: [{ type: 'questCompleted', targetId: 'quest_house_calls' }],
        fallbackNodeId: 'dr_progress',
        nextNodeId: null,
      },
      // If quest in progress → show check-in with report-back choice
      dr_progress: {
        id: 'dr_progress',
        speaker: 'Dr. Kim',
        text: "How are the house calls going? Teacher Mi and the harbor should be your first stops.",
        emotion: 'neutral',
        conditions: [{ type: 'questInProgress', targetId: 'quest_house_calls' }],
        fallbackNodeId: 'dr_intro',
        choices: [
          { id: 'report', text: "I've visited Teacher Mi and the harbor.", nextNodeId: 'dr_report' },
          { id: 'still', text: 'Still making the rounds.', nextNodeId: 'dr_still' },
        ],
      },
      dr_report: {
        id: 'dr_report',
        speaker: 'Dr. Kim',
        text: "Wonderful! The whole town benefits when we look out for each other. Thank you, Poli!",
        emotion: 'excited',
        actions: [{ type: 'completeObjective', questId: 'quest_house_calls', objectiveId: 'obj_return_dr' }],
        nextNodeId: null,
      },
      dr_still: {
        id: 'dr_still',
        speaker: 'Dr. Kim',
        text: "Take your time. Teacher Mi is at the school, and the harbor staff are at the docks.",
        emotion: 'neutral',
        nextNodeId: null,
      },
      // Original intro (quest not started)
      dr_intro: {
        id: 'dr_intro',
        speaker: 'Dr. Kim',
        text: "Hello! I'm Dr. Kim, the town doctor. Remember: if you or anyone gets hurt, come to me right away!",
        emotion: 'happy',
        actions: [{ type: 'increaseTrust', characterId: 'dr_kim', amount: 5 }],
        choices: [
          {
            id: 'help',
            text: "How can I help?",
            nextNodeId: 'dr_offer',
            effect: { type: 'startQuest', questId: 'quest_house_calls' },
          },
          { id: 'ok', text: "Take care, Doctor!", nextNodeId: null },
        ],
      },
      dr_offer: {
        id: 'dr_offer',
        speaker: 'Dr. Kim',
        text: "Perfect! Please visit Teacher Mi at the School District and check on the harbor staff — then come back and let me know how they are.",
        emotion: 'excited',
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Harbor Worker ──────────────────────────────
  {
    id: 'dlg_harbor_worker',
    rootNodeId: 'start',
    nodes: {
      // Trust-gated greeting: friends of the docks (trustLevel ≥ 30) get a warmer welcome.
      start: {
        id: 'start',
        speaker: 'Harbor Worker',
        text: "Always great to see a friend of the docks! You've earned a warm welcome here anytime.",
        emotion: 'happy',
        conditions: [{ type: 'trustLevel', characterId: 'harbor_worker', minTrust: 30 }],
        fallbackNodeId: 'greet',
        nextNodeId: 'menu',
      },
      greet: {
        id: 'greet',
        speaker: 'Harbor Worker',
        text: "Hey there! Busy day at the docks — ships coming in, cargo going out. The lifeblood of Brooms Town!",
        emotion: 'neutral',
        nextNodeId: 'menu',
      },
      menu: {
        id: 'menu',
        speaker: 'Harbor Worker',
        text: 'Anything I can help you with?',
        emotion: 'neutral',
        choices: [
          { id: 'ask', text: 'How does the harbor work?', nextNodeId: 'info' },
          { id: 'help', text: 'Need a hand keeping it safe?', nextNodeId: 'helped', effect: { type: 'increaseTrust', characterId: 'harbor_worker', amount: 5 } },
          { id: 'bye', text: 'Just passing through.', nextNodeId: null },
        ],
      },
      info: {
        id: 'info',
        speaker: 'Harbor Worker',
        text: 'Cranes unload the ships, barriers keep the slope safe, and we always watch for water on the road after a storm. Safety first!',
        emotion: 'thinking',
        nextNodeId: null,
      },
      helped: {
        id: 'helped',
        speaker: 'Harbor Worker',
        text: "That means a lot — the docks are safer with you around. Talk to Dockmaster Dan if you want a proper job!",
        emotion: 'excited',
        nextNodeId: null,
      },
    },
  },

  // ────────────────────────────── Site Foreman (quest giver: quest_lost_toolbox) ──────────────────────────────
  {
    id: 'dlg_site_foreman',
    rootNodeId: 'start',
    nodes: {
      // Routing gate: questCompleted → thank-you | else → check in-progress
      start: {
        id: 'start',
        speaker: 'Site Foreman',
        text: "You found clues about my toolbox — and now I've tracked it down! Can't thank you enough.",
        emotion: 'excited',
        conditions: [{ type: 'questCompleted', targetId: 'quest_lost_toolbox' }],
        fallbackNodeId: 'foreman_progress',
        nextNodeId: null,
      },
      // If quest in progress → show check-in with report-back choice
      foreman_progress: {
        id: 'foreman_progress',
        speaker: 'Site Foreman',
        text: "Any luck finding my toolbox? Remember — Harbor Front and Forest Edge are the areas to check.",
        emotion: 'neutral',
        conditions: [{ type: 'questInProgress', targetId: 'quest_lost_toolbox' }],
        fallbackNodeId: 'foreman_intro',
        choices: [
          { id: 'report', text: "I've searched both areas.", nextNodeId: 'foreman_report' },
          { id: 'still', text: 'Still looking.', nextNodeId: 'foreman_still' },
        ],
      },
      foreman_report: {
        id: 'foreman_report',
        speaker: 'Site Foreman',
        text: "You searched both places? Great — the driver must have dropped it along that route. I'll go look. Thank you!",
        emotion: 'happy',
        actions: [{ type: 'completeObjective', questId: 'quest_lost_toolbox', objectiveId: 'obj_report_back' }],
        nextNodeId: null,
      },
      foreman_still: {
        id: 'foreman_still',
        speaker: 'Site Foreman',
        text: "No rush! Check Harbor Front and Forest Edge when you can. Safety first out there!",
        emotion: 'neutral',
        nextNodeId: null,
      },
      // Original intro (quest not started)
      foreman_intro: {
        id: 'foreman_intro',
        speaker: 'Site Foreman',
        text: "Watch your step! Construction zone. We're building great things for Brooms Town. By the way — I've lost my toolbox somewhere on the delivery route. Have you seen it?",
        emotion: 'neutral',
        choices: [
          {
            id: 'help',
            text: "I'll help you find it!",
            nextNodeId: 'foreman_offer',
            effect: { type: 'startQuest', questId: 'quest_lost_toolbox' },
          },
          { id: 'nope', text: "Haven't seen it, sorry.", nextNodeId: null },
        ],
      },
      foreman_offer: {
        id: 'foreman_offer',
        speaker: 'Site Foreman',
        text: "Thanks! The last delivery went from Harbor Front to Forest Edge. Check both spots — it must be along that route!",
        emotion: 'happy',
        nextNodeId: null,
      },
    },
  },
];
