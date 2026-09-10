import { Site, DataCollector, DailyAssignment, Equipment, TransferLog, OperationalAlert, UserAccount } from '../types';
import { INITIAL_SITES, INITIAL_COLLECTORS, INITIAL_ASSIGNMENTS, INITIAL_EQUIPMENT, INITIAL_TRANSFERS, INITIAL_USERS } from '../mockData';

const STORAGE_KEY_PREFIX = 'site_inventory_mgr_';

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (item) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
  }
  return fallback;
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export function getActiveSessionUserId(): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}active_user_id`);
  } catch {
    return null;
  }
}

export function setActiveSessionUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}active_user_id`, userId);
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}active_user_id`);
    }
  } catch (err) {
    console.error('Failed to update active session:', err);
  }
}

export function clearAllStorage(): void {
  const keys = ['sites', 'collectors', 'assignments', 'equipment', 'transfers', 'users', 'active_user_id'];
  keys.forEach(k => localStorage.removeItem(`${STORAGE_KEY_PREFIX}${k}`));
}

export function generateOperationalAlerts(
  equipment: Equipment[],
  assignments: DailyAssignment[],
  sites: Site[],
  collectors: DataCollector[],
  currentDate: string
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  // Check equipment calibrations
  const today = new Date(currentDate);
  equipment.forEach(eq => {
    if (eq.nextCalibrationDate) {
      const nextCalib = new Date(eq.nextCalibrationDate);
      const diffTime = nextCalib.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          id: `alert-calib-overdue-${eq.id}`,
          type: 'critical',
          title: `Calibration Overdue: ${eq.assetTag}`,
          description: `${eq.name} expired ${Math.abs(diffDays)} day(s) ago (${eq.nextCalibrationDate}). Recalibration required before field deployment.`,
          entityType: 'equipment',
          entityId: eq.id,
          timestamp: 'Action Needed',
        });
      } else if (diffDays <= 14) {
        alerts.push({
          id: `alert-calib-soon-${eq.id}`,
          type: 'warning',
          title: `Calibration Due Soon: ${eq.assetTag}`,
          description: `${eq.name} is due for certification/calibration in ${diffDays} day(s) on ${eq.nextCalibrationDate}.`,
          entityType: 'equipment',
          entityId: eq.id,
          timestamp: `${diffDays}d remaining`,
        });
      }
    }

    if (eq.status === 'Maintenance' || eq.condition === 'Needs Repair') {
      alerts.push({
        id: `alert-maint-${eq.id}`,
        type: 'warning',
        title: `Out of Service: ${eq.assetTag}`,
        description: `${eq.name} is flagged for maintenance (${eq.notes || 'Compensator / sensor issue'}).`,
        entityType: 'equipment',
        entityId: eq.id,
        timestamp: 'Maintenance',
      });
    }
  });

  // Check active sites with zero assignments today
  const activeSites = sites.filter(s => s.status === 'Active');
  const todayAssignments = assignments.filter(a => a.date === currentDate && a.status !== 'Cancelled');
  
  activeSites.forEach(site => {
    const siteAssigned = todayAssignments.some(a => a.siteId === site.id);
    if (!siteAssigned) {
      alerts.push({
        id: `alert-site-unstaffed-${site.id}`,
        type: 'warning',
        title: `Unstaffed Active Site: ${site.code}`,
        description: `Site "${site.name}" is marked Active but has no field personnel scheduled for ${currentDate}.`,
        entityType: 'site',
        entityId: site.id,
        timestamp: 'Staffing Gap',
      });
    }
  });

  // Check collectors with double bookings on same shift and date
  const shiftMap = new Map<string, string[]>();
  todayAssignments.forEach(a => {
    const key = `${a.collectorId}_${a.shift}`;
    if (!shiftMap.has(key)) {
      shiftMap.set(key, []);
    }
    shiftMap.get(key)!.push(a.siteId);
  });

  shiftMap.forEach((siteIds, key) => {
    if (siteIds.length > 1) {
      const [colId, shift] = key.split('_');
      const col = collectors.find(c => c.id === colId);
      alerts.push({
        id: `alert-conflict-${key}`,
        type: 'critical',
        title: `Schedule Conflict: ${col?.name || 'Collector'}`,
        description: `Assigned to ${siteIds.length} different sites during shift "${shift}".`,
        entityType: 'assignment',
        entityId: colId,
        timestamp: 'Shift Conflict',
      });
    }
  });

  return alerts;
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
