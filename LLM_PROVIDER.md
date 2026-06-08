# LLM_PROVIDER.md

This file provides guidance to LLMProvider Tooling (llm_provider.ai/code) when working in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:3000 (auto-opens)
npm run check        # tsc -b + eslint (run before every commit)
npm run build        # tsc -b && vite build (must stay green per phase)
npm run typecheck    # tsc -b only
npm run lint         # eslint only
npm run preview      # preview the production build locally
```

There are no tests yet (deferred to Phase 9). Each phase must end with `npm run check` and `npm run build` both green.

## Stack (fixed — do not change)

TypeScript · React 19 · @react-three/fiber 9 · drei · @react-three/rapier · zustand · Tailwind v4 · Vite.  
Path alias: `@/` → `src/`. `main.tsx` mounts without `StrictMode` — double-mount disposes the WebGL context under R3F.

## Project identity

This is the **R3F RPG Builder kit** — a finished, data-driven world-builder with an in-app Edit Mode. The goal is to build the **Robocar POLI rescue RPG on top of it, additively**. The kit core is the edit base; it must not be rewritten to fit POLI.

`docs/prompt.md` describes the game in Unity 6/C# — **ignore that tech stack entirely**. Only the game-design intent survives. `docs/POLI_RPG_KICKOFF.md` is the source of truth for how to build.

## Architecture

```
App.tsx
 ├─ DOM overlays (React/Tailwind) ─ ui/**, InteractionHandler, QuestTrackerController
 └─ <Canvas> (R3F)
     └─ Scene.tsx
         ├─ ambience: DynamicAmbience (play) | EditModeAmbience (edit)
         ├─ <Physics>
         │   ├─ AreaRenderer (current area: ground + set-pieces + gates + editor layers)
         │   └─ Player (Rapier capsule, camera-relative WASD)
         ├─ particles: WeatherParticles, BiomeParticles (play only)
         ├─ FollowCamera
         └─ SceneEditorGizmo (edit only)
```

Both layers share state exclusively through **zustand stores** — never prop-drill between 3D and DOM.

**F1** flips `uiStore.editMode`: swaps lighting to flat-bright, suspends the player, enables transform gizmos and the Editor Hub.

## Key kit seams (where POLI plugs in)

1. **Sibling layer inside `AreaRenderer`** — add new `<YourLayer areaId={areaId} />` between the existing children; the world/terrain/edit layers have no dependency on it.
2. **`setQuestRewardHandler((reward, quest) => …)`** in `stores/questStore.ts` — the single reward seam. Replaces the default item/exp/flag grant.
3. **Player mesh slot** — swap the capsule mesh in `game/player/Player.tsx`; extend via `TransformationController` / `MovementStateMachine` for the vehicle⇄robot mode.

Never modify kit core files for any other reason. Only touch them at the three seams above.

## Data-driven pattern

| Unity concept | Kit equivalent |
|---|---|
| ScriptableObject | Plain TS data modules in `src/data/**` + interfaces in `src/types/**` |
| MonoBehaviour / singletons | zustand stores in `src/stores/` — one system each, no God-class |
| Scenes / Addressables | `data/areas.ts` (`KitArea`) + `AreaRenderer`; area = data |
| NavMesh | Waypoint/path data on road nodes + `useFrame` lerp along a polyline |

### Asset auto-discovery

Drop files into these folders — **no manual registry edits needed**:
- `src/assets/models/` — `.glb`/`.gltf` (subfolders = categories) → Edit Mode → Assets palette
- `src/assets/textures/` — Poly Haven PBR maps (`name_diff/_nor_gl/_arm`) → Environment → ground/splat pickers
- `src/assets/materials/` — whole-material `.glb` + its `.bin` → Environment → GLTF material picker

HMR picks new files without a restart.

## Stores overview

Each store owns one system. Key ones for POLI work:

| Store | Owns |
|---|---|
| `uiStore` | `editMode`, hub open, active panel |
| `playerStore` | Position, `currentAreaId`, `travelToArea`, spawn requests |
| `worldStore` | Discovered areas |
| `worldClockStore` | Real-time day/night, time-of-day, weather |
| `questStore` | Quest state + **`setQuestRewardHandler` seam** |
| `dialogueStore` | Active dialogue traversal |
| `inventoryStore` / `flagStore` / `doorStore` / `progressionStore` | Items, world flags, doors, level/exp |
| `editorNpcStore` | Authored NPCs + dialogue trees (localStorage) |
| `editorQuestStore` | Authored quests (localStorage, merged via `editorQuestToQuest`) |
| `editorTriggerStore` | Authored triggers (localStorage) |
| `editorActivityStore` | Authored mini-games / activities (localStorage) |
| `activityStore` | Runtime activity session |
| `editorEnvironmentStore` | Per-area sky/fog/ground/terrain/patches override (localStorage) |
| `sceneEditStore` | Edit-mode placement layers + gizmo selection + undo |

New POLI systems each get their own store file (`src/stores/<system>Store.ts`).

## Dialogue + condition/effect engine

`types/dialogue.ts` defines `DialogueCondition` and `DialogueEffect` as discriminated unions. To add a new condition or effect kind: extend the union → add a case to `game/evaluateCondition.ts` / `game/executeEffect.ts` → add a case to the `DialogueBox` renderer. The engine is intentionally open-closed.

## POLI-specific rules (non-negotiable)

**Content:**
- Personal/non-commercial/research only. No copyrighted audio/video/scripts/models.
- Placeholders, primitives, legally-free assets, or user-provided assets only.
- Child-friendly: warm, bright, tension-not-horror. **No death, blood, or dismemberment.**
- Rescue failure is always **recoverable** (retry / more time / lower score / extra steps). Never permadeath.
- **No combat** in POLI. Re-theme "Encounters" as non-combat incident stages.

**Source confidence tagging:** Every authored character, location, incident, and tool must carry one of:
`OfficialConfirmed · EpisodeObserved · CrossSourceConfirmed · SecondarySource · FanCompiled · Unverified · GameAdaptation`

Never present `GameAdaptation` content as official canon. On conflicting sources, keep both and record provenance.

**Language:** All code, filenames, comments, commits, and technical docs in **English**. User-facing UI text may be in Traditional Chinese.

## Engineering rules

- SOLID; small focused modules; composition over inheritance; no God-class.
- No per-frame allocations in `useFrame` (no object literals, array spreads, or closures created inside the callback).
- No magic-string IDs — define constants or enums in the relevant `types/` file.
- No UI↔gameplay tight coupling — communicate only through zustand stores.
- No silent `catch` blocks.
- Each phase ends: `npm run check` green, `npm run build` green, fully playable, F1 Edit Mode still works.
- One Conventional Commit per phase (`feat(rescue): …`, `feat(npc): …`, etc.).
- Unfinished work in a phase → `docs/implementation/DEFERRED_WORK.md` with reason + dependencies. Never a `// TODO` pretending to be done.
- Before editing any file: read it first, check `git status`, never overwrite uncommitted work, never delete existing assets/PDFs.

## POLI new systems (additive only)

Add each as new files; wire through the seams. Never edit kit core to accommodate them:

- `src/types/character.ts` + `src/data/characters/**` — character database
- `src/stores/relationshipStore.ts` — player↔NPC trust + NPC↔NPC graph
- `src/stores/npcScheduleStore.ts` + `src/data/schedules/**` — NPC routines driven by `worldClockStore`
- `src/types/incident.ts` + `src/stores/incidentStore.ts` + `src/game/incident/IncidentDirector.ts` — incident spawning
- `src/stores/rescueOperationStore.ts` — rescue pipeline (*Detection → Dispatch → … → Safety Debrief*), each step a mini-game
- `src/types/tool.ts` + `src/stores/toolStore.ts` — rescue tools + loadout
- `TransformationController` / `MovementStateMachine` extending `game/player/Player.tsx` — vehicle⇄robot
- `src/types/safetyLesson.ts` — post-rescue one/two-line reflection (not a quiz pop-up)

## Phased roadmap

Phase 0 (current): Audit + research docs only — build nothing.  
Phase 1: Brooms Town vertical slice (areas as `KitArea`s + Edit Mode placements).  
Phase 2: Vehicle⇄robot transformation.  
Phase 3: NPC schedules + dialogue.  
Phase 4: Quests (3 resident side-quests).  
Phase 5: Incident + rescue pipeline (3 incidents, recoverable failure).  
Phase 6: Traffic (road nodes, NPC vehicle flow, signals).  
Phase 7: Tools / skills / trust / Jin research.  
Phase 8: Weather + random incident director.  
Phase 9: Polish — save/load, localization scaffold, audio placeholders, tests, build docs.
