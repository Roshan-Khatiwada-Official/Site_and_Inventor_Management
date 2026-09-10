import React, { useState } from 'react';
import { LocateFixed, Link2, MapPin } from 'lucide-react';
import { MapPicker } from './MapPicker';

interface LocationInputProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

/** Pull "lat,lng" out of a Google Maps link (or a plain "lat, lng" paste). */
function parseLatLng(text: string): { lat: number; lng: number } | null {
  const t = text.trim();
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,          // .../@27.71,85.32,15z
    /[?&](?:q|ll|center)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?q=27.71,85.32
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,       // place data !3d..!4d..
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/, // plain "27.71, 85.32"
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export const LocationInput: React.FC<LocationInputProps> = ({ lat, lng, onChange }) => {
  const [urlText, setUrlText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [gps, setGps] = useState(false);

  const set = (la: number, lo: number, note: string) => {
    onChange(Number(la.toFixed(6)), Number(lo.toFixed(6)));
    setMsg(note);
  };

  const useGps = () => {
    if (!('geolocation' in navigator)) { setMsg('This device does not support location.'); return; }
    setGps(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(
      pos => { set(pos.coords.latitude, pos.coords.longitude, 'Set to your current location.'); setGps(false); },
      err => {
        setGps(false);
        setMsg(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Allow it in your browser and try again.'
          : 'Could not read your location. Try again outdoors.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const applyUrl = () => {
    const parsed = parseLatLng(urlText);
    if (parsed) { set(parsed.lat, parsed.lng, 'Location taken from the link.'); setUrlText(''); }
    else setMsg('Could not read coordinates. Paste the full Google Maps URL (open a short link first, then copy from the address bar), or type "latitude, longitude".');
  };

  const field = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none';

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-slate-700">Location</label>

      {/* on site */}
      <button type="button" onClick={useGps} disabled={gps}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60">
        <LocateFixed className={`w-3.5 h-3.5 ${gps ? 'animate-pulse' : ''}`} />
        {gps ? 'Getting location…' : 'On site — use my current location'}
      </button>

      {/* paste link */}
      <div>
        <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> Remote — paste a Google Maps link</div>
        <div className="flex gap-2">
          <input value={urlText} onChange={e => setUrlText(e.target.value)} placeholder="https://www.google.com/maps/@27.71,85.32,15z  or  27.71, 85.32" className={field} />
          <button type="button" onClick={applyUrl} className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg shrink-0">Use</button>
        </div>
      </div>

      {/* manual + preview */}
      <div className="grid grid-cols-2 gap-3">
        <input type="number" step="any" value={lat} onChange={e => onChange(parseFloat(e.target.value) || 0, lng)} placeholder="Latitude" className={`${field} font-mono`} />
        <input type="number" step="any" value={lng} onChange={e => onChange(lat, parseFloat(e.target.value) || 0)} placeholder="Longitude" className={`${field} font-mono`} />
      </div>

      <MapPicker lat={lat} lng={lng} interactive={false} height="h-40" />
      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <MapPin className="w-3 h-3 text-slate-400" />
        {lat || lng ? `Selected: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : 'No location selected yet.'}
      </p>
      {msg && <p className="text-[11px] text-slate-500">{msg}</p>}
    </div>
  );
};
