import React, { useState, useEffect } from 'react';
import { X, Building2, LocateFixed, MapPin } from 'lucide-react';
import { Site, UserAccount } from '../types';
import { todayStr } from '../utils/storage';
import { MapPicker } from './MapPicker';

interface SiteModalProps {
  isOpen: boolean;
  site: Site | null;
  currentUser: UserAccount;
  onClose: () => void;
  onSave: (site: Site) => void;
}

function genCode(): string {
  return `STE-${Date.now().toString().slice(-5)}`;
}

export const SiteModal: React.FC<SiteModalProps> = ({ isOpen, site, currentUser, onClose, onSave }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [supervisor, setSupervisor] = useState('');
  const [supervisorContact, setSupervisorContact] = useState('');
  const [workerCount, setWorkerCount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [locating, setLocating] = useState(false);
  const [locMsg, setLocMsg] = useState<string | null>(null);

  useEffect(() => {
    if (site) {
      setCode(site.code);
      setName(site.name);
      setLatitude(site.latitude);
      setLongitude(site.longitude);
      setSupervisor(site.supervisor);
      setSupervisorContact(site.supervisorContact);
      setWorkerCount(site.workerCount);
      setNote(site.note);
    } else {
      setCode(genCode());
      setName('');
      setLatitude(0);
      setLongitude(0);
      setSupervisor('');
      setSupervisorContact('');
      setWorkerCount(0);
      setNote('');
    }
    setLocMsg(null);
  }, [site, isOpen]);

  if (!isOpen) return null;

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocMsg('This device does not support location.');
      return;
    }
    setLocating(true);
    setLocMsg(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        setLocMsg('Location set to your current position.');
      },
      err => {
        setLocating(false);
        setLocMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow it and try again.'
            : 'Could not read your location. Try again outdoors.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const draft: Site = {
      id: site ? site.id : `site-${Date.now()}`,
      code: code.trim().toUpperCase() || genCode(),
      name: name.trim(),
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      supervisor: supervisor.trim(),
      supervisorContact: supervisorContact.trim(),
      workerCount: Number(workerCount) || 0,
      note: note.trim(),
      foundById: site ? site.foundById : currentUser.id,
      foundByName: site ? site.foundByName : currentUser.name,
      status: site ? site.status : 'Available',
      createdAt: site ? site.createdAt : todayStr(),
    };
    onSave(draft);
    onClose();
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
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

        <form onSubmit={submit} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-3 gap-3">
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
            <label className="block font-semibold mb-1">Location</label>
            <p className="text-[11px] text-slate-500 mb-2 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-slate-400" />
              <span>
                <strong>On site?</strong> Tap “Use current location”. &nbsp;
                <strong>Remote?</strong> Tap the map or drag the pin to where the site is.
              </span>
            </p>

            <MapPicker
              lat={latitude}
              lng={longitude}
              onChange={(la, lo) => { setLatitude(la); setLongitude(lo); setLocMsg(null); }}
            />

            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={useCurrentLocation} disabled={locating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60">
                <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
                {locating ? 'Getting location…' : 'Use current location'}
              </button>
              <span className="text-[11px] font-mono text-slate-500">
                {latitude || longitude ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : 'not set'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <input type="number" step="any" value={latitude} onChange={e => setLatitude(parseFloat(e.target.value) || 0)} placeholder="Latitude" className={`${field} font-mono`} />
              <input type="number" step="any" value={longitude} onChange={e => setLongitude(parseFloat(e.target.value) || 0)} placeholder="Longitude" className={`${field} font-mono`} />
            </div>
            {locMsg && <p className="mt-1 text-[11px] text-slate-500">{locMsg}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">Cancel</button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm">{site ? 'Save' : 'Add Site'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
