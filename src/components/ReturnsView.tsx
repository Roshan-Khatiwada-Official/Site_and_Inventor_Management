import React, { useMemo, useState } from 'react';
import { X, PackageCheck, Undo2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Assignment, InventoryItem } from '../types';

interface ReturnsViewProps {
  assignments: Assignment[];
  inventory: InventoryItem[];
  onReturn: (assignmentId: string, itemId: string, ok: boolean, note: string) => void;
}

interface OutRow {
  assignmentId: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  collectorName: string;
  siteName: string;
  since: string;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({ assignments, inventory, onReturn }) => {
  const [target, setTarget] = useState<OutRow | null>(null);

  const itemById = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory]);

  const rows: OutRow[] = useMemo(() => {
    const out: OutRow[] = [];
    assignments.forEach(a => {
      a.inventoryItemIds.forEach(id => {
        const it = itemById.get(id);
        out.push({
          assignmentId: a.id,
          itemId: id,
          itemName: it?.name || id,
          itemCode: it?.itemId || '',
          collectorName: a.collectorName,
          siteName: a.siteName,
          since: a.createdAt,
        });
      });
    });
    return out;
  }, [assignments, itemById]);

  const recentReturns = useMemo(() => {
    const list: { itemName: string; ok: boolean; note: string; date: string; by: string; collector: string }[] = [];
    assignments.forEach(a => a.returnedItems.forEach(r =>
      list.push({ itemName: r.itemName, ok: r.ok, note: r.note, date: r.date, by: r.byName, collector: a.collectorName })
    ));
    return list.sort((x, y) => y.date.localeCompare(x.date)).slice(0, 20);
  }, [assignments]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Returns</h2>
        <p className="text-xs text-slate-500">Items currently out with data collectors. Check them in when returned.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-700">Out on assignment ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Item</th>
                <th className="px-4 py-2.5 font-semibold">With</th>
                <th className="px-4 py-2.5 font-semibold">Site</th>
                <th className="px-4 py-2.5 font-semibold">Since</th>
                <th className="px-4 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Nothing is out right now.</td></tr>}
              {rows.map(r => (
                <tr key={`${r.assignmentId}-${r.itemId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {r.itemName} {r.itemCode && <span className="font-mono text-slate-400">· {r.itemCode}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{r.collectorName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.siteName}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.since}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setTarget(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">
                      <Undo2 className="w-3.5 h-3.5" /> Check in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recentReturns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-700">Recent check-ins</div>
          <div className="divide-y divide-slate-100">
            {recentReturns.map((r, i) => (
              <div key={i} className="px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {r.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  <span className="font-medium text-slate-800">{r.itemName}</span>
                  <span className="text-slate-400">from {r.collector}</span>
                  {!r.ok && r.note && <span className="text-rose-600">— {r.note}</span>}
                </div>
                <span className="text-slate-400">{r.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {target && (
        <ReturnModal
          row={target}
          onClose={() => setTarget(null)}
          onConfirm={(ok, note) => { onReturn(target.assignmentId, target.itemId, ok, note); setTarget(null); }}
        />
      )}
    </div>
  );
};

const ReturnModal: React.FC<{
  row: OutRow;
  onClose: () => void;
  onConfirm: (ok: boolean, note: string) => void;
}> = ({ row, onClose, onConfirm }) => {
  const [ok, setOk] = useState<boolean | null>(null);
  const [note, setNote] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ok === null) return;
    if (!ok && !note.trim()) return;
    onConfirm(ok, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><PackageCheck className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">Check in item</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 text-xs text-slate-700">
          <p>
            Returning <strong className="text-slate-900">{row.itemName}</strong>
            {row.itemCode && <span className="font-mono text-slate-400"> · {row.itemCode}</span>} from{' '}
            <strong className="text-slate-900">{row.collectorName}</strong> ({row.siteName}).
          </p>

          <div>
            <p className="font-semibold mb-1.5">Is everything in good condition?</p>
            <p className="text-[11px] text-slate-500 mb-2">Check the camera, lens, cables, battery and body.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOk(true)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${ok === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                Yes — all OK
              </button>
              <button type="button" onClick={() => setOk(false)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition ${ok === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                No — there is a problem
              </button>
            </div>
          </div>

          {ok === false && (
            <div>
              <label className="block font-semibold mb-1">What is wrong? *</label>
              <textarea required rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="e.g. camera lens scratched, one cable missing"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <p className="mt-1 text-[11px] text-rose-600">This item will be flagged in the inventory.</p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" disabled={ok === null || (ok === false && !note.trim())}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-40">
              Confirm return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
