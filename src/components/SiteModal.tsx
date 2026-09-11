import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { Site, UserAccount, SITE_CATEGORIES } from '../types';
import { todayStr } from '../utils/storage';
import { LocationInput } from './LocationInput';

interface SiteModalProps {
  isOpen: boolean;
  site: Site | null;
  currentUser: UserAccount;
  /** Show the "I'll collect this myself" option (user can collect and has no open site). */
  canReserve?: boolean;
  onClose: () => void;
  onSave: (site: Site) => void;
}

function genCode(): string {
  return `STE-${Date.now().toString().slice(-5)}`;
}

export const SiteModal: React.FC<SiteModalProps> = ({ isOpen, site, currentUser, canReserve = false, onClose, onSave }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [mine, setMine] = useState(false);
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [supervisor, setSupervisor] = useState('');
  const [supervisorContact, setSupervisorContact] = useState('');
  const [workerCount, setWorkerCount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (site) {
      setCode(site.code);
      setName(site.name);
      setCategory(site.category || '');
      setLatitude(site.latitude);
      setLongitude(site.longitude);
      setSupervisor(site.supervisor);
      setSupervisorContact(site.supervisorContact);
      setWorkerCount(site.workerCount);
      setNote(site.note);
      setMine(!!site.reservedById && site.reservedById === currentUser.id);
    } else {
      setCode(genCode());
      setName('');
      setCategory('');
      setLatitude(0);
      setLongitude(0);
      setSupervisor('');
      setSupervisorContact('');
      setWorkerCount(0);
      setNote('');
      setMine(false);
    }
  }, [site, isOpen, currentUser.id]);

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Site Name is required.'); return; }

    let reservedById = site ? site.reservedById : '';
    let reservedByName = site ? site.reservedByName : '';
    if (canReserve) {
      if (mine) { reservedById = currentUser.id; reservedByName = currentUser.name; }
      else if (reservedById === currentUser.id) { reservedById = ''; reservedByName = ''; }
    }

    const draft: Site = {
      id: site ? site.id : `site-${Date.now()}`,
      code: code.trim().toUpperCase() || genCode(),
      name: name.trim(),
      category,
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      supervisor: supervisor.trim(),
      supervisorContact: supervisorContact.trim(),
      workerCount: Number(workerCount) || 0,
      note: note.trim(),
      foundById: site ? site.foundById : currentUser.id,
      foundByName: site ? site.foundByName : currentUser.name,
      reservedById,
      reservedByName,
      status: site ? site.status : 'Available',
      createdAt: site ? site.createdAt : todayStr(),
      updatedAt: site ? site.updatedAt : todayStr(),
    };
    onSave(draft);
    onClose();
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] border border-slate-200 shadow-xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">{site ? 'Edit Site' : 'Add Site'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Site Code</label>
              <input value={code} readOnly className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg text-xs font-mono uppercase cursor-not-allowed" />
              <p className="mt-1 text-[10px] text-slate-400">Auto</p>
            </div>
            <div className="col-span-2">
              <label className="block font-semibold mb-1">Site Name *</label>
              <input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. North Delta Wetlands" className={field} />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Site Type</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={`${field} bg-white`}>
              <option value="">— select a type —</option>
              {SITE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <LocationInput
            lat={latitude}
            lng={longitude}
            onChange={(la, lo) => { setLatitude(la); setLongitude(lo); }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Site Supervisor</label>
              <input value={supervisor} onChange={e => setSupervisor(e.target.value)} placeholder="Name" className={field} />
            </div>
            <div>
              <label className="block font-semibold mb-1">Supervisor Contact</label>
              <input value={supervisorContact} onChange={e => setSupervisorContact(e.target.value)} placeholder="Phone" className={field} />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Number of Workers at this Site</label>
            <input type="number" min="0" value={workerCount} onChange={e => setWorkerCount(parseInt(e.target.value) || 0)} className={field} />
          </div>

          <div>
            <label className="block font-semibold mb-1">Note</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Anything worth recording about this site…" className={field} />
          </div>

          {canReserve && (
            <label className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 cursor-pointer">
              <input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} className="mt-0.5" />
              <span>
                <span className="font-semibold text-slate-800">I will collect this site myself</span>
                <span className="block text-[11px] text-slate-500">
                  Goes straight into your My Work — no request needed, and other collectors won't see it.
                  Leave unchecked to put it in the shared pool instead.
                </span>
              </span>
            </label>
          )}

          {error && <p className="text-rose-600 text-[11px] font-medium">{error}</p>}

          <div className="sticky bottom-0 -mx-6 px-6 pt-3 pb-4 bg-white border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{site ? 'Save' : 'Add Site'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
