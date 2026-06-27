import { skipPortfolioDemoToBoss, skipPortfolioDemoToGameplay, startPortfolioDemo } from '../../game/demo/DemoActions';

const btn = 'rounded border border-slate-600 bg-slate-800 px-3 py-2 text-left text-sm font-bold text-slate-100 hover:bg-slate-700';

export const DemoQuickStartPanel = () => (
  <div className="grid gap-2 sm:grid-cols-3">
    <button className={btn} onClick={() => startPortfolioDemo()}>Play Full Intro</button>
    <button className={btn} onClick={() => skipPortfolioDemoToGameplay()}>Skip to Gameplay</button>
    <button className={btn} onClick={() => skipPortfolioDemoToBoss()}>Skip to Boss Demo</button>
  </div>
);
