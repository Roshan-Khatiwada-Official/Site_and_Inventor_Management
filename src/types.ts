export type SiteStatus = 'Active' | 'Planned' | 'Paused' | 'Completed';

export type ShiftType = 'Morning (07:00 - 15:00)' | 'Afternoon (14:00 - 22:00)' | 'Night (21:00 - 05:00)' | 'Full Day (08:00 - 17:00)';

export type AssignmentStatus = 'Scheduled' | 'Dispatched' | 'On-Site' | 'Completed' | 'Cancelled';

export type EquipmentCategory = 
  | 'GNSS & Surveying'
  | 'Field Laptops & Tablets'
  | 'Environmental Sensors'
  | 'Drones & Imaging'
  | 'Power & Solar'
  | 'Safety & PPE';

export type EquipmentStatus = 'Available' | 'Deployed' | 'Maintenance' | 'Inspection Due';

export type EquipmentCondition = 'Excellent' | 'Good' | 'Fair' | 'Needs Repair';

export type CollectorStatus = 'Active' | 'On Leave' | 'Standby';

export interface Site {
  id: string;
  code: string;
  name: string;
  region: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: SiteStatus;
  supervisor: string;
  contactPhone: string;
  targetDailyUnits: number;
  unitType: string; // e.g. "soil cores", "inspections", "water samples", "survey points"
  requiredCertifications: string[];
  safetyNotes: string;
  accessCode?: string;
  workerCount?: number;
  notes?: string;
  createdAt: string;
}

export interface DataCollector {
  id: string;
  employeeId: string;
  name: string;
  role: 'Lead Field Specialist' | 'Senior Surveyor' | 'Field Enumerator' | 'GIS Technician' | 'Environmental Tech';
  phone: string;
  email: string;
  status: CollectorStatus;
  certifications: string[];
  vehicleAssigned?: string;
  dailyCapacity: number; // typical units per day
}

export interface DailyAssignment {
  id: string;
  date: string; // YYYY-MM-DD
  siteId: string;
  collectorId: string;
  shift: ShiftType;
  status: AssignmentStatus;
  targetUnits: number;
  unitsCollected: number;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  assignedEquipmentIds: string[];
  dispatchedBy?: string; // Name or loginId of the dispatcher who created/scheduled this assignment
}

export interface Equipment {
  id: string;
  assetTag: string; // e.g. EQ-1042
  name: string;
  category: EquipmentCategory;
  serialNumber: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  assignedSiteId?: string;
  assignedCollectorId?: string;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  storageLocation: string; // e.g. "Central Depot - Bin 14" or "On-Site Trailer"
  notes?: string;
  handledBy?: string; // Name or loginId of the equipment officer who inspected or transferred this item
}

export interface TransferLog {
  id: string;
  equipmentId: string;
  equipmentTag: string;
  equipmentName: string;
  fromLocation: string;
  toLocation: string;
  transferredBy: string;
  timestamp: string;
  condition: EquipmentCondition;
  notes: string;
}

export interface OperationalAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  entityType: 'equipment' | 'assignment' | 'site';
  entityId?: string;
  timestamp: string;
}

export type AppUserRole =
  | 'Admin'
  | 'Operations Manager'
  | 'Site Registrar'
  | 'Site Dispatcher'
  | 'Equipment Officer'
  | 'Field Collector';

export interface UserAccount {
  id: string;
  loginId: string; // Unique login ID / username
  password: string; // Password managed by admin
  name: string;
  email: string;
  role: AppUserRole;
  status: 'Active' | 'Suspended';
  assignedSiteId?: string;
  collectorId?: string; // Optional link to DataCollector if role is Field Collector
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}
