import React, { useMemo, useState } from 'react';
import { X, PackageCheck, Undo2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InventoryItem, UserAccount } from '../types';
import { byNewest } from '../utils/storage';

interface HeldRow {
  item: InventoryItem;
  collectorId: string;
  collectorName: string;
  quantity: number;
}

interface ReturnsViewProps {
  inventory: InventoryItem[];
  dataCollectors: UserAccount[];
  onReturn: (itemId: string, collectorId: string, quantity: number, ok: boolean, note: string) => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({ inventory, dataCollectors, onReturn }) => {
  const [target, setTarget] = useState<HeldRow | null>(null);
  const [workerFilter, setWorkerFilter] = useState('');

  const held = useMemo(() => {
    const rows: HeldRow[] = [];
    inventory.forEach(item => item.holders.forEach(h => {
      if (!workerFilter || h.collectorId === workerFilter) {
        rows.push({ item, collectorId: h.collectorId, collectorName: h.collectorName, quantity: h.quantity });
      }
    }));
    return rows.sort((a, b) => byNewest(a.item, b.item));
  }, [inventory, workerFilter]);

  const recent = useMemo(() => {
    const list: { itemName: string; ok: boolean; note: string; date: string; from: string; fromId: string; quantity: number }[] = [];
    inventory.forEach(i => i.returnLog.forEach(r =>
      list.push({ itemName: i.name, ok: r.ok, note: r.note, date: r.date, from: r.fromCollectorName, fromId: r.fromCollectorId, quantity: r.quantity })
    ));
    return list
      .filter(r => !workerFilter || r.fromId === workerFilter)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
  }, [inventory, workerFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Returns</h2>
        <p className="text-xs text-slate-500">
          Check items back in only when a field worker hands them over — you can check in part of what they hold, or all of it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={workerFilter} onChange={e => setWorkerFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All field workers</option>
          {dataCollectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {workerFilter && (
          <button onClick={() => setWorkerFilter('')} className="text-xs text-blue-600 hover:underline">Clear filter</button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-700">Held by collectors ({held.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Item</th>
                <th className="px-4 py-2.5 font-semibold">Held by</th>
                <th className="px-4 py-2.5 font-semibold">Qty held</th>
                <th className="px-4 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {held.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nothing is out right now.</td></tr>}
              {held.map(row => (
                <tr key={`${row.item.id}-${row.collectorId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {row.item.name} <span className="font-mono text-slate-400">· {row.item.itemId}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{row.collectorName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{row.quantity}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setTarget(row)}
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

      {recent.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 text-xs font-bold text-slate-700">Recent check-ins</div>
          <div className="divide-y divide-slate-100">
            {recent.map((r, i) => (
              <div key={i} className="px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {r.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  <span className="font-medium text-slate-800">{r.quantity} × {r.itemName}</span>
                  {r.from && <span className="text-slate-400">from {r.from}</span>}
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
          onConfirm={(qty, ok, note) => { onReturn(target.item.id, target.collectorId, qty, ok, note); setTarget(null); }}
        />
      )}
    </div>
  );
};

const ReturnModal: React.FC<{
  row: HeldRow;
  onClose: () => void;
  onConfirm: (quantity: number, ok: boolean, note: string) => void;
}> = ({ row, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState<number>(row.quantity);
  const [ok, setOk] = useState<boolean | null>(null);
  const [note, setNote] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ok === null) return;
    if (!ok && !note.trim()) return;
    if (quantity <= 0 || quantity > row.quantity) return;
    onConfirm(quantity, ok, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><PackageCheck className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">Check in item</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          <p>
            Returning <strong className="text-slate-900">{row.item.name}</strong>
            <span className="font-mono text-slate-400"> · {row.item.itemId}</span> from{' '}
            <strong className="text-slate-900">{row.collectorName}</strong>, who holds {row.quantity}.
          </p>

          <div>
            <label className="block font-semibold mb-1">Quantity to check in *</label>
            <input type="number" min={1} max={row.quantity} value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <p className="mt-1 text-[10px] text-slate-400">Check in less than {row.quantity} if only some of it came back.</p>
          </div>

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

          {ok === null && <p className="text-rose-600 text-[11px] font-medium">Choose Yes or No above before confirming.</p>}

          <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" disabled={ok === null || (ok === false && !note.trim()) || quantity <= 0 || quantity > row.quantity}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-40">
              Confirm check-in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
