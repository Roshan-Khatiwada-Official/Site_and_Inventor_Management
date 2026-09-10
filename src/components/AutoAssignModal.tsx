import React, { useState, useMemo } from 'react';
import { X, Sparkles, Building2, User, Boxes, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Site, DataCollector, Equipment, DailyAssignment, ShiftType } from '../types';

interface ProposedPairing {
  id: string;
  siteId: string;
  collectorId: string;
  shift: ShiftType;
  equipmentIds: string[];
  targetUnits: number;
  matchScore: number; // based on matching certifications
  matchedCerts: string[];
  missingCerts: string[];
  selected: boolean;
}

interface AutoAssignModalProps {
  isOpen: boolean;
  currentDate: string;
  sites: Site[];
  collectors: DataCollector[];
  equipment: Equipment[];
  existingAssignments: DailyAssignment[];
  onClose: () => void;
  onApplyAssignments: (newAssignments: DailyAssignment[], equipmentDeployments: { equipmentId: string; siteId: string; collectorId: string }[]) => void;
}

export const AutoAssignModal: React.FC<AutoAssignModalProps> = ({
  isOpen,
  currentDate,
  sites,
  collectors,
  equipment,
  existingAssignments,
  onClose,
  onApplyAssignments,
}) => {
  // Generate proposed pairings when modal opens or date changes
  const proposals = useMemo(() => {
    const activeSites = sites.filter(s => s.status === 'Active');
    const dayAssignments = existingAssignments.filter(a => a.date === currentDate && a.status !== 'Cancelled');
    
    // Find unstaffed active sites
    const staffedSiteIds = new Set(dayAssignments.map(a => a.siteId));
    const unstaffedSites = activeSites.filter(s => !staffedSiteIds.has(s.id));

    // Find available active collectors not assigned on this date
    const assignedCollectorIds = new Set(dayAssignments.map(a => a.collectorId));
    const availableCollectors = collectors.filter(
      c => c.status === 'Active' && !assignedCollectorIds.has(c.id)
    );

    // Available equipment in depot
    const availableGear = equipment.filter(e => e.status === 'Available');

    const result: ProposedPairing[] = [];
    const usedCollectorIds = new Set<string>();
    const usedGearIds = new Set<string>();

    unstaffedSites.forEach(site => {
      // Find best matching available collector
      let bestCollector: DataCollector | null = null;
      let highestScore = -1;
      let bestMatchedCerts: string[] = [];
      let bestMissingCerts: string[] = [];

      availableCollectors.forEach(col => {
        if (usedCollectorIds.has(col.id)) return;

        const siteReqs = site.requiredCertifications || [];
        const colCerts = col.certifications || [];
        const matched = siteReqs.filter(r => colCerts.includes(r));
        const missing = siteReqs.filter(r => !colCerts.includes(r));
        
        // Score: match percentage + role priority
        let score = (matched.length / Math.max(1, siteReqs.length)) * 100;
        if (col.role === 'Lead Field Specialist' || col.role === 'Senior Surveyor') {
          score += 10;
        }

        if (score > highestScore) {
          highestScore = score;
          bestCollector = col;
          bestMatchedCerts = matched;
          bestMissingCerts = missing;
        }
      });

      if (bestCollector) {
        const col: DataCollector = bestCollector;
        usedCollectorIds.add(col.id);

        // Find 1-2 complementary equipment items from available depot gear
        const assignedGearForPair: string[] = [];
        availableGear.forEach(eq => {
          if (usedGearIds.has(eq.id)) return;
          if (assignedGearForPair.length >= 2) return;

          // Match category based on site requirements
          const isSurveySite = site.unitType.toLowerCase().includes('sample') || site.unitType.toLowerCase().includes('reading');
          if (isSurveySite && (eq.category === 'Environmental Sensors' || eq.category === 'Field Laptops & Tablets')) {
            assignedGearForPair.push(eq.id);
            usedGearIds.add(eq.id);
          } else if (eq.category === 'GNSS & Surveying' || eq.category === 'Drones & Imaging') {
            assignedGearForPair.push(eq.id);
            usedGearIds.add(eq.id);
          }
        });

        result.push({
          id: `prop-${site.id}-${col.id}`,
          siteId: site.id,
          collectorId: col.id,
          shift: 'Morning (07:00 - 15:00)',
          equipmentIds: assignedGearForPair,
          targetUnits: site.targetDailyUnits,
          matchScore: Math.round(highestScore),
          matchedCerts: bestMatchedCerts,
          missingCerts: bestMissingCerts,
          selected: true,
        });
      }
    });

    return result;
  }, [sites, collectors, equipment, existingAssignments, currentDate]);

  const [pairings, setPairings] = useState<ProposedPairing[]>([]);

  // Update local state when proposals calculate
  React.useEffect(() => {
    setPairings(proposals);
  }, [proposals]);

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    setPairings(pairings.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleApply = () => {
    const selectedPairings = pairings.filter(p => p.selected);
    const newAssignments: DailyAssignment[] = [];
    const equipmentDeployments: { equipmentId: string; siteId: string; collectorId: string }[] = [];

    selectedPairings.forEach((p, idx) => {
      const asgId = `asg-auto-${Date.now()}-${idx}`;
      newAssignments.push({
        id: asgId,
        date: currentDate,
        siteId: p.siteId,
        collectorId: p.collectorId,
        shift: p.shift,
        status: 'Scheduled',
        targetUnits: p.targetUnits,
        unitsCollected: 0,
        notes: `Auto-scheduled based on qualification score (${p.matchScore}%).`,
        assignedEquipmentIds: p.equipmentIds,
      });

      p.equipmentIds.forEach(eqId => {
        equipmentDeployments.push({
          equipmentId: eqId,
          siteId: p.siteId,
          collectorId: p.collectorId,
        });
      });
    });

    onApplyAssignments(newAssignments, equipmentDeployments);
    onClose();
  };

  const selectedCount = pairings.filter(p => p.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Smart Field Roster Optimizer
              </h3>
              <p className="text-xs text-slate-500">
                Match unstaffed active sites with qualified field collectors for {currentDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          
          {pairings.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h4 className="font-semibold text-slate-800 text-sm">All Active Sites Already Staffed!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No unstaffed active sites or available unassigned collectors were found for {currentDate}.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Proposed Matches ({pairings.length} generated):
                </span>
                <span className="text-slate-500">
                  {selectedCount} of {pairings.length} selected to roster
                </span>
              </div>

              <div className="space-y-3">
                {pairings.map(p => {
                  const site = sites.find(s => s.id === p.siteId);
                  const collector = collectors.find(c => c.id === p.collectorId);
                  const gear = equipment.filter(e => p.equipmentIds.includes(e.id));

                  return (
                    <div 
                      key={p.id}
                      onClick={() => toggleSelection(p.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        p.selected 
                          ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300' 
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={p.selected}
                          onChange={() => toggleSelection(p.id)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                        />

                        <div className="space-y-1.5">
                          {/* Site and Collector pairing */}
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              {site?.code}: {site?.name}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-amber-500" />
                              {collector?.name} ({collector?.role})
                            </span>
                          </div>

                          {/* Match score & certification badges */}
                          <div className="flex items-center flex-wrap gap-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              {p.matchScore}% Skill Match
                            </span>
                            <span className="text-slate-500">Shift: Morning (07:00 - 15:00)</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-600 font-medium">Target: {p.targetUnits} {site?.unitType}</span>
                          </div>

                          {/* Gear allocation preview */}
                          {gear.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] text-purple-700">
                              <Boxes className="w-3.5 h-3.5" />
                              <span>Auto-paired Gear: {gear.map(g => g.assetTag).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="self-end sm:self-center flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                          p.selected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {p.selected ? 'Selected' : 'Omitted'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">
            Creates dispatches & updates equipment chain of custody
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-sm transition disabled:opacity-50"
            >
              Apply {selectedCount} Dispatch(es)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
