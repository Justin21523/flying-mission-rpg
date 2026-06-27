# Aero Rescue RPG

A portfolio-ready Web 3D rescue-action RPG demo with campaign progression, stage runtime, combat skills, support calls, AI incidents, bosses, and in-game editing tools.

## Tech Stack

- React 19, TypeScript, Vite
- Three.js, React Three Fiber, Drei, Rapier
- Zustand for runtime, editor, settings, save, and progression state
- Vitest for runtime, data, validation, and integration tests
- Tailwind CSS for HUD and tool UI

## Core Features

- Demo Landing flow with Start Demo, Continue, Stage Select, Edit Mode Showcase, Controls, Settings, and project notes.
- Campaign and stage progression for Rescue Vanguard Campaign with 10 data-driven stages.
- Stage runtime that loads environment themes, level layouts, objectives, incidents, encounters, support rules, and bosses.
- Combat runtime with character skills, attack archetypes, status effects, support abilities, and VFX feedback.
- Enemy encounter packs, elite pressure, boss support waves, incident templates, obstacle packs, rewards, unlocks, and validation.
- Edit Mode tools for campaign, stage, level, environment, encounter, pacing, balance, playtest reports, and JSON export.
- Demo Mode settings for guided hints, controls overlay, debug hiding, VFX intensity, camera comfort, accessibility, and reset.

## Gameplay Flow

```text
Demo Landing
→ Stage Briefing
→ Character Select
→ Launch / Flight / Transformation / Landing
→ Stage Gameplay
→ Incident / Combat / Obstacle / Boss Objective
→ Stage Clear
→ Reward / Unlock
→ Campaign Map
```

## How To Run

```bash
npm install
npm run dev
```

Open the Vite URL in a browser. The app starts at the Demo Landing screen in Portfolio Demo Mode.

## How To Build

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

The production output is generated in `dist/` and is suitable for static hosting.

## How To Play The Demo

- Click `Start Demo` for the recommended Stage 1 briefing.
- Use the quick-start options to skip to gameplay or the boss demo.
- Follow the objective HUD in the upper-left area.
- Use the Stage Clear panel to return to Campaign Map and unlock the next stage.
- Press `F1` to open Edit Mode for tool showcase.

## Controls

- `WASD`: move
- `Shift`: sprint / boost where available
- `Q`: character ability
- `F`: context action
- `T`: transformation flow where available
- `C`: character swap where available
- `Esc`: settings / pause menu
- `F1`: Edit Mode

## Portfolio Notes

This project intentionally uses placeholder-friendly assets and original internal character IDs. The focus is on game architecture, campaign flow, runtime integration, editor tooling, validation, VFX readability, and web deployment readiness.

## Screenshots

Add captured images from:

- Demo Landing
- Campaign Map
- Stage Briefing
- Stage Gameplay
- Boss / Combat feedback
- Stage Clear
- Edit Mode Home

## Documentation

- [Portfolio Demo Guide](docs/PORTFOLIO_DEMO.md)
- [Gameplay Systems](docs/GAMEPLAY_SYSTEMS.md)
- [Edit Mode Guide](docs/EDIT_MODE_GUIDE.md)
- [Demo Recording Guide](docs/DEMO_RECORDING_GUIDE.md)
- [Portfolio Shot List](docs/PORTFOLIO_SHOT_LIST.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [QA Checklist](docs/QA_CHECKLIST.md)
- [Release Candidate Report](docs/RELEASE_CANDIDATE_REPORT.md)

## License

MIT.
