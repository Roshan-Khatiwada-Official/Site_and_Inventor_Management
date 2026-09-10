import React, { useState, useEffect } from 'react';
import { X, HardHat, Phone, Mail, Truck, Award } from 'lucide-react';
import { DataCollector, CollectorStatus } from '../types';

interface CollectorModalProps {
  isOpen: boolean;
  collector?: DataCollector | null;
  onClose: () => void;
  onSave: (collector: DataCollector) => void;
}

const COMMON_CERTIFICATIONS = [
  'Environmental Sampling',
  'Water Safety / Swiftwater',
  'GNSS RTK Survey',
  'High Voltage Safety',
  'Confined Space Entry',
  'Drone Pilot Part 107',
  'Thermal Thermography Level 1',
  'Hazmat Level 2',
];

export const CollectorModal: React.FC<CollectorModalProps> = ({
  isOpen,
  collector,
  onClose,
  onSave,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<DataCollector['role']>('Field Enumerator');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<CollectorStatus>('Active');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [vehicleAssigned, setVehicleAssigned] = useState('');
  const [dailyCapacity, setDailyCapacity] = useState<number>(40);

  useEffect(() => {
    if (collector) {
      setEmployeeId(collector.employeeId);
      setName(collector.name);
      setRole(collector.role);
      setPhone(collector.phone);
      setEmail(collector.email);
      setStatus(collector.status);
      setCertifications(collector.certifications || []);
      setVehicleAssigned(collector.vehicleAssigned || '');
      setDailyCapacity(collector.dailyCapacity || 40);
    } else {
      setEmployeeId(`EMP-${Math.floor(400 + Math.random() * 99)}`);
      setName('');
      setRole('Field Enumerator');
      setPhone('');
      setEmail('');
      setStatus('Active');
      setCertifications(['Environmental Sampling']);
      setVehicleAssigned('');
      setDailyCapacity(40);
    }
  }, [collector, isOpen]);

  if (!isOpen) return null;

  const toggleCert = (cert: string) => {
    if (certifications.includes(cert)) {
      setCertifications(certifications.filter(c => c !== cert));
    } else {
      setCertifications([...certifications, cert]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeId.trim()) return;

    const saved: DataCollector = {
      id: collector ? collector.id : `col-${Date.now()}`,
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      role,
      phone: phone.trim() || '+1 (555) 000-0000',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@fieldops.io`,
      status,
      certifications,
      vehicleAssigned: vehicleAssigned.trim() || undefined,
      dailyCapacity: Number(dailyCapacity) || 40,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {collector ? 'Edit Field Staff Profile' : 'Register Field Data Collector'}
              </h3>
              <p className="text-xs text-slate-500">Personnel credentials, safety qualifications & daily capacity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-409"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role / Specialization</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as DataCollector['role'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Lead Field Specialist">Lead Field Specialist</option>
                <option value="Senior Surveyor">Senior Surveyor</option>
                <option value="Field Enumerator">Field Enumerator</option>
                <option value="GIS Technician">GIS Technician</option>
                <option value="Environmental Tech">Environmental Tech</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Roster Availability</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CollectorStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Active">Active (Ready for dispatch)</option>
                <option value="Standby">Standby (Backup reserve)</option>
                <option value="On Leave">On Leave (Unavailable)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (503) 555-2190"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maya.lin@fieldops.io"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Fleet Vehicle</label>
              <input
                type="text"
                value={vehicleAssigned}
                onChange={(e) => setVehicleAssigned(e.target.value)}
                placeholder="e.g. Truck #12 (Ford F-250 4x4)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Daily Collection Capacity (Units)</label>
              <input
                type="number"
                min="1"
                value={dailyCapacity}
                onChange={(e) => setDailyCapacity(parseInt(e.target.value) || 40)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Earned Field Certifications</label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CERTIFICATIONS.map(cert => {
                const isSelected = certifications.includes(cert);
                return (
                  <button
                    type="button"
                    key={cert}
                    onClick={() => toggleCert(cert)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                      isSelected 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{cert}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
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
              {collector ? 'Update Collector' : 'Add Collector'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
