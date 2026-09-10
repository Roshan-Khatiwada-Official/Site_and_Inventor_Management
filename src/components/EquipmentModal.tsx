import React, { useState, useEffect } from 'react';
import { X, Boxes, Tag, ShieldCheck, Wrench, Building2, User } from 'lucide-react';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentCondition, Site, DataCollector } from '../types';

interface EquipmentModalProps {
  isOpen: boolean;
  equipment?: Equipment | null;
  sites: Site[];
  collectors: DataCollector[];
  onClose: () => void;
  onSave: (item: Equipment) => void;
}

const CATEGORIES: EquipmentCategory[] = [
  'GNSS & Surveying',
  'Field Laptops & Tablets',
  'Environmental Sensors',
  'Drones & Imaging',
  'Power & Solar',
  'Safety & PPE',
];

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  equipment,
  sites,
  collectors,
  onClose,
  onSave,
}) => {
  const [assetTag, setAssetTag] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('GNSS & Surveying');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>('Available');
  const [condition, setCondition] = useState<EquipmentCondition>('Excellent');
  const [storageLocation, setStorageLocation] = useState('');
  const [assignedSiteId, setAssignedSiteId] = useState('');
  const [assignedCollectorId, setAssignedCollectorId] = useState('');
  const [lastCalibrationDate, setLastCalibrationDate] = useState('');
  const [nextCalibrationDate, setNextCalibrationDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (equipment) {
      setAssetTag(equipment.assetTag);
      setName(equipment.name);
      setCategory(equipment.category);
      setSerialNumber(equipment.serialNumber);
      setStatus(equipment.status);
      setCondition(equipment.condition);
      setStorageLocation(equipment.storageLocation);
      setAssignedSiteId(equipment.assignedSiteId || '');
      setAssignedCollectorId(equipment.assignedCollectorId || '');
      setLastCalibrationDate(equipment.lastCalibrationDate || '');
      setNextCalibrationDate(equipment.nextCalibrationDate || '');
      setNotes(equipment.notes || '');
    } else {
      setAssetTag(`EQ-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setCategory('GNSS & Surveying');
      setSerialNumber('');
      setStatus('Available');
      setCondition('Excellent');
      setStorageLocation('Central Depot - Shelf A-01');
      setAssignedSiteId('');
      setAssignedCollectorId('');
      setLastCalibrationDate(new Date().toISOString().split('T')[0]);
      
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setNextCalibrationDate(nextYear.toISOString().split('T')[0]);
      setNotes('');
    }
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTag.trim() || !name.trim()) return;

    const saved: Equipment = {
      id: equipment ? equipment.id : `eq-${Date.now()}`,
      assetTag: assetTag.trim().toUpperCase(),
      name: name.trim(),
      category,
      serialNumber: serialNumber.trim() || 'SN-UNSPECIFIED',
      status,
      condition,
      storageLocation: storageLocation.trim() || 'Central Depot',
      assignedSiteId: status === 'Deployed' && assignedSiteId ? assignedSiteId : undefined,
      assignedCollectorId: status === 'Deployed' && assignedCollectorId ? assignedCollectorId : undefined,
      lastCalibrationDate,
      nextCalibrationDate,
      notes: notes.trim() || undefined,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {equipment ? 'Edit Equipment Asset' : 'Register New Equipment Asset'}
              </h3>
              <p className="text-xs text-slate-500">Inventory parameters, serial tracking & calibration schedules</p>
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
              <label className="block font-semibold text-slate-700 mb-1">Asset Tag *</label>
              <input
                type="text"
                required
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                placeholder="e.g. EQ-118"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Trimble R12i GNSS Receiver Kit"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Equipment Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Manufacturer Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. TRM-98442-R12"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
              >
                <option value="Available">Available (In Central Depot)</option>
                <option value="Deployed">Deployed (Active in Field / Site)</option>
                <option value="Maintenance">Maintenance (Bench Repair)</option>
                <option value="Inspection Due">Inspection Due</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Physical Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
              >
                <option value="Excellent">Excellent (Like New)</option>
                <option value="Good">Good (Normal Field Wear)</option>
                <option value="Fair">Fair (Operational with Scuffs)</option>
                <option value="Needs Repair">Needs Repair (Requires Service)</option>
              </select>
            </div>
          </div>

          {status === 'Deployed' && (
            <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl space-y-3">
              <div className="font-semibold text-purple-900 text-xs">Deployment Allocation Details</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Assigned Site</label>
                  <select
                    value={assignedSiteId}
                    onChange={(e) => setAssignedSiteId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="">-- No Site Selected --</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Assigned Data Collector</label>
                  <select
                    value={assignedCollectorId}
                    onChange={(e) => setAssignedCollectorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="">-- No Collector Selected --</option>
                    {collectors.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Default Storage Location</label>
            <input
              type="text"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g. Central Depot - Bay 3, Shelf B-02"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Calibration / Certification</label>
              <input
                type="date"
                value={lastCalibrationDate}
                onChange={(e) => setLastCalibrationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Calibration Due Date</label>
              <input
                type="date"
                value={nextCalibrationDate}
                onChange={(e) => setNextCalibrationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hardware Notes & Accessories</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes rover pole, 2x spare batteries, and optical tribrach."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
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
              className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition"
            >
              {equipment ? 'Save Equipment' : 'Add to Inventory'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
