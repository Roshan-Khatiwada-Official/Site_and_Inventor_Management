import React from 'react';
import { 
  Building2, 
  HardHat, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Radio, 
  Wrench, 
  ShieldAlert, 
  ChevronRight,
  Sparkles,
  MapPin,
  CalendarCheck
} from 'lucide-react';
import { Site, DataCollector, Equipment, DailyAssignment, TransferLog, OperationalAlert } from '../types';

interface OverviewTabProps {
  currentDate: string;
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  assignments: DailyAssignment[];
  transfers: TransferLog[];
  alerts: OperationalAlert[];
  onNavigateTab: (tab: string) => void;
  onOpenNewAssignment: (prefillSiteId?: string) => void;
  onOpenAutoAssign: () => void;
  onSelectSite: (siteId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  currentDate,
  sites,
  collectors,
  equipment,
  assignments,
  transfers,
  alerts,
  onNavigateTab,
  onOpenNewAssignment,
  onOpenAutoAssign,
  onSelectSite,
}) => {
  const todayAssignments = assignments.filter(a => a.date === currentDate && a.status !== 'Cancelled');
  
  // Calculate aggregate metrics
  const totalTargetUnits = todayAssignments.reduce((acc, a) => acc + (a.targetUnits || 0), 0);
  const totalCollectedUnits = todayAssignments.reduce((acc, a) => acc + (a.unitsCollected || 0), 0);
  const progressPercent = totalTargetUnits > 0 ? Math.min(100, Math.round((totalCollectedUnits / totalTargetUnits) * 100)) : 0;

  const activeSites = sites.filter(s => s.status === 'Active');
  const sitesWithStaffToday = new Set(todayAssignments.map(a => a.siteId));
  const staffedActiveSitesCount = activeSites.filter(s => sitesWithStaffToday.has(s.id)).length;

  const onSiteCount = todayAssignments.filter(a => a.status === 'On-Site').length;
  const completedCount = todayAssignments.filter(a => a.status === 'Completed').length;
  const dispatchedCount = todayAssignments.filter(a => a.status === 'Dispatched').length;
  const scheduledCount = todayAssignments.filter(a => a.status === 'Scheduled').length;

  const deployedEquipment = equipment.filter(e => e.status === 'Deployed');
  const maintEquipment = equipment.filter(e => e.status === 'Maintenance' || e.condition === 'Needs Repair');
  const availableEquipment = equipment.filter(e => e.status === 'Available');

  return (
    <div className="space-y-6">
      
      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Today's Collection Progress */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Field Data Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalCollectedUnits}</span>
              <span className="text-sm font-medium text-slate-500">/ {totalTargetUnits} units target</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{progressPercent}% target reached</span>
            <span className="text-blue-600 font-medium">{todayAssignments.length} active dispatches</span>
          </div>
        </div>

        {/* Metric 2: Site Staffing Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Site Coverage
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{staffedActiveSitesCount}</span>
              <span className="text-sm font-medium text-slate-500">/ {activeSites.length} active sites covered</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${activeSites.length > 0 ? (staffedActiveSitesCount / activeSites.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              {activeSites.length - staffedActiveSitesCount > 0 
                ? `${activeSites.length - staffedActiveSitesCount} unstaffed active site` 
                : 'All active sites staffed'}
            </span>
            <button 
              onClick={() => onNavigateTab('sites')}
              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-0.5"
            >
              View Sites <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 3: Field Personnel Deployment */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Collectors In Field
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{onSiteCount + dispatchedCount}</span>
              <span className="text-sm font-medium text-slate-500">on duty today</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {onSiteCount} on-site
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {dispatchedCount} in-transit
              </span>
              <span className="flex items-center gap-1 text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {completedCount} done
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{scheduledCount} waiting for dispatch</span>
            <button 
              onClick={() => onNavigateTab('assignments')}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
            >
              Dispatch Board <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: Equipment In Circulation */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Equipment Deployed
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{deployedEquipment.length}</span>
              <span className="text-sm font-medium text-slate-500">/ {equipment.length} assets deployed</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-slate-600">{availableEquipment.length} in depot</span>
              {maintEquipment.length > 0 && (
                <span className="text-rose-600 font-medium flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> {maintEquipment.length} repair
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{equipment.length - maintEquipment.length} mission-ready</span>
            <button 
              onClick={() => onNavigateTab('inventory')}
              className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-0.5"
            >
              Inventory <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Actionable Alerts Banner (if any) */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">
                Operational Attention & Compliance Alerts ({alerts.length})
              </h3>
            </div>
            <span className="text-xs text-amber-700">Action recommended before field dispatch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
            {alerts.slice(0, 3).map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                  alert.type === 'critical' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-white border-amber-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className={alert.type === 'critical' ? 'text-rose-700' : 'text-amber-800'}>
                      {alert.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{alert.description}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                  {alert.entityType === 'equipment' && (
                    <button 
                      onClick={() => onNavigateTab('inventory')}
                      className="text-blue-600 hover:underline font-medium text-[11px]"
                    >
                      Open Inventory →
                    </button>
                  )}
                  {alert.entityType === 'site' && (
                    <button 
                      onClick={() => onOpenNewAssignment(alert.entityId)}
                      className="text-blue-600 hover:underline font-medium text-[11px]"
                    >
                      Assign Staff Now →
                    </button>
                  )}
                  {alert.entityType === 'assignment' && (
                    <button 
                      onClick={() => onNavigateTab('assignments')}
                      className="text-blue-600 hover:underline font-medium text-[11px]"
                    >
                      Resolve Conflict →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column Section: Site Arrangement Board & Live Daily Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Active Site Field Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Site Arrangements & Field Readiness
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overview of current locations, safety prerequisites, assigned staff, and collection targets
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAutoAssign}
                  className="text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Roster
                </button>
                <button
                  onClick={() => onNavigateTab('sites')}
                  className="text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
                >
                  Manage All Sites
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {sites.map(site => {
                const siteAssignments = todayAssignments.filter(a => a.siteId === site.id);
                const assignedCollectorNames = siteAssignments.map(a => {
                  const col = collectors.find(c => c.id === a.collectorId);
                  return col ? col.name : 'Unknown';
                });
                
                const siteUnitsTarget = siteAssignments.reduce((sum, a) => sum + a.targetUnits, 0);
                const siteUnitsDone = siteAssignments.reduce((sum, a) => sum + a.unitsCollected, 0);
                const siteEquipCount = equipment.filter(e => e.assignedSiteId === site.id).length;

                return (
                  <div key={site.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-bold text-xs text-slate-700">
                          {site.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 
                              onClick={() => onSelectSite(site.id)}
                              className="font-semibold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                            >
                              {site.name}
                            </h4>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              site.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                              site.status === 'Planned' ? 'bg-blue-100 text-blue-800' :
                              site.status === 'Paused' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {site.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {site.region}
                            </span>
                            <span>•</span>
                            <span>Supervisor: {site.supervisor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress and quick stats */}
                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-800">
                            {siteUnitsDone} / {siteUnitsTarget || site.targetDailyUnits} {site.unitType}
                          </div>
                          <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden ml-auto">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ 
                                width: `${siteUnitsTarget > 0 ? Math.min(100, Math.round((siteUnitsDone / siteUnitsTarget) * 100)) : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenNewAssignment(site.id)}
                          className="text-xs bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-md font-medium transition"
                        >
                          + Dispatch
                        </button>
                      </div>
                    </div>

                    {/* Assigned Personnel & Equipment Badges for this site */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 pl-0 sm:pl-13 text-xs">
                      <div className="flex items-center gap-1 text-slate-500 mr-1">
                        <HardHat className="w-3.5 h-3.5 text-amber-500" />
                        <span>Assigned Today:</span>
                      </div>
                      {assignedCollectorNames.length > 0 ? (
                        assignedCollectorNames.map((name, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] italic">
                          No collector assigned for {currentDate}
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-slate-500 ml-auto">
                        <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{siteEquipCount} equipment items stationed</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Equipment Transfers / Chain of Custody */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  Recent Equipment Movements & Chain of Custody
                </h3>
                <p className="text-xs text-slate-500">Latest field checkouts, site deployments, and depot returns</p>
              </div>
              <button 
                onClick={() => onNavigateTab('inventory')}
                className="text-xs font-medium text-purple-600 hover:underline"
              >
                View All Gear →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Asset</th>
                    <th className="pb-2">From</th>
                    <th className="pb-2">To Location / Collector</th>
                    <th className="pb-2">Condition</th>
                    <th className="pb-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {transfers.slice(0, 4).map(tr => (
                    <tr key={tr.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {tr.equipmentTag}
                          </span>
                          <span className="truncate max-w-[140px]">{tr.equipmentName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-500">{tr.fromLocation}</td>
                      <td className="py-2.5 font-medium text-blue-700">{tr.toLocation}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          tr.condition === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
                          tr.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                          tr.condition === 'Fair' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {tr.condition}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">{tr.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Daily Dispatch Roster for Selected Date */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                  Today's Field Dispatches
                </h3>
                <span className="text-xs text-slate-500">{todayAssignments.length} scheduled runs</span>
              </div>

              <button
                onClick={() => onNavigateTab('assignments')}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Full Board →
              </button>
            </div>

            <div className="space-y-3">
              {todayAssignments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg p-4">
                  <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium text-slate-600">No dispatches scheduled for this day</p>
                  <button
                    onClick={() => onOpenNewAssignment()}
                    className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium shadow transition"
                  >
                    + Schedule Dispatch
                  </button>
                </div>
              ) : (
                todayAssignments.map(asg => {
                  const collector = collectors.find(c => c.id === asg.collectorId);
                  const site = sites.find(s => s.id === asg.siteId);

                  return (
                    <div 
                      key={asg.id} 
                      className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-white transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-slate-900">
                          {collector?.name || 'Collector'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asg.status === 'On-Site' ? 'bg-emerald-100 text-emerald-800' :
                          asg.status === 'Dispatched' ? 'bg-amber-100 text-amber-800' :
                          asg.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {asg.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium">
                        {site?.name || 'Site'}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{asg.shift.split(' ')[0]} shift</span>
                        <span className="font-semibold text-slate-700">
                          {asg.unitsCollected} / {asg.targetUnits} {site?.unitType || 'units'}
                        </span>
                      </div>

                      {asg.assignedEquipmentIds && asg.assignedEquipmentIds.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Boxes className="w-3 h-3 text-purple-500" />
                          <span>Gear: {asg.assignedEquipmentIds.length} items checked out</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => onOpenNewAssignment()}
              className="w-full mt-4 py-2 border border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <span>+ Add Field Assignment</span>
            </button>
          </div>

          {/* Quick Safety & Protocol Reminder Box */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 shadow-sm text-xs">
            <div className="flex items-center gap-2 mb-2 font-semibold text-amber-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Field Safety Mandate</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              All field personnel must complete a two-way radio or satellite check-in upon arrival at remote sites. 
              Confirm required PPE, permits, and calibrated sensors before departing depot staging areas.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
