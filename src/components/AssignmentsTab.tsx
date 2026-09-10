import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  User, 
  Building2, 
  Boxes, 
  CheckCircle2, 
  ArrowRight, 
  Edit, 
  Trash2, 
  FileText, 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  Truck,
  Phone
} from 'lucide-react';
import { DailyAssignment, Site, DataCollector, Equipment, ShiftType, AssignmentStatus, UserAccount } from '../types';

interface AssignmentsTabProps {
  currentDate: string;
  assignments: DailyAssignment[];
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  currentUser?: UserAccount | null;
  onAddAssignment: () => void;
  onEditAssignment: (assignment: DailyAssignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onUpdateStatus: (assignmentId: string, status: AssignmentStatus) => void;
  onIncrementUnits: (assignmentId: string, amount: number) => void;
  onOpenAutoAssign: () => void;
  onOpenRunSheet: () => void;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  currentDate,
  assignments,
  sites,
  collectors,
  equipment,
  currentUser,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onUpdateStatus,
  onIncrementUnits,
  onOpenAutoAssign,
  onOpenRunSheet,
}) => {
  const [siteFilter, setSiteFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [shiftFilter, setShiftFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter assignments for selected date
  const dayAssignments = assignments.filter(a => a.date === currentDate);

  const filteredAssignments = dayAssignments.filter(asg => {
    const site = sites.find(s => s.id === asg.siteId);
    const collector = collectors.find(c => c.id === asg.collectorId);

    const matchesSearch = 
      (collector?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asg.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSite = siteFilter === 'All' || asg.siteId === siteFilter;
    const matchesStatus = statusFilter === 'All' || asg.status === statusFilter;
    const matchesShift = shiftFilter === 'All' || asg.shift === shiftFilter;

    return matchesSearch && matchesSite && matchesStatus && matchesShift;
  });

  // Calculate day metrics
  const totalTargetUnits = dayAssignments.reduce((sum, a) => sum + (a.targetUnits || 0), 0);
  const totalCollectedUnits = dayAssignments.reduce((sum, a) => sum + (a.unitsCollected || 0), 0);
  const activeOnSite = dayAssignments.filter(a => a.status === 'On-Site').length;
  const completedCount = dayAssignments.filter(a => a.status === 'Completed').length;

  return (
    <div className="space-y-6">
      
      {/* Scoped Visibility Notice for Non-Admin Staff */}
      {currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Operations Manager' && (
        <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
            <div>
              <strong>Scoped Personal View:</strong> You are viewing only dispatches that you have created or are assigned to manage (<strong>{currentUser.name}</strong>). Assignments by other staff remain private and hidden.
            </div>
          </div>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono text-[11px] font-semibold shrink-0">
            {dayAssignments.length} visible shift{dayAssignments.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Date Header & Operations Sub-bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Daily Field Dispatch Roster
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
              {currentDate}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of collector shifts, field check-ins, collection logs, and gear checkout
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {(currentUser?.role === 'Admin' || currentUser?.role === 'Operations Manager') && (
            <button
              onClick={onOpenAutoAssign}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-2 rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Roster Team</span>
            </button>
          )}

          <button
            onClick={onOpenRunSheet}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Run Sheet</span>
          </button>

          <button
            onClick={onAddAssignment}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Collector</span>
          </button>
        </div>

      </div>

      {/* Daily Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scheduled Runs</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{dayAssignments.length} dispatches</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{completedCount} already completed</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">On-Site Now</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{activeOnSite} staff</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Actively recording data</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Units Collected</span>
          <div className="text-xl font-bold text-blue-600 mt-1">{totalCollectedUnits}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Target: {totalTargetUnits} units</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Fulfilled</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {totalTargetUnits > 0 ? Math.round((totalCollectedUnits / totalTargetUnits) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Day's operational goal</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assignments by collector, site name, code, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Site:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Sites</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Dispatched">Dispatched</option>
              <option value="On-Site">On-Site</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <span>Shift:</span>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Shifts</option>
              <option value="Morning (07:00 - 15:00)">Morning</option>
              <option value="Afternoon (14:00 - 22:00)">Afternoon</option>
              <option value="Night (21:00 - 05:00)">Night</option>
              <option value="Full Day (08:00 - 17:00)">Full Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            <CalendarCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No daily dispatches found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no assignments matching your criteria for {currentDate}. Click below to dispatch field collectors or use the auto-roster generator.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={onOpenAutoAssign}
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                Auto-Roster Staff
              </button>
              <button
                onClick={onAddAssignment}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                Create Assignment
              </button>
            </div>
          </div>
        ) : (
          filteredAssignments.map(asg => {
            const collector = collectors.find(c => c.id === asg.collectorId);
            const site = sites.find(s => s.id === asg.siteId);
            const asgEquipment = equipment.filter(e => asg.assignedEquipmentIds?.includes(e.id));
            const progress = asg.targetUnits > 0 ? Math.min(100, Math.round((asg.unitsCollected / asg.targetUnits) * 100)) : 0;

            return (
              <div 
                key={asg.id} 
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Collector & Site Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {collector?.name || 'Unassigned Collector'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({collector?.role || 'Field Staff'})
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          asg.status === 'On-Site' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          asg.status === 'Dispatched' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          asg.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          asg.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {asg.status}
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          {site?.code}: {site?.name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {asg.shift}
                        </span>
                        {collector?.vehicleAssigned && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-slate-400" />
                              {collector.vehicleAssigned}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Timestamps & Notes */}
                      {(asg.checkInTime || asg.notes) && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                          {asg.checkInTime && (
                            <div className="flex items-center gap-3 text-slate-500">
                              <span>Check-In: <strong>{asg.checkInTime}</strong></span>
                              {asg.checkOutTime && <span>Check-Out: <strong>{asg.checkOutTime}</strong></span>}
                            </div>
                          )}
                          {asg.notes && <p className="italic text-slate-700">"{asg.notes}"</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Collection Counter & Status Transitions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start lg:self-center">
                    
                    {/* Collection counter tracker */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 min-w-[170px]">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>DATA UNITS LOGGED</span>
                        <span className="text-blue-600 font-bold">{progress}%</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-base font-bold text-slate-900">{asg.unitsCollected}</span>
                        <span className="text-xs text-slate-500">/ {asg.targetUnits} {site?.unitType || 'units'}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      {/* Quick increment buttons */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-medium">Log:</span>
                        <button
                          onClick={() => onIncrementUnits(asg.id, 1)}
                          className="px-1.5 py-0.5 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 rounded text-[11px] font-semibold text-slate-700 transition"
                          title="Add 1 unit"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => onIncrementUnits(asg.id, 5)}
                          className="px-1.5 py-0.5 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 rounded text-[11px] font-semibold text-slate-700 transition"
                          title="Add 5 units"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => onIncrementUnits(asg.id, 10)}
                          className="px-1.5 py-0.5 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 rounded text-[11px] font-semibold text-slate-700 transition"
                          title="Add 10 units"
                        >
                          +10
                        </button>
                      </div>
                    </div>

                    {/* Status Step Transitions */}
                    <div className="space-y-1.5 text-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Shift Status
                      </div>
                      <div className="flex items-center gap-1.5">
                        {asg.status === 'Scheduled' && (
                          <button
                            onClick={() => onUpdateStatus(asg.id, 'Dispatched')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-2.5 py-1 rounded-md text-xs transition shadow-sm"
                          >
                            Dispatch →
                          </button>
                        )}
                        {asg.status === 'Dispatched' && (
                          <button
                            onClick={() => onUpdateStatus(asg.id, 'On-Site')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1 rounded-md text-xs transition shadow-sm"
                          >
                            Mark On-Site →
                          </button>
                        )}
                        {asg.status === 'On-Site' && (
                          <button
                            onClick={() => onUpdateStatus(asg.id, 'Completed')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-md text-xs transition shadow-sm"
                          >
                            Complete & Log Out
                          </button>
                        )}
                        {asg.status === 'Completed' && (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Shift Done
                          </span>
                        )}

                        <button
                          onClick={() => onEditAssignment(asg)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                          title="Edit assignment details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteAssignment(asg.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition"
                          title="Remove assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Checked-out equipment items strip */}
                {asgEquipment.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-500 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-purple-600" />
                      Checked-out Gear:
                    </span>
                    {asgEquipment.map(eq => (
                      <span 
                        key={eq.id} 
                        className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1"
                      >
                        <span className="font-mono font-bold">{eq.assetTag}</span>
                        <span>{eq.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
