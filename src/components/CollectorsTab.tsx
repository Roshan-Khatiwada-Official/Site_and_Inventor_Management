import React, { useState } from 'react';
import { 
  HardHat, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Truck, 
  ShieldCheck, 
  Award, 
  Calendar, 
  Edit, 
  Trash2, 
  Building2, 
  Boxes,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { DataCollector, DailyAssignment, Site, Equipment } from '../types';

interface CollectorsTabProps {
  collectors: DataCollector[];
  assignments: DailyAssignment[];
  sites: Site[];
  equipment: Equipment[];
  currentDate: string;
  onAddCollector: () => void;
  onEditCollector: (collector: DataCollector) => void;
  onDeleteCollector: (collectorId: string) => void;
  onDispatchCollector: (collectorId: string) => void;
}

export const CollectorsTab: React.FC<CollectorsTabProps> = ({
  collectors,
  assignments,
  sites,
  equipment,
  currentDate,
  onAddCollector,
  onEditCollector,
  onDeleteCollector,
  onDispatchCollector,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Filter collectors
  const filteredCollectors = collectors.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.certifications.some(cert => cert.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesRole = roleFilter === 'All' || c.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Header with Search & Add Collector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">
              Data Collectors & Field Personnel
            </h2>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              {collectors.length} Field Technicians
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage field team profiles, required certifications, vehicles, and active shift rosters
          </p>
        </div>

        <button
          onClick={onAddCollector}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg shadow-sm transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Collector</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search team members by name, ID, certification, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Standby">Standby</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Lead Field Specialist">Lead Field Specialist</option>
              <option value="Senior Surveyor">Senior Surveyor</option>
              <option value="Field Enumerator">Field Enumerator</option>
              <option value="GIS Technician">GIS Technician</option>
              <option value="Environmental Tech">Environmental Tech</option>
            </select>
          </div>
        </div>
      </div>

      {/* Collector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCollectors.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            <HardHat className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No collectors found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No field collectors matched your search criteria.
            </p>
          </div>
        ) : (
          filteredCollectors.map(col => {
            // Find today's assignment
            const todayAsg = assignments.find(
              a => a.collectorId === col.id && a.date === currentDate && a.status !== 'Cancelled'
            );
            const assignedSite = todayAsg ? sites.find(s => s.id === todayAsg.siteId) : null;

            // Find gear in custody
            const custodyGear = equipment.filter(e => e.assignedCollectorId === col.id);

            return (
              <div 
                key={col.id} 
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition flex flex-col justify-between"
              >
                <div>
                  
                  {/* Top: Collector avatar, badge ID, and status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-sm">
                        {col.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{col.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-600">{col.employeeId}</span>
                          <span>•</span>
                          <span>{col.role}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      col.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                      col.status === 'Standby' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {col.status}
                    </span>
                  </div>

                  {/* Contact & vehicle info */}
                  <div className="space-y-1 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{col.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{col.email}</span>
                    </div>
                    {col.vehicleAssigned && (
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>{col.vehicleAssigned}</span>
                      </div>
                    )}
                  </div>

                  {/* Today's assignment status */}
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Today's Assignment ({currentDate})
                    </span>
                    {todayAsg ? (
                      <div className="bg-blue-50/70 border border-blue-200 p-2.5 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            {assignedSite?.name || 'Assigned Site'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-600 text-white">
                            {todayAsg.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{todayAsg.shift.split(' ')[0]}</span>
                          <span className="font-semibold text-slate-700">
                            {todayAsg.unitsCollected} / {todayAsg.targetUnits} {assignedSite?.unitType || 'units'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-slate-500 flex items-center justify-between">
                        <span>No shift assigned today</span>
                        {col.status === 'Active' && (
                          <button
                            onClick={() => onDispatchCollector(col.id)}
                            className="text-blue-600 hover:underline font-semibold text-[11px]"
                          >
                            + Dispatch
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Certifications tags */}
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Certifications & Badges
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {col.certifications.map((cert, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Equipment in custody */}
                  {custodyGear.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 flex items-center gap-1 mb-1 font-medium">
                        <Boxes className="w-3.5 h-3.5 text-purple-600" />
                        In Custody ({custodyGear.length} items):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {custodyGear.map(g => (
                          <span key={g.id} className="font-mono bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px]">
                            {g.assetTag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onDispatchCollector(col.id)}
                    className="text-xs bg-slate-100 hover:bg-blue-50 text-blue-700 hover:border-blue-300 border border-slate-200 px-2.5 py-1.5 rounded-md font-medium transition"
                  >
                    + Assign Shift
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCollector(col)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition"
                      title="Edit collector"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteCollector(col.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition"
                      title="Remove collector"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
