import { resetPortfolioDemo, skipPortfolioDemoToGameplay, startPortfolioDemo } from '../../game/demo/DemoActions';
import { runDemoValidationChecklist } from '../../game/demo/DemoValidationRunner';
import { useUiStore } from '../../stores/uiStore';

export const EditModeQuickActions = () => (
  <div className="grid gap-2 md:grid-cols-2">
    <Action label="Start demo briefing" detail="Open Stage 1 briefing through Campaign runtime." onClick={() => startPortfolioDemo()} />
    <Action label="Skip to gameplay" detail="Boot Stage 1 runtime directly for playtest." onClick={() => skipPortfolioDemoToGameplay()} />
    <Action label="Run demo checklist" detail="Validate the portfolio demo flow." onClick={() => console.info('[demo-checklist]', runDemoValidationChecklist())} />
    <Action label="Reset demo data" detail="Clear campaign demo progression." onClick={() => resetPortfolioDemo()} />
    <Action label="Close Edit Mode" detail="Return to clean demo presentation." onClick={() => useUiStore.getState().toggleEditMode()} />
  </div>
);

const Action = ({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) => (
  <button onClick={onClick} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-left hover:bg-slate-800/80">
    <div className="text-sm font-bold text-slate-100">{label}</div>
    <div className="mt-1 text-[11px] text-slate-400">{detail}</div>
  </button>
);
