import { useMemo, useState } from 'react';
import { MODEL_ASSET_LIST } from '../../../data/modelLibrary';
import { buildSuperWingsModelIntakeRows, type SuperWingsIntakeStatus, type SuperWingsModelIntakeRow } from '../../../data/game/superWingsModels';
import { useModelStudioStore } from '../../../stores/modelStudioStore';
import { inp, lbl } from '../editorShared';

function statusClass(status: SuperWingsIntakeStatus): string {
  if (status === 'assigned') return 'bg-emerald-700/30 text-emerald-100';
  if (status === 'hidden') return 'bg-amber-700/30 text-amber-100';
  return 'bg-slate-700/50 text-slate-200';
}

const Chip = ({ children, className = 'bg-slate-800 text-slate-300' }: { children: string; className?: string }) => (
  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${className}`}>{children}</span>
);

const Row = ({ row, scaleOverride }: { row: SuperWingsModelIntakeRow; scaleOverride?: number }) => (
  <tr className="border-b border-slate-800/70 align-top">
    <td className="max-w-[18rem] px-2 py-1.5">
      <div className="truncate text-[11px] font-semibold text-slate-100" title={row.assetId}>{row.label}</div>
      <div className="truncate text-[10px] text-slate-500" title={row.assetId}>{row.assetId}</div>
    </td>
    <td className="px-2 py-1.5">
      <Chip className={statusClass(row.status)}>{row.status}</Chip>
    </td>
    <td className="px-2 py-1.5 text-[11px] text-slate-300">{row.characterName ?? '-'}</td>
    <td className="px-2 py-1.5 text-[11px] text-slate-300">{row.kind}</td>
    <td className="px-2 py-1.5">
      <div className="flex flex-wrap gap-1">
        {row.isPrimaryRobot && <Chip className="bg-emerald-700/30 text-emerald-100">primary robot</Chip>}
        {row.isPrimaryPlane && <Chip className="bg-sky-700/30 text-sky-100">primary plane</Chip>}
        {row.isHidden && <Chip className="bg-amber-700/30 text-amber-100">hidden</Chip>}
        {row.isInPoseModels && <Chip className="bg-violet-700/30 text-violet-100">poseModels</Chip>}
        {!row.isPrimaryRobot && !row.isPrimaryPlane && !row.isHidden && !row.isInPoseModels && <span className="text-[10px] text-slate-600">-</span>}
      </div>
    </td>
    <td className="px-2 py-1.5 text-[11px] text-slate-300">{scaleOverride == null ? '-' : Math.round(scaleOverride * 1000) / 1000}</td>
  </tr>
);

export const ModelIntakeQaTab = () => {
  const overrides = useModelStudioStore((s) => s.overrides);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SuperWingsIntakeStatus | 'all'>('all');
  const rows = useMemo(() => buildSuperWingsModelIntakeRows(MODEL_ASSET_LIST), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false;
      if (!q) return true;
      return row.assetId.toLowerCase().includes(q) || row.label.toLowerCase().includes(q) || (row.characterName ?? '').toLowerCase().includes(q);
    });
  }, [query, rows, status]);
  const assigned = rows.filter((row) => row.status === 'assigned').length;
  const hidden = rows.filter((row) => row.status === 'hidden').length;
  const unassigned = rows.filter((row) => row.status === 'unassigned').length;
  const scaleOverrides = rows.filter((row) => overrides[row.assetId]?.scale != null).length;

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className={lbl}>Model Intake QA</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Chip className="bg-emerald-700/30 text-emerald-100">{`Assigned ${assigned}`}</Chip>
          <Chip className="bg-amber-700/30 text-amber-100">{`Hidden ${hidden}`}</Chip>
          <Chip className="bg-slate-700/50 text-slate-200">{`Unassigned ${unassigned}`}</Chip>
          <Chip className="bg-violet-700/30 text-violet-100">{`Scale overrides ${scaleOverrides}`}</Chip>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_10rem] gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search asset, label, or character..." className={inp} />
        <select value={status} onChange={(event) => setStatus(event.target.value as SuperWingsIntakeStatus | 'all')} className={inp}>
          <option value="all">all statuses</option>
          <option value="assigned">assigned</option>
          <option value="hidden">hidden</option>
          <option value="unassigned">unassigned</option>
        </select>
      </div>

      <div className="max-h-[58vh] overflow-auto rounded border border-slate-800/80 bg-slate-950/40">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-slate-950 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-2 py-1.5">Asset</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5">Character</th>
              <th className="px-2 py-1.5">Kind</th>
              <th className="px-2 py-1.5">Flags</th>
              <th className="px-2 py-1.5">Scale</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => <Row key={row.assetId} row={row} scaleOverride={overrides[row.assetId]?.scale} />)}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-3 text-[11px] text-slate-500">No Super Wings models match this filter.</div>}
      </div>
      <p className="text-[10px] text-slate-500">Read-only view of automatic intake. Pin/hide overrides stay in the model derivation module; Model Studio controls transforms and scale.</p>
    </div>
  );
};
