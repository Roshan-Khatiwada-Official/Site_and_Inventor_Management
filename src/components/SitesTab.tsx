import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Phone, 
  Shield, 
  Key, 
  HardHat, 
  Boxes, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Site, DataCollector, Equipment, DailyAssignment, UserAccount } from '../types';

interface SitesTabProps {
  currentDate: string;
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  assignments: DailyAssignment[];
  currentUser?: UserAccount | null;
  onAddSite: () => void;
  onEditSite: (site: Site) => void;
  onDeleteSite: (siteId: string) => void;
  onOpenNewAssignment: (siteId: string) => void;
  onDeployEquipmentToSite: (siteId: string) => void;
}

export const SitesTab: React.FC<SitesTabProps> = ({
  currentDate,
  sites,
  collectors,
  equipment,
  assignments,
  currentUser,
  onAddSite,
  onEditSite,
  onDeleteSite,
  onOpenNewAssignment,
  onDeployEquipmentToSite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);

  // Extract unique regions for dropdown
  const regions = Array.from(new Set(sites.map(s => s.region))).sort();

  // Filter sites
  const filteredSites = sites.filter(site => {
    const matchesSearch = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || site.status === statusFilter;
    const matchesRegion = regionFilter === 'All' || site.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  const toggleExpand = (siteId: string) => {
    setExpandedSiteId(expandedSiteId === siteId ? null : siteId);
  };

  return (
    <div className="space-y-6">
      
      {/* Scoped Visibility Notice for Non-Admin Staff */}
      {currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Operations Manager' && currentUser.role !== 'Site Registrar' && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
            <div>
              <strong>Authorized Sites View:</strong> Showing only field sites you have dispatched or are assigned to coordinate (<strong>{currentUser.name}</strong>). Other regional facilities remain restricted.
            </div>
          </div>
          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono text-[11px] font-semibold shrink-0">
            {sites.length} site{sites.length === 1 ? '' : 's'} accessible
          </span>
        </div>
      )}

      {/* Top Controls: Filter, Search, and Add Site */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites by name, site code, supervisor, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses ({sites.length})</option>
              <option value="Active">Active</option>
              <option value="Planned">Planned</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <span>Region:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Regions</option>
              {regions.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          <button
            onClick={onAddSite}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg shadow-sm transition ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Site</span>
          </button>
        </div>

      </div>

      {/* Sites Listing Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSites.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-700">No matching site arrangements found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, status filters, or add a new field site arrangement.
            </p>
            <button
              onClick={onAddSite}
              className="mt-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              Create New Site
            </button>
          </div>
        ) : (
          filteredSites.map(site => {
            const isExpanded = expandedSiteId === site.id;
            
            // Collect today's assignments for this site
            const siteAssignments = assignments.filter(
              a => a.siteId === site.id && a.date === currentDate && a.status !== 'Cancelled'
            );

            // Get equipment stationed here
            const siteEquipment = equipment.filter(e => e.assignedSiteId === site.id);

            // Calculate metrics for today
            const totalTarget = siteAssignments.reduce((acc, a) => acc + a.targetUnits, 0) || site.targetDailyUnits;
            const totalCollected = siteAssignments.reduce((acc, a) => acc + a.unitsCollected, 0);
            const progress = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

            return (
              <div 
                key={site.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition hover:border-slate-300"
              >
                {/* Main Card Header / Summary Row */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Site Name and Details */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center font-bold text-sm tracking-tight shadow-inner flex-shrink-0">
                        {site.code}
                      </div>

                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            {site.name}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            site.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            site.status === 'Planned' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            site.status === 'Paused' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {site.status}
                          </span>
                        </div>

                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {site.address}
                          </span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{site.region}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">
                            [{site.coordinates.lat.toFixed(3)}, {site.coordinates.lng.toFixed(3)}]
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Progress and Action Buttons */}
                    <div className="flex items-center flex-wrap gap-4 self-start lg:self-center">
                      
                      {/* Daily progress metric */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-right min-w-[150px]">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Today's Progress
                        </div>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">
                          {totalCollected} / {totalTarget} <span className="text-xs font-normal text-slate-500">{site.unitType}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenNewAssignment(site.id)}
                          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-sm transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Dispatch Staff</span>
                        </button>

                        <button
                          onClick={() => onEditSite(site)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                          title="Edit site details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteSite(site.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                          title="Delete site"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleExpand(site.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1 text-xs font-medium"
                        >
                          <span>{isExpanded ? 'Less' : 'Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* Summary Badges: Assigned Collectors & Stationed Equipment */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-500 flex items-center gap-1">
                        <HardHat className="w-3.5 h-3.5 text-amber-500" />
                        Personnel Scheduled ({siteAssignments.length}):
                      </span>
                      {siteAssignments.length === 0 ? (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                          Unassigned today
                        </span>
                      ) : (
                        siteAssignments.map(asg => {
                          const col = collectors.find(c => c.id === asg.collectorId);
                          return (
                            <span 
                              key={asg.id} 
                              className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {col?.name || 'Collector'} ({asg.shift.split(' ')[0]})
                            </span>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Boxes className="w-3.5 h-3.5 text-purple-600" />
                        <span>Stationed Equipment: <strong>{siteEquipment.length} items</strong></span>
                      </span>
                      <button
                        onClick={() => onDeployEquipmentToSite(site.id)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium hover:underline ml-1"
                      >
                        + Deploy Gear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="bg-slate-50 p-5 border-t border-slate-200 text-xs text-slate-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Contact & Access info */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          Site Supervisor & Access
                        </h4>
                        <div>
                          <div className="font-medium text-slate-800">{site.supervisor}</div>
                          <div className="text-slate-500">{site.contactPhone}</div>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-600">
                          <HardHat className="w-3.5 h-3.5 text-amber-500" />
                          <span>Workers on site: <strong>{site.workerCount ?? 0}</strong></span>
                        </div>
                        {site.accessCode && (
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-600">
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                            <span>Access: <strong>{site.accessCode}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Site Note */}
                      {site.notes && site.notes.trim() && (
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                            Note
                          </h4>
                          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{site.notes}</p>
                        </div>
                      )}

                      {/* Safety & Prerequisites */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-600" />
                          Safety Protocol & Notes
                        </h4>
                        <p className="text-slate-600 leading-relaxed">
                          {site.safetyNotes || 'Standard field safety procedures apply.'}
                        </p>
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                            Required Certifications:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {site.requiredCertifications.map((cert, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-medium">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Equipment Stationed Here */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-purple-600" />
                            Stationed Assets ({siteEquipment.length})
                          </h4>
                          <button
                            onClick={() => onDeployEquipmentToSite(site.id)}
                            className="text-purple-600 hover:underline text-[11px] font-medium"
                          >
                            + Deploy
                          </button>
                        </div>
                        
                        {siteEquipment.length === 0 ? (
                          <div className="text-slate-400 italic py-2">
                            No dedicated gear stationed on-site. Collectors bring portable kits.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {siteEquipment.map(eq => (
                              <div key={eq.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100">
                                <div>
                                  <span className="font-mono font-bold text-slate-700 mr-1.5">{eq.assetTag}</span>
                                  <span className="text-slate-600">{eq.name}</span>
                                </div>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                                  eq.condition === 'Excellent' ? 'text-emerald-700 font-semibold' : 'text-slate-600'
                                }`}>
                                  {eq.condition}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
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
