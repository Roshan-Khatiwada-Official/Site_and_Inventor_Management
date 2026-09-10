import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRightLeft, 
  Building2, 
  User, 
  Calendar, 
  Edit, 
  Trash2, 
  RotateCcw,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { Equipment, Site, DataCollector, EquipmentCategory, EquipmentStatus, EquipmentCondition, TransferLog, UserAccount } from '../types';

interface InventoryTabProps {
  equipment: Equipment[];
  sites: Site[];
  collectors: DataCollector[];
  transfers: TransferLog[];
  currentDate: string;
  currentUser?: UserAccount | null;
  onAddEquipment: () => void;
  onEditEquipment: (item: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
  onDeployEquipment: (item: Equipment) => void;
  onReturnEquipment: (item: Equipment) => void;
  onUpdateCondition: (item: Equipment, condition: EquipmentCondition, status: EquipmentStatus) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  equipment,
  sites,
  collectors,
  transfers,
  currentDate,
  currentUser,
  onAddEquipment,
  onEditEquipment,
  onDeleteEquipment,
  onDeployEquipment,
  onReturnEquipment,
  onUpdateCondition,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [showTransfers, setShowTransfers] = useState(false);

  // Counters
  const deployedCount = equipment.filter(e => e.status === 'Deployed').length;
  const availableCount = equipment.filter(e => e.status === 'Available').length;
  const maintenanceCount = equipment.filter(e => e.status === 'Maintenance' || e.condition === 'Needs Repair').length;
  
  // Calibration alert counter
  const today = new Date(currentDate);
  const calibrationAlertsCount = equipment.filter(e => {
    if (!e.nextCalibrationDate) return false;
    const nextCalib = new Date(e.nextCalibrationDate);
    const diffDays = Math.ceil((nextCalib.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  }).length;

  const filteredEquipment = equipment.filter(item => {
    const site = sites.find(s => s.id === item.assignedSiteId);
    const collector = collectors.find(c => c.id === item.assignedCollectorId);

    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (collector?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesCondition = conditionFilter === 'All' || item.condition === conditionFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
  });

  return (
    <div className="space-y-6">
      
      {/* Scoped Visibility Notice for Non-Admin Staff */}
      {currentUser && currentUser.role !== 'Admin' && currentUser.role !== 'Operations Manager' && (
        <div className="bg-purple-50/90 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
            <div>
              <strong>Personal Custody Inventory:</strong> You can only see equipment and custody transfer logs handled or signed by you (<strong>{currentUser.name}</strong>). Other company hardware records remain restricted.
            </div>
          </div>
          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono text-[11px] font-semibold shrink-0">
            {equipment.length} asset{equipment.length === 1 ? '' : 's'} in custody
          </span>
        </div>
      )}

      {/* Top Header & Stat Chips */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              Cross-Site Equipment & Asset Inventory
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
              {equipment.length} Assets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of hardware allocation, site deployments, custody handoffs, and sensor calibrations
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowTransfers(!showTransfers)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            <span>{showTransfers ? 'Hide Audit Log' : 'Chain of Custody Log'}</span>
          </button>

          <button
            onClick={onAddEquipment}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset Item</span>
          </button>
        </div>
      </div>

      {/* Snapshot cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Depot (Available)</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{availableCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Ready for checkout</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Deployed in Field</span>
          <div className="text-xl font-bold text-blue-600 mt-1">{deployedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Assigned to sites & team</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Maintenance</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{maintenanceCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Out of service / bench repair</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Calibration Alerts</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{calibrationAlertsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Due in &lt; 14 days or expired</div>
        </div>
      </div>

      {/* Chain of Custody / Transfer History Drawer (if open) */}
      {showTransfers && (
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Transfer & Custody Audit Trail ({transfers.length} entries)
            </h3>
            <span className="text-xs text-slate-500">Immutable movement logs</span>
          </div>

          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="min-w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2 px-3">Asset</th>
                  <th className="py-2 px-3">From Location</th>
                  <th className="py-2 px-3">To Location / Collector</th>
                  <th className="py-2 px-3">Handled By</th>
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] mr-1">
                        {tr.equipmentTag}
                      </span>
                      {tr.equipmentName}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{tr.fromLocation}</td>
                    <td className="py-2 px-3 font-medium text-blue-700">{tr.toLocation}</td>
                    <td className="py-2 px-3 text-slate-600">{tr.transferredBy}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tr.condition === 'Excellent' ? 'bg-emerald-100 text-emerald-800' :
                        tr.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        tr.condition === 'Fair' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {tr.condition}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{tr.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter and search controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search equipment by tag, name, serial, site, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="GNSS & Surveying">GNSS & Surveying</option>
              <option value="Field Laptops & Tablets">Field Laptops & Tablets</option>
              <option value="Environmental Sensors">Environmental Sensors</option>
              <option value="Drones & Imaging">Drones & Imaging</option>
              <option value="Power & Solar">Power & Solar</option>
              <option value="Safety & PPE">Safety & PPE</option>
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
              <option value="Available">Available (Depot)</option>
              <option value="Deployed">Deployed</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inspection Due">Inspection Due</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <span>Condition:</span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="All">All Conditions</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Repair">Needs Repair</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Tag & Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status & Condition</th>
                <th className="py-3 px-4">Current Location / Assigned</th>
                <th className="py-3 px-4">Calibration Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No equipment found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map(item => {
                  const site = sites.find(s => s.id === item.assignedSiteId);
                  const collector = collectors.find(c => c.id === item.assignedCollectorId);

                  // Calibration check
                  let calibBadge = null;
                  if (item.nextCalibrationDate) {
                    const nextDate = new Date(item.nextCalibrationDate);
                    const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      calibBadge = (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                          Expired ({Math.abs(diffDays)}d ago)
                        </span>
                      );
                    } else if (diffDays <= 14) {
                      calibBadge = (
                        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                          Due in {diffDays}d
                        </span>
                      );
                    } else {
                      calibBadge = (
                        <span className="text-slate-500 font-mono">
                          {item.nextCalibrationDate}
                        </span>
                      );
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      
                      {/* Tag & Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold text-[11px]">
                            {item.assetTag}
                          </span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          S/N: {item.serialNumber}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Status & Condition */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Available' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Deployed' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'Maintenance' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.condition === 'Excellent' ? 'text-emerald-700' :
                            item.condition === 'Good' ? 'text-blue-700' :
                            item.condition === 'Fair' ? 'text-amber-700' :
                            'text-rose-700 font-semibold'
                          }`}>
                            ({item.condition})
                          </span>
                        </div>
                      </td>

                      {/* Current Location / Assigned */}
                      <td className="py-3 px-4">
                        {item.status === 'Deployed' ? (
                          <div className="space-y-0.5">
                            {site && (
                              <div className="font-semibold text-slate-900 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-blue-500" />
                                {site.name}
                              </div>
                            )}
                            {collector && (
                              <div className="text-slate-500 text-[11px] flex items-center gap-1">
                                <User className="w-3 h-3 text-amber-500" />
                                In Custody: {collector.name}
                              </div>
                            )}
                            {!site && !collector && (
                              <span className="text-slate-500 italic">{item.storageLocation}</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-600">
                            {item.storageLocation || 'Central Depot'}
                          </div>
                        )}
                      </td>

                      {/* Calibration */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div>{calibBadge}</div>
                          <div className="text-[10px] text-slate-400">
                            Last: {item.lastCalibrationDate || 'N/A'}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'Available' ? (
                            <button
                              onClick={() => onDeployEquipment(item)}
                              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded font-medium transition"
                            >
                              Deploy Gear
                            </button>
                          ) : item.status === 'Deployed' ? (
                            <button
                              onClick={() => onReturnEquipment(item)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1 rounded font-medium transition"
                            >
                              Check In / Return
                            </button>
                          ) : (
                            <button
                              onClick={() => onUpdateCondition(item, 'Good', 'Available')}
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-medium transition"
                            >
                              Clear Maint
                            </button>
                          )}

                          <button
                            onClick={() => onEditEquipment(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                            title="Edit equipment"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteEquipment(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete equipment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
