import React, { useState } from 'react';
import { Check, XCircle, Inbox, X, ClipboardCheck } from 'lucide-react';
import { SiteRequest, InventoryItem } from '../types';

interface RequestsViewProps {
  requests: SiteRequest[];
  inventory: InventoryItem[];
  itemsOut: Map<string, { collectorName: string; siteName: string; assignmentId: string }>;
  onDecide: (requestId: string, approve: boolean, itemIds?: string[]) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ requests, inventory, itemsOut, onDecide }) => {
  const [filter, setFilter] = useState<'Pending' | 'All'>('Pending');
  const [approving, setApproving] = useState<SiteRequest | null>(null);

  const list = [...requests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .filter(r => filter === 'All' || r.status === 'Pending');

  const selectable = inventory.filter(i => i.condition !== 'Flagged' && !itemsOut.has(i.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Site Requests</h2>
          <p className="text-xs text-slate-500">Approve to assign the collector to the site — and hand them inventory items.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['Pending', 'All'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium ${filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {list.length === 0 && (
          <div className="px-4 py-10 text-center text-slate-400 flex flex-col items-center gap-2">
            <Inbox className="w-6 h-6" /> No {filter === 'Pending' ? 'pending ' : ''}requests.
          </div>
        )}
        {list.map(r => (
          <div key={r.id} className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs">
              <div className="font-semibold text-slate-900">{r.collectorName}</div>
              <div className="text-slate-500">wants <span className="font-medium text-slate-700">{r.siteName}</span></div>
              <div className="text-[11px] text-slate-400">{new Date(r.requestedAt).toLocaleString()}</div>
            </div>
            {r.status === 'Pending' ? (
              <div className="flex gap-2">
                <button onClick={() => setApproving(r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg">
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => onDecide(r.id, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>{r.status}</span>
            )}
          </div>
        ))}
      </div>

      {approving && (
        <ApproveModal
          request={approving}
          items={selectable}
          onClose={() => setApproving(null)}
          onConfirm={(itemIds) => { onDecide(approving.id, true, itemIds); setApproving(null); }}
        />
      )}
    </div>
  );
};

const ApproveModal: React.FC<{
  request: SiteRequest;
  items: InventoryItem[];
  onClose: () => void;
  onConfirm: (itemIds: string[]) => void;
}> = ({ request, items, onClose, onConfirm }) => {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><ClipboardCheck className="w-4 h-4" /></div>
            <h3 className="font-bold text-slate-900 text-base">Approve &amp; assign items</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-700">
          <p>
            Assign <strong className="text-slate-900">{request.collectorName}</strong> to{' '}
            <strong className="text-slate-900">{request.siteName}</strong>.
          </p>
          <div>
            <label className="block font-semibold mb-1.5">Inventory items to hand over ({picked.length} selected)</label>
            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 && <p className="px-3 py-3 text-slate-400">No items available to assign.</p>}
              {items.map(i => (
                <label key={i.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={picked.includes(i.id)} onChange={() => toggle(i.id)} />
                  <span className="font-mono text-slate-500">{i.itemId}</span>
                  <span className="text-slate-800">{i.name}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">You can also change items later from the Assignments tab.</p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button onClick={() => onConfirm(picked)}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm">
              Approve{picked.length ? ` with ${picked.length} item${picked.length > 1 ? 's' : ''}` : ' (no items)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
