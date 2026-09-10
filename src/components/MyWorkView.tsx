import React, { useState } from 'react';
import { Clock, MapPin, Package, CheckCircle2, Briefcase } from 'lucide-react';
import { Assignment, Site, InventoryItem, CollectionSession } from '../types';
import { todayStr, byNewest } from '../utils/storage';

interface MyWorkViewProps {
  assignments: Assignment[];
  sites: Site[];
  myKit: InventoryItem[];
  onFinish: (assignmentId: string, session: CollectionSession | null) => void;
  onReopen: (assignmentId: string) => void;
}

export const MyWorkView: React.FC<MyWorkViewProps> = ({ assignments, sites, myKit, onFinish, onReopen }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">My Work</h2>
        <p className="text-xs text-slate-500">Enter the hours of data you collected, then finish the site.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-slate-400" /> My equipment
        </div>
        {myKit.length === 0 ? (
          <p className="text-xs text-slate-400">No equipment assigned to you yet — ask the admin.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {myKit.map(i => (
              <span key={i.id} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-600">
                <Package className="w-3 h-3" /> {i.name} <span className="font-mono text-slate-400">· {i.itemId}</span>
              </span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 mt-2">You use this same kit at every site. Return it to the admin only when you're done for good.</p>
      </div>

      {assignments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-10 text-center text-slate-400 flex flex-col items-center gap-2">
          <Briefcase className="w-6 h-6" /> Nothing assigned yet. Request a site under “Available Sites”.
        </div>
      )}

      <div className="space-y-3">
        {[...assignments].sort(byNewest).map(a => (
          <AssignmentCard
            key={a.id}
            a={a}
            site={sites.find(s => s.id === a.siteId)}
            onFinish={onFinish}
            onReopen={onReopen}
          />
        ))}
      </div>
    </div>
  );
};

const AssignmentCard: React.FC<{
  a: Assignment;
  site?: Site;
  onFinish: (id: string, s: CollectionSession | null) => void;
  onReopen: (id: string) => void;
}> = ({ a, site, onFinish, onReopen }) => {
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    const session: CollectionSession | null = h && h > 0 ? { date, hours: h, note: note.trim() || undefined } : null;
    if (!session && !window.confirm('Finish this site with no extra hours entered?')) return;
    onFinish(a.id, session);
    setHours(''); setNote('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-bold text-slate-900">{a.siteName}</div>
          {site && (site.latitude || site.longitude) && (
            <a className="text-xs inline-flex items-center gap-1 text-blue-600 hover:underline"
              href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`} target="_blank" rel="noreferrer">
              <MapPin className="w-3 h-3" /> {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </a>
          )}
          {site?.supervisor && <div className="text-xs text-slate-500">Supervisor: {site.supervisor} {site.supervisorContact && `· ${site.supervisorContact}`}</div>}
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-sm font-bold text-slate-800">
            <Clock className="w-4 h-4 text-blue-500" /> {a.hoursLogged.toFixed(1)}h total
          </div>
          <div className="mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              a.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>{a.status}</span>
          </div>
        </div>
      </div>

      {a.sessions.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2 text-xs text-slate-500 space-y-0.5">
          {a.sessions.map((s, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{s.date}{s.note ? ` — ${s.note}` : ''}</span>
              <span className="font-medium text-slate-700">{s.hours}h</span>
            </div>
          ))}
        </div>
      )}

      {a.status === 'Active' ? (
        <form onSubmit={submit} className="mt-3 border-t border-slate-100 pt-3 space-y-2 text-xs">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-2 py-1.5 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Hours of data collected</label>
              <input type="number" step="0.25" min="0" value={hours} onChange={e => setHours(e.target.value)} placeholder="e.g. 3.5"
                className="w-28 px-2 py-1.5 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block font-semibold text-slate-600 mb-1">Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded-lg" />
            </div>
          </div>
          <button type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
            <CheckCircle2 className="w-4 h-4" /> Submit hours &amp; finish site
          </button>
        </form>
      ) : (
        <button onClick={() => onReopen(a.id)} className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 hover:text-slate-800 underline block">
          Re-open this site (add more hours)
        </button>
      )}
    </div>
  );
};
