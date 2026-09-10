import React, { useState, useEffect } from 'react';
import { X, Building2, LocateFixed, FileText } from 'lucide-react';
import { Site, SiteStatus } from '../types';

interface SiteModalProps {
  isOpen: boolean;
  site?: Site | null;
  onClose: () => void;
  onSave: (site: Site) => void;
  /** When true, show the short site-registration form (name, location, supervisor, note only). */
  compact?: boolean;
}

function generateSiteCode(): string {
  return `STE-${Date.now().toString().slice(-5)}`;
}

export const SiteModal: React.FC<SiteModalProps> = ({
  isOpen,
  site,
  onClose,
  onSave,
  compact = false,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(45.5);
  const [lng, setLng] = useState<number>(-122.5);
  const [status, setStatus] = useState<SiteStatus>('Active');
  const [supervisor, setSupervisor] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [targetDailyUnits, setTargetDailyUnits] = useState<number>(30);
  const [unitType, setUnitType] = useState('samples');
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [safetyNotes, setSafetyNotes] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [workerCount, setWorkerCount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationMsg, setLocationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (site) {
      setCode(site.code);
      setName(site.name);
      setRegion(site.region);
      setAddress(site.address);
      setLat(site.coordinates.lat);
      setLng(site.coordinates.lng);
      setStatus(site.status);
      setSupervisor(site.supervisor);
      setContactPhone(site.contactPhone);
      setTargetDailyUnits(site.targetDailyUnits);
      setUnitType(site.unitType);
      setSelectedCerts(site.requiredCertifications || []);
      setSafetyNotes(site.safetyNotes || '');
      setAccessCode(site.accessCode || '');
      setWorkerCount(site.workerCount || 0);
      setNotes(site.notes || '');
    } else {
      // Default new site
      setCode(generateSiteCode());
      setName('');
      setRegion('');
      setAddress('');
      setLat(0);
      setLng(0);
      setStatus('Active');
      setSupervisor('');
      setContactPhone('');
      setTargetDailyUnits(0);
      setUnitType('units');
      setSelectedCerts([]);
      setSafetyNotes('');
      setAccessCode('');
      setWorkerCount(0);
      setNotes('');
    }
    setLocationMsg(null);
  }, [site, isOpen]);

  if (!isOpen) return null;

  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationMsg('This device does not support location.');
      return;
    }
    setLocating(true);
    setLocationMsg(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
        setLocationMsg('Location updated to your current position.');
      },
      err => {
        setLocating(false);
        setLocationMsg(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow location access and try again.'
            : 'Could not read your location. Try again outdoors.'
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const savedSite: Site = {
      id: site ? site.id : `site-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      region: region.trim(),
      address: address.trim(),
      coordinates: { lat: Number(lat) || 0, lng: Number(lng) || 0 },
      status,
      supervisor: supervisor.trim(),
      contactPhone: contactPhone.trim(),
      targetDailyUnits: Number(targetDailyUnits) || 0,
      unitType: unitType.trim() || 'units',
      requiredCertifications: selectedCerts,
      safetyNotes: safetyNotes.trim(),
      accessCode: accessCode.trim(),
      workerCount: Number(workerCount) || 0,
      notes: notes.trim(),
      createdAt: site ? site.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(savedSite);
    onClose();
  };

  const locationBlock = (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block font-semibold text-slate-700">Location (Latitude / Longitude)</label>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
        >
          <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'Getting location…' : 'Use current location'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(parseFloat(e.target.value))}
          placeholder="Latitude"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(parseFloat(e.target.value))}
          placeholder="Longitude"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      {locationMsg && <p className="mt-1 text-[11px] text-slate-500">{locationMsg}</p>}
    </div>
  );

  const workersBlock = (
    <div>
      <label className="block font-semibold text-slate-700 mb-1">Number of Workers at this Site</label>
      <input
        type="number"
        min="0"
        value={workerCount}
        onChange={(e) => setWorkerCount(parseInt(e.target.value) || 0)}
        placeholder="e.g. 8"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );

  const shell = (children: React.ReactNode, subtitle: string) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {site ? 'Edit Site' : 'Add New Site'}
              </h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  const footer = (
    <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
      >
        {site ? 'Save Changes' : 'Add Site'}
      </button>
    </div>
  );

  // ---- Compact form: name, location, supervisor, note only ----
  if (compact) {
    return shell(
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Site Code</label>
            <input
              type="text"
              value={code}
              readOnly
              className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg text-xs font-mono uppercase cursor-not-allowed"
            />
            <p className="mt-1 text-[10px] text-slate-400">Auto-generated</p>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Site Name *</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Delta Wetlands"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {locationBlock}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Site Supervisor Name</label>
            <input
              type="text"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supervisor Contact</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +977-98XXXXXXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {workersBlock}

        <div>
          <label className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Note
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth recording about this site…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {footer}
      </form>,
      'Fill in the site details. Changes save to the Google Sheet automatically.'
    );
  }

  // ---- Full form (Admin / Operations Manager) ----
  return shell(
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Site Code *</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. NDW-01"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Site Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. North Delta Wetlands Eco-Reserve"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Operational Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SiteStatus)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="Active">Active (Operations Ongoing)</option>
            <option value="Planned">Planned (Future Launch)</option>
            <option value="Paused">Paused (Temporary Standstill)</option>
            <option value="Completed">Completed (Monitoring Concluded)</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Region / Sector</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Pacific Northwest - Sector 3"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">Physical Address / Access Road</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Mile Marker 44, Riverbend Access Road, OR"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {locationBlock}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Site Supervisor Name</label>
          <input
            type="text"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            placeholder="e.g. Dr. Sarah Jenkins"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Supervisor Contact Phone</label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="e.g. +1 (503) 555-0182"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {workersBlock}

      <div>
        <label className="flex items-center gap-1.5 font-semibold text-slate-700 mb-1">
          <FileText className="w-3.5 h-3.5 text-slate-400" /> Note
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General note about this site…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {footer}
    </form>,
    'Configure site name, location, supervisor and workforce'
  );
};
