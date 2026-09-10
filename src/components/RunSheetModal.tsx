import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DailyAssignment, Site, DataCollector, Equipment } from '../types';

interface RunSheetModalProps {
  isOpen: boolean;
  currentDate: string;
  assignments: DailyAssignment[];
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  onClose: () => void;
}

export const RunSheetModal: React.FC<RunSheetModalProps> = ({
  isOpen,
  currentDate,
  assignments,
  sites,
  collectors,
  equipment,
  onClose,
}) => {
  if (!isOpen) return null;

  const dayAssignments = assignments.filter(a => a.date === currentDate && a.status !== 'Cancelled');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Site Code',
      'Site Name',
      'Supervisor',
      'Access Code',
      'Collector Name',
      'Employee ID',
      'Collector Phone',
      'Vehicle',
      'Shift',
      'Status',
      'Target Units',
      'Collected Units',
      'Assigned Equipment',
    ];

    const rows = dayAssignments.map(asg => {
      const site = sites.find(s => s.id === asg.siteId);
      const collector = collectors.find(c => c.id === asg.collectorId);
      const gear = equipment
        .filter(e => asg.assignedEquipmentIds?.includes(e.id))
        .map(e => `${e.assetTag} (${e.name})`)
        .join('; ');

      return [
        asg.date,
        site?.code || '',
        `"${site?.name || ''}"`,
        `"${site?.supervisor || ''}"`,
        `"${site?.accessCode || ''}"`,
        `"${collector?.name || ''}"`,
        collector?.employeeId || '',
        collector?.phone || '',
        `"${collector?.vehicleAssigned || ''}"`,
        `"${asg.shift}"`,
        asg.status,
        asg.targetUnits,
        asg.unitsCollected,
        `"${gear}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Field_Dispatch_Roster_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-xl overflow-hidden my-8 print:m-0 print:border-none print:shadow-none print:max-w-none">
        
        {/* Screen Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Daily Field Dispatch Run Sheet
              </h3>
              <p className="text-xs text-slate-500">Official field deployment roster and equipment manifest</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Run Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Manifest Body */}
        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 text-slate-800 text-xs">
          
          {/* Official Document Banner */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block">
                FIELD OPERATIONS COMMAND • DAILY LOG
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                DISPATCH RUN SHEET & EQUIPMENT MANIFEST
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Site arrangements, assigned personnel, vehicle logs & calibrated assets
              </p>
            </div>

            <div className="text-right font-mono text-xs">
              <div><strong className="text-slate-900">DATE:</strong> {currentDate}</div>
              <div className="text-slate-500">DISPATCHED RUNS: {dayAssignments.length}</div>
              <div className="text-slate-500">PRINTED: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* Emergency Protocols Strip */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 flex items-start gap-3 print:bg-transparent">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-slate-900">MANDATORY PROTOCOLS:</strong> Conduct radio/satellite check-in upon arrival at field site. Verify emergency eyewash, calibrated gas monitors, and vehicle first aid kits prior to site entry. Dispatch Desk Emergency Phone: <strong>+1 (800) 555-FIELD</strong> (24/7 Ops).
            </div>
          </div>

          {/* Manifest Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-300">Site & Access</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Data Collector</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Shift & Vehicle</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Target Units</th>
                  <th className="py-2.5 px-3">Checked-Out Equipment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dayAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      No field assignments scheduled for {currentDate}.
                    </td>
                  </tr>
                ) : (
                  dayAssignments.map(asg => {
                    const site = sites.find(s => s.id === asg.siteId);
                    const collector = collectors.find(c => c.id === asg.collectorId);
                    const gear = equipment.filter(e => asg.assignedEquipmentIds?.includes(e.id));

                    return (
                      <tr key={asg.id} className="align-top">
                        
                        {/* Site */}
                        <td className="py-3 px-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900 text-xs">
                            [{site?.code}] {site?.name}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Supv: {site?.supervisor} ({site?.contactPhone})
                          </div>
                          {site?.accessCode && (
                            <div className="text-slate-700 font-medium text-[11px] mt-1 bg-slate-50 p-1 rounded border border-slate-200">
                              Access: {site.accessCode}
                            </div>
                          )}
                        </td>

                        {/* Collector */}
                        <td className="py-3 px-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">
                            {collector?.name}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            ID: {collector?.employeeId} • {collector?.role}
                          </div>
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            {collector?.phone}
                          </div>
                        </td>

                        {/* Shift & Vehicle */}
                        <td className="py-3 px-3 border-r border-slate-200">
                          <div className="font-semibold text-slate-800">
                            {asg.shift}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Status: <span className="font-bold text-slate-900">{asg.status}</span>
                          </div>
                          {collector?.vehicleAssigned && (
                            <div className="text-slate-600 text-[11px] mt-0.5">
                              {collector.vehicleAssigned}
                            </div>
                          )}
                        </td>

                        {/* Target */}
                        <td className="py-3 px-3 border-r border-slate-200">
                          <div className="font-bold text-slate-900">
                            {asg.targetUnits} {site?.unitType || 'units'}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Logged: {asg.unitsCollected}
                          </div>
                        </td>

                        {/* Equipment */}
                        <td className="py-3 px-3">
                          {gear.length === 0 ? (
                            <span className="text-slate-400 italic">No gear checked out</span>
                          ) : (
                            <ul className="space-y-1 text-[11px]">
                              {gear.map(g => (
                                <li key={g.id} className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold bg-slate-100 px-1 rounded text-[10px]">
                                    {g.assetTag}
                                  </span>
                                  <span className="truncate">{g.name}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures & Chain of Custody Sign-Off */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 print:grid-cols-2">
            <div className="border-t border-slate-400 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                DISPATCH OFFICER SIGNATURE & VERIFICATION
              </span>
              <div className="h-10"></div>
              <div className="text-slate-600 text-xs">Date & Time: _________________________</div>
            </div>

            <div className="border-t border-slate-400 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                FIELD SUPERVISOR / LEAD COLLECTOR ACKNOWLEDGEMENT
              </span>
              <div className="h-10"></div>
              <div className="text-slate-600 text-xs">Date & Time: _________________________</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
