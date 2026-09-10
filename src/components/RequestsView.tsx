import React, { useState } from 'react';
import { Check, XCircle, Inbox } from 'lucide-react';
import { SiteRequest } from '../types';

interface RequestsViewProps {
  requests: SiteRequest[];
  onDecide: (requestId: string, approve: boolean) => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ requests, onDecide }) => {
  const [filter, setFilter] = useState<'Pending' | 'All'>('Pending');

  const list = [...requests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    .filter(r => filter === 'All' || r.status === 'Pending');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Site Requests</h2>
          <p className="text-xs text-slate-500">Approve to assign the collector to the site. They keep their fixed equipment kit.</p>
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
                <button onClick={() => onDecide(r.id, true)}
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
    </div>
  );
};
