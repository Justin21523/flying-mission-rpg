import { resetPortfolioDemo } from '../../game/demo/DemoActions';

export const DemoResetPanel = () => (
  <button onClick={resetPortfolioDemo} className="rounded border border-rose-500/50 bg-rose-950/35 px-3 py-2 text-sm font-bold text-rose-100 hover:bg-rose-900/50">
    Reset Demo Progress
  </button>
);
