export const DemoFeatureHighlights = () => (
  <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
    {[
      '10-stage data-driven campaign',
      'R3F / Three.js action gameplay',
      'Character skills, support calls and VFX',
      'AI incident and encounter director',
      'Boss, weakpoint and stage progression runtime',
      'F1 Edit Mode with validation and playtest tools',
    ].map((item) => (
      <div key={item} className="rounded border border-slate-700 bg-slate-950/45 p-2">{item}</div>
    ))}
  </div>
);
