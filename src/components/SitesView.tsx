import React, { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Search } from 'lucide-react';
import { Site, UserAccount } from '../types';
import { SiteModal } from './SiteModal';

interface SitesViewProps {
  mode: 'admin' | 'finder';
  sites: Site[];
  users: UserAccount[];
  currentUser: UserAccount;
  onSave: (site: Site) => void;
  onDelete: (id: string) => void;
}

export const SitesView: React.FC<SitesViewProps> = ({ mode, sites, currentUser, onSave, onDelete }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [q, setQ] = useState('');

  const filtered = sites.filter(s => {
    const t = q.toLowerCase();
    return (
      s.name.toLowerCase().includes(t) ||
      s.code.toLowerCase().includes(t) ||
      s.category.toLowerCase().includes(t) ||
      s.supervisor.toLowerCase().includes(t) ||
      s.foundByName.toLowerCase().includes(t)
    );
  });

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: Site) => { setEditing(s); setModalOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{mode === 'finder' ? 'My Sites' : 'All Sites'}</h2>
          <p className="text-xs text-slate-500">
            {mode === 'finder'
              ? 'Sites you have added. Data collectors can request the available ones.'
              : 'Every field site, and which Site Finder added it.'}
          </p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm">
          <Plus className="w-4 h-4" /> Add Site
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search sites…"
          className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Code</th>
                <th className="px-4 py-2.5 font-semibold">Name</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Location</th>
                <th className="px-4 py-2.5 font-semibold">Supervisor</th>
                <th className="px-4 py-2.5 font-semibold">Workers</th>
                {mode === 'admin' && <th className="px-4 py-2.5 font-semibold">Found by</th>}
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No sites yet.</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{s.code}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {s.name}
                    {s.note && <div className="text-[11px] text-slate-400 font-normal truncate max-w-[220px]">{s.note}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.category || '—'}</td>
                  <td className="px-4 py-2.5">
                    {s.latitude || s.longitude ? (
                      <a
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                        target="_blank" rel="noreferrer"
                      >
                        <MapPin className="w-3 h-3" />
                        {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                      </a>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {s.supervisor || '—'}
                    {s.supervisorContact && <div className="text-[11px] text-slate-400">{s.supervisorContact}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.workerCount}</td>
                  {mode === 'admin' && <td className="px-4 py-2.5 text-slate-600">{s.foundByName || '—'}</td>}
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      s.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SiteModal
        isOpen={modalOpen}
        site={editing}
        currentUser={currentUser}
        onClose={() => setModalOpen(false)}
        onSave={onSave}
      />
    </div>
  );
};
