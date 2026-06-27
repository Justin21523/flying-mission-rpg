import { runDemoValidationChecklist } from '../../game/demo/DemoValidationRunner';

export const DemoValidationPanel = () => {
  const report = runDemoValidationChecklist();
  return (
    <div className="space-y-1 rounded border border-slate-700 bg-slate-950/50 p-3 text-xs text-slate-300">
      <div className="font-bold text-sky-200">Demo Checklist: {report.status}</div>
      {report.items.map((item) => (
        <div key={item.id} className={item.status === 'pass' ? 'text-emerald-300' : item.status === 'warning' ? 'text-amber-300' : 'text-rose-300'}>
          {item.status === 'pass' ? '✓' : item.status === 'warning' ? '!' : '✗'} {item.label}{item.detail ? ` — ${item.detail}` : ''}
        </div>
      ))}
    </div>
  );
};
