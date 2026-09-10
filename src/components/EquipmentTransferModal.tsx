import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Building2, User, Boxes, ShieldCheck } from 'lucide-react';
import { Equipment, Site, DataCollector, EquipmentCondition, TransferLog, UserAccount } from '../types';

interface EquipmentTransferModalProps {
  isOpen: boolean;
  equipment: Equipment | null;
  sites: Site[];
  collectors: DataCollector[];
  prefillSiteId?: string;
  currentUser?: UserAccount | null;
  onClose: () => void;
  onConfirmTransfer: (
    equipment: Equipment,
    targetType: 'site' | 'collector' | 'depot',
    targetId: string,
    condition: EquipmentCondition,
    handler: string,
    notes: string
  ) => void;
}

export const EquipmentTransferModal: React.FC<EquipmentTransferModalProps> = ({
  isOpen,
  equipment,
  sites,
  collectors,
  prefillSiteId,
  currentUser,
  onClose,
  onConfirmTransfer,
}) => {
  const [targetType, setTargetType] = useState<'site' | 'collector' | 'depot'>('site');
  const [targetId, setTargetId] = useState('');
  const [condition, setCondition] = useState<EquipmentCondition>('Good');
  const [handler, setHandler] = useState('Dispatcher Operations');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (equipment) {
      setCondition(equipment.condition);
      setHandler(currentUser?.name || 'Dispatcher Operations');
      if (prefillSiteId) {
        setTargetType('site');
        setTargetId(prefillSiteId);
      } else if (sites.length > 0) {
        setTargetType('site');
        setTargetId(sites[0].id);
      }
      setNotes('');
    }
  }, [equipment, prefillSiteId, sites, isOpen]);

  if (!isOpen || !equipment) return null;

  const currentFromLocation = equipment.status === 'Deployed'
    ? (sites.find(s => s.id === equipment.assignedSiteId)?.name || 
       collectors.find(c => c.id === equipment.assignedCollectorId)?.name || 
       'Field Deployed')
    : equipment.storageLocation || 'Central Depot';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmTransfer(equipment, targetType, targetId, condition, handler, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Equipment Checkout & Transfer
              </h3>
              <p className="text-xs text-slate-500">Record chain of custody and condition audit</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          
          {/* Asset Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-xs font-bold">
                  {equipment.assetTag}
                </span>
                <span>{equipment.name}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                S/N: {equipment.serialNumber} • Category: {equipment.category}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold block">FROM CURRENT:</span>
              <span className="text-xs font-semibold text-slate-700">{currentFromLocation}</span>
            </div>
          </div>

          {/* Transfer Destination Type Tabs */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Transfer Destination</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType('site');
                  if (sites.length > 0) setTargetId(sites[0].id);
                }}
                className={`py-2 px-3 rounded-lg border font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  targetType === 'site'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Station at Site</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType('collector');
                  if (collectors.length > 0) setTargetId(collectors[0].id);
                }}
                className={`py-2 px-3 rounded-lg border font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  targetType === 'collector'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Assign to Collector</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType('depot');
                  setTargetId('Central Depot');
                }}
                className={`py-2 px-3 rounded-lg border font-medium text-xs flex items-center justify-center gap-1.5 transition ${
                  targetType === 'depot'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Return to Depot</span>
              </button>
            </div>
          </div>

          {/* Select Specific Target */}
          {targetType === 'site' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Field Site</label>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'collector' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Field Collector</label>
              <select
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {collectors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role} - {c.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'depot' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Depot Storage Bin / Shelf</label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="e.g. Central Depot - Shelf B-04"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Condition Assessment at Handoff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Condition Inspection</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Excellent">Excellent (No defects)</option>
                <option value="Good">Good (Field tested)</option>
                <option value="Fair">Fair (Minor cosmetic wear)</option>
                <option value="Needs Repair">Needs Repair (Flag for service)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Dispatcher / Tech</label>
              <input
                type="text"
                required
                value={handler}
                onChange={(e) => setHandler(e.target.value)}
                placeholder="e.g. Dispatcher S. Budal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Handoff Notes & Verification</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified battery state of charge 100%, optical lenses clean, fresh calibration check passed."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
            >
              Record Custody Transfer
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
