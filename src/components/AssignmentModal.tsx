import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CalendarCheck, 
  Building2, 
  User, 
  Clock, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';
import { DailyAssignment, Site, DataCollector, Equipment, ShiftType, AssignmentStatus } from '../types';

interface AssignmentModalProps {
  isOpen: boolean;
  assignment?: DailyAssignment | null;
  defaultSiteId?: string;
  defaultCollectorId?: string;
  currentDate: string;
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  allAssignments: DailyAssignment[];
  onClose: () => void;
  onSave: (asg: DailyAssignment, equipmentIdsToDeploy: string[]) => void;
}

const SHIFT_OPTIONS: ShiftType[] = [
  'Morning (07:00 - 15:00)',
  'Afternoon (14:00 - 22:00)',
  'Night (21:00 - 05:00)',
  'Full Day (08:00 - 17:00)',
];

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  assignment,
  defaultSiteId,
  defaultCollectorId,
  currentDate,
  sites,
  collectors,
  equipment,
  allAssignments,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(currentDate);
  const [siteId, setSiteId] = useState('');
  const [collectorId, setCollectorId] = useState('');
  const [shift, setShift] = useState<ShiftType>('Morning (07:00 - 15:00)');
  const [status, setStatus] = useState<AssignmentStatus>('Scheduled');
  const [targetUnits, setTargetUnits] = useState<number>(30);
  const [unitsCollected, setUnitsCollected] = useState<number>(0);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);

  useEffect(() => {
    if (assignment) {
      setDate(assignment.date);
      setSiteId(assignment.siteId);
      setCollectorId(assignment.collectorId);
      setShift(assignment.shift);
      setStatus(assignment.status);
      setTargetUnits(assignment.targetUnits);
      setUnitsCollected(assignment.unitsCollected);
      setCheckInTime(assignment.checkInTime || '');
      setCheckOutTime(assignment.checkOutTime || '');
      setNotes(assignment.notes || '');
      setSelectedEquipmentIds(assignment.assignedEquipmentIds || []);
    } else {
      setDate(currentDate);
      const initialSite = defaultSiteId || (sites.length > 0 ? sites[0].id : '');
      const initialCol = defaultCollectorId || (collectors.length > 0 ? collectors[0].id : '');
      setSiteId(initialSite);
      setCollectorId(initialCol);
      setShift('Morning (07:00 - 15:00)');
      setStatus('Scheduled');
      
      const foundSite = sites.find(s => s.id === initialSite);
      setTargetUnits(foundSite ? foundSite.targetDailyUnits : 30);
      setUnitsCollected(0);
      setCheckInTime('');
      setCheckOutTime('');
      setNotes('');
      setSelectedEquipmentIds([]);
    }
  }, [assignment, defaultSiteId, defaultCollectorId, currentDate, isOpen, sites, collectors]);

  // When site changes, update target units if creating new
  const handleSiteChange = (newSiteId: string) => {
    setSiteId(newSiteId);
    if (!assignment) {
      const s = sites.find(x => x.id === newSiteId);
      if (s) setTargetUnits(s.targetDailyUnits);
    }
  };

  const selectedSite = useMemo(() => sites.find(s => s.id === siteId), [sites, siteId]);
  const selectedCollector = useMemo(() => collectors.find(c => c.id === collectorId), [collectors, collectorId]);

  // Check for scheduling conflicts
  const conflictAssignment = useMemo(() => {
    if (!collectorId || !date || !shift) return null;
    return allAssignments.find(a => 
      a.id !== assignment?.id &&
      a.collectorId === collectorId &&
      a.date === date &&
      a.shift === shift &&
      a.status !== 'Cancelled'
    );
  }, [allAssignments, assignment, collectorId, date, shift]);

  // Check certification match
  const certEvaluation = useMemo(() => {
    if (!selectedSite || !selectedCollector) return { hasAll: true, missing: [] };
    const required = selectedSite.requiredCertifications || [];
    const collectorCerts = selectedCollector.certifications || [];
    const missing = required.filter(r => !collectorCerts.includes(r));
    return {
      hasAll: missing.length === 0,
      missing,
    };
  }, [selectedSite, selectedCollector]);

  // Equipment eligible for checkout: Available or already assigned to this assignment
  const eligibleEquipment = useMemo(() => {
    return equipment.filter(e => 
      e.status === 'Available' || 
      (assignment && assignment.assignedEquipmentIds?.includes(e.id)) ||
      e.assignedCollectorId === collectorId
    );
  }, [equipment, assignment, collectorId]);

  if (!isOpen) return null;

  const toggleEquipment = (eqId: string) => {
    if (selectedEquipmentIds.includes(eqId)) {
      setSelectedEquipmentIds(selectedEquipmentIds.filter(id => id !== eqId));
    } else {
      setSelectedEquipmentIds([...selectedEquipmentIds, eqId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !collectorId) return;

    const savedAsg: DailyAssignment = {
      id: assignment ? assignment.id : `asg-${Date.now()}`,
      date,
      siteId,
      collectorId,
      shift,
      status,
      targetUnits: Number(targetUnits) || 0,
      unitsCollected: Number(unitsCollected) || 0,
      checkInTime: checkInTime.trim() || undefined,
      checkOutTime: checkOutTime.trim() || undefined,
      notes: notes.trim() || undefined,
      assignedEquipmentIds: selectedEquipmentIds,
    };

    onSave(savedAsg, selectedEquipmentIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {assignment ? 'Edit Daily Assignment' : 'Dispatch Field Collector'}
              </h3>
              <p className="text-xs text-slate-500">Pair field surveyor with site, shift, and equipment</p>
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
          
          {/* Scheduling Conflict Warning Banner */}
          {conflictAssignment && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Shift Schedule Conflict Detected</strong>
                <span>
                  {selectedCollector?.name} is already assigned on {date} during "{shift}". 
                  Consider choosing a different shift or reassigning.
                </span>
              </div>
            </div>
          )}

          {/* Certification Gap Warning Banner */}
          {!certEvaluation.hasAll && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Missing Required Site Certification(s)</strong>
                <span>
                  This site mandates: <strong>{certEvaluation.missing.join(', ')}</strong>. 
                  Selected collector ({selectedCollector?.name}) does not hold these badges.
                </span>
              </div>
            </div>
          )}

          {/* Date & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Window *</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {SHIFT_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Site & Collector Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Site *</label>
              <select
                required
                value={siteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Data Collector *</label>
              <select
                required
                value={collectorId}
                onChange={(e) => setCollectorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                {collectors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role} - {c.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dispatch Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Scheduled">Scheduled (Planned)</option>
                <option value="Dispatched">Dispatched (En Route)</option>
                <option value="On-Site">On-Site (Active Sampling)</option>
                <option value="Completed">Completed (Shift Concluded)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Units</label>
              <input
                type="number"
                min="0"
                value={targetUnits}
                onChange={(e) => setTargetUnits(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Units Collected So Far</label>
              <input
                type="number"
                min="0"
                value={unitsCollected}
                onChange={(e) => setUnitsCollected(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-700"
              />
            </div>
          </div>

          {/* Check-In / Check-Out Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-In Time</label>
              <input
                type="text"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                placeholder="e.g. 07:05 AM"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-Out Time</label>
              <input
                type="text"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                placeholder="e.g. 15:10 PM"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Equipment Allocation Checklist */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Checkout Field Equipment for this Shift</span>
              <span className="text-slate-400 font-normal">
                {selectedEquipmentIds.length} item(s) selected
              </span>
            </label>
            
            <div className="border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto space-y-1.5 bg-slate-50">
              {eligibleEquipment.length === 0 ? (
                <div className="text-slate-400 text-center py-2 italic">
                  No unassigned equipment available in depot.
                </div>
              ) : (
                eligibleEquipment.map(eq => {
                  const isChecked = selectedEquipmentIds.includes(eq.id);
                  return (
                    <label 
                      key={eq.id}
                      className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition ${
                        isChecked 
                          ? 'bg-purple-50 border-purple-300 text-purple-900' 
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEquipment(eq.id)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <span className="font-mono font-bold text-xs mr-1">{eq.assetTag}</span>
                          <span className="text-xs">{eq.name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500">{eq.category}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Shift Instructions & Field Logs</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on southern transect vials. Return coolers to Central Lab by 17:00."
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
              {assignment ? 'Update Assignment' : 'Dispatch Collector'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
