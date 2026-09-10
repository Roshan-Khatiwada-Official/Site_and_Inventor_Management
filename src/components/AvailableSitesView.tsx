import React, { useState, useMemo } from 'react';
import { MapPin, Send, Search, Building2, Clock } from 'lucide-react';
import { Site, SiteRequest, Assignment } from '../types';

interface AvailableSitesViewProps {
  sites: Site[];
  myRequests: SiteRequest[];
  assignments: Assignment[];
  onRequest: (siteId: string) => void;
}

export const AvailableSitesView: React.FC<AvailableSitesViewProps> = ({ sites, myRequests, assignments, onRequest }) => {
  const [q, setQ] = useState('');
  const hoursBySite = useMemo(() => {
    const m = new Map<string, number>();
    assignments.forEach(a => m.set(a.siteId, (m.get(a.siteId) || 0) + (Number(a.hoursLogged) || 0)));
    return m;
  }, [assignments]);
  const statusFor = (siteId: string) => {
    const r = [...myRequests].filter(x => x.siteId === siteId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
    return r?.status;
  };
  const list = sites.filter(s => {
    const t = q.toLowerCase();
    return s.name.toLowerCase().includes(t) || s.code.toLowerCase().includes(t) || s.foundByName.toLowerCase().includes(t);
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Available Sites</h2>
        <p className="text-xs text-slate-500">Sites added by Site Finders. Request the ones you want — an admin approves them.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search sites…"
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {list.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-10 text-center text-slate-400 flex flex-col items-center gap-2">
          <Building2 className="w-6 h-6" /> No available sites right now.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(s => {
          const st = statusFor(s.id);
          return (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
              <div>
                <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                <div className="text-[11px] font-mono text-slate-400">{s.code}</div>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                {(s.latitude || s.longitude) ? (
                  <a className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`} target="_blank" rel="noreferrer">
                    <MapPin className="w-3 h-3" /> {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                  </a>
                ) : null}
                {s.supervisor && <div>Supervisor: {s.supervisor} {s.supervisorContact && `· ${s.supervisorContact}`}</div>}
                <div>Workers: {s.workerCount}</div>
                <div>Found by: {s.foundByName || '—'}</div>
                <div className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="w-3 h-3 text-blue-500" />
                  {(hoursBySite.get(s.id) || 0).toFixed(1)}h of data collected here
                </div>
                {s.note && <div className="text-slate-400">{s.note}</div>}
              </div>
              <div className="mt-auto pt-2">
                {st === 'Pending' ? (
                  <span className="text-xs font-medium text-amber-600">Request pending…</span>
                ) : st === 'Approved' ? (
                  <span className="text-xs font-medium text-emerald-600">Approved — see “My Work”</span>
                ) : (
                  <button onClick={() => onRequest(s.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg">
                    <Send className="w-3.5 h-3.5" /> {st === 'Rejected' ? 'Request again' : 'Request this site'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
