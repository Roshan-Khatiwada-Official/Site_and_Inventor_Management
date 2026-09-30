import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const pin = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number) => void;
  /** When false the map only displays the point (no click / drag). */
  interactive?: boolean;
  height?: string;
}

const FALLBACK: [number, number] = [27.7172, 85.324]; // Kathmandu

export const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onChange, interactive = true, height = 'h-56' }) => {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const hasPoint = Boolean(lat || lng);
    const start: [number, number] = hasPoint ? [lat, lng] : FALLBACK;

    const map = L.map(elRef.current, { attributionControl: false }).setView(start, hasPoint ? 15 : 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const marker = L.marker(start, { draggable: interactive, icon: pin }).addTo(map);
    if (interactive) {
      const emit = (p: any) => onChangeRef.current?.(Number(p.lat.toFixed(6)), Number(p.lng.toFixed(6)));
      marker.on('dragend', () => emit(marker.getLatLng()));
      map.on('click', (e: any) => { marker.setLatLng(e.latlng); emit(e.latlng); });
    }

    mapRef.current = map;
    markerRef.current = marker;
    setTimeout(() => map.invalidateSize(), 120);

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the pin when lat/lng change from outside (e.g. "Use current location" or typed).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || (!lat && !lng)) return;
    const cur = marker.getLatLng();
    if (Math.abs(cur.lat - lat) > 1e-7 || Math.abs(cur.lng - lng) > 1e-7) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
  }, [lat, lng]);

  return (
    <div
      ref={elRef}
      className={`${height} w-full rounded-lg overflow-hidden border border-slate-300 relative z-0`}
    />
  );
};
