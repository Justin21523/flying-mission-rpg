# Aero Mission RPG

A high-performance, mission-based RPG built with React, Three.js, and Phaser. Take command of versatile hero units capable of transforming between robot and vehicle modes to complete various rescue and tactical missions across diverse environments.

## Features

- **Transforming Hero Units:** Switch seamlessly between specialized robot forms for ground interaction and vehicle modes for rapid deployment and flight.
- **Mission-Driven Gameplay:** Complete a variety of objectives including rescues, deliveries, and tactical operations.
- **Dynamic 3D Environments:** Explore detailed worlds rendered with React Three Fiber, featuring physics-based interactions and realistic lighting.
- **Comprehensive Editor Suite:** Built-in tools for managing character models, path following, collision zones, and mission scenarios.
- **Advanced State Management:** Robust game logic powered by Zustand, ensuring smooth performance and reliable save/load functionality.

## Tech Stack

- **Frontend:** React 19, TypeScript
- **3D Engine:** Three.js with @react-three/fiber and @react-three/drei
- **2D/UI Engine:** Phaser 4
- **Physics:** @react-three/rapier
- **State Management:** Zustand
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite

## Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Justin21523/flying-mission-rpg.git
   cd flying-mission-rpg
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run build`: Build the project for production.
- `npm run lint`: Run ESLint to check for code quality issues.
- `npm run typecheck`: Run TypeScript compiler check.
- `npm test`: Run unit tests with Vitest.
- `npm run e2e`: Run end-to-end tests with Playwright.

## Project Structure

- `src/app`: Main React components and layout.
- `src/game`: Core game logic, systems, and engines.
- `src/stores`: Zustand stores for game state.
- `src/data`: Game configuration, mission data, and model libraries.
- `src/ui`: Reusable UI components.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
