import React, { useState } from 'react';
import { 
  HardHat, 
  MapPin, 
  Clock, 
  Boxes, 
  CheckCircle2, 
  Phone, 
  Key, 
  Calendar, 
  AlertCircle,
  FileCheck,
  Send
} from 'lucide-react';
import { DailyAssignment, Site, Equipment, DataCollector, UserAccount } from '../types';

interface FieldCollectorViewProps {
  currentUser: UserAccount;
  currentDate: string;
  assignments: DailyAssignment[];
  sites: Site[];
  equipment: Equipment[];
  collectors: DataCollector[];
  onUpdateAssignment: (assignment: DailyAssignment) => void;
  onNotify: (msg: string) => void;
}

export const FieldCollectorView: React.FC<FieldCollectorViewProps> = ({
  currentUser,
  currentDate,
  assignments,
  sites,
  equipment,
  collectors,
  onUpdateAssignment,
  onNotify,
}) => {
  // Find linked collector profile
  const linkedCollector = collectors.find(c => 
    c.id === currentUser.collectorId || 
    c.name.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])
  );

  // Find assignments for this user/collector on currentDate
  const myAssignments = assignments.filter(a => {
    if (a.date !== currentDate) return false;
    if (currentUser.collectorId && a.collectorId === currentUser.collectorId) return true;
    if (linkedCollector && a.collectorId === linkedCollector.id) return true;
    return false;
  });

  const [notesInput, setNotesInput] = useState<{ [id: string]: string }>({});
  const [unitsInput, setUnitsInput] = useState<{ [id: string]: number }>({});

  const handleCheckIn = (asg: DailyAssignment) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: DailyAssignment = {
      ...asg,
      checkInTime: nowTime,
      status: 'On-Site',
    };
    onUpdateAssignment(updated);
    onNotify(`Checked in at ${nowTime} for site assignment.`);
  };

  const handleCheckOut = (asg: DailyAssignment) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated: DailyAssignment = {
      ...asg,
      checkOutTime: nowTime,
      status: 'Completed',
    };
    onUpdateAssignment(updated);
    onNotify(`Shift checked out successfully at ${nowTime}.`);
  };

  const handleUpdateUnits = (asg: DailyAssignment) => {
    const val = unitsInput[asg.id] !== undefined ? unitsInput[asg.id] : asg.unitsCollected;
    const additionalNotes = notesInput[asg.id];
    
    const updated: DailyAssignment = {
      ...asg,
      unitsCollected: val,
      notes: additionalNotes 
        ? (asg.notes ? `${asg.notes} | ${additionalNotes}` : additionalNotes)
        : asg.notes,
    };
    onUpdateAssignment(updated);
    onNotify(`Updated collected units to ${val}`);
    // clear note input for this item
    setNotesInput(prev => ({ ...prev, [asg.id]: '' }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Field Work Portal: {currentUser.name}
            </h2>
            <p className="text-xs text-slate-400">
              Assigned daily itinerary, site gate access, and units collection log for {currentDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
            Field Collector
          </span>
          {linkedCollector && (
            <span className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
              Badge #{linkedCollector.badgeNumber}
            </span>
          )}
        </div>
      </div>

      {/* Daily Shift Cards */}
      {myAssignments.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Scheduled Shifts for Today</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not have any active field dispatch assignments recorded for {currentDate}. If you are scheduled to work, contact your Site Dispatcher or Operations Manager.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {myAssignments.map(asg => {
            const site = sites.find(s => s.id === asg.siteId);
            const asgEquipment = equipment.filter(e => asg.equipmentIds.includes(e.id));
            const currentUnits = unitsInput[asg.id] !== undefined ? unitsInput[asg.id] : asg.unitsCollected;

            return (
              <div 
                key={asg.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5"
              >
                {/* Header of Assignment */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {site?.code || 'SITE'}
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        {site?.name || 'Assigned Field Site'}
                      </h3>
                    </div>
                    {site?.address && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {site.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      asg.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : asg.status === 'On-Site' || asg.status === 'Dispatched'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {asg.status}
                    </span>
                  </div>
                </div>

                {/* Site Access & Emergency Logistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" /> Shift Hours
                    </span>
                    <span className="text-xs font-semibold text-white font-mono">
                      {asg.shiftStart} - {asg.shiftEnd}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" /> Gate / Access PIN
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {site?.accessCode || 'Standard Badge Entry'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" /> Site Supervisor
                    </span>
                    <span className="text-xs font-semibold text-white truncate block">
                      {site?.supervisor || 'Field Dispatch HQ'}
                    </span>
                    {site?.supervisorPhone && (
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {site.supervisorPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assigned Equipment */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-400" />
                    Assigned Instruments & Assets ({asgEquipment.length})
                  </h4>

                  {asgEquipment.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No specific instruments tagged for this shift.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {asgEquipment.map(eq => (
                        <div key={eq.id} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono text-blue-300 font-semibold">{eq.assetTag}</span>
                            <span className="text-slate-300 ml-2 font-medium">{eq.name}</span>
                            <div className="text-[11px] text-slate-400 font-mono">S/N: {eq.serialNumber}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {eq.condition}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Field Execution Controls: Check In, Units, Notes */}
                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Check-In: </span>
                        <strong className="text-white font-mono">{asg.checkInTime || 'Not yet'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Check-Out: </span>
                        <strong className="text-white font-mono">{asg.checkOutTime || 'Not yet'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!asg.checkInTime && (
                        <button
                          onClick={() => handleCheckIn(asg)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          Check In Now
                        </button>
                      )}
                      {asg.checkInTime && asg.status !== 'Completed' && (
                        <button
                          onClick={() => handleCheckOut(asg)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          Complete & Check Out
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Units logging form */}
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
                    <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Log Units & Field Observations
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Units Gathered (Target: {asg.targetUnits})
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={currentUnits}
                          onChange={e => setUnitsInput(prev => ({ ...prev, [asg.id]: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Field Remarks / Site Condition Note
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={notesInput[asg.id] || ''}
                            onChange={e => setNotesInput(prev => ({ ...prev, [asg.id]: e.target.value }))}
                            placeholder="e.g. Sampling completed across Sector 3. Weather clear."
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleUpdateUnits(asg)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Save Log</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {asg.notes && (
                      <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg font-mono">
                        <strong className="text-slate-300">Previous log:</strong> {asg.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
