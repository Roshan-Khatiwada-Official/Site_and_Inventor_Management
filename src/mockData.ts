import { Site, DataCollector, DailyAssignment, Equipment, TransferLog, UserAccount } from './types';

/**
 * Seed data — ONE sample record per collection.
 *
 * This is only used the very first time the app runs in a browser that has no
 * local data and is not yet connected to the Google Sheet database. Once the
 * Google Sheet bridge is connected, the sheet is the single source of truth
 * and these values are replaced on load.
 */

export const INITIAL_SITES: Site[] = [
  {
    id: 'site-001',
    code: 'SITE-001',
    name: 'Sample Field Site',
    region: 'Central',
    address: '1 Sample Road, Central District',
    coordinates: { lat: 27.7172, lng: 85.3240 },
    status: 'Active',
    supervisor: 'Sample Supervisor',
    contactPhone: '+977-9800000000',
    targetDailyUnits: 50,
    unitType: 'survey points',
    requiredCertifications: ['Field Safety'],
    safetyNotes: 'Sample safety note.',
    accessCode: '0000',
    createdAt: '2026-09-08',
  },
];

export const INITIAL_COLLECTORS: DataCollector[] = [
  {
    id: 'col-001',
    employeeId: 'EMP-001',
    name: 'Sample Collector',
    role: 'Field Enumerator',
    phone: '+977-9811111111',
    email: 'collector@example.com',
    status: 'Active',
    certifications: ['Field Safety'],
    vehicleAssigned: 'VAN-01',
    dailyCapacity: 60,
  },
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-001',
    assetTag: 'EQ-001',
    name: 'Sample GNSS Receiver',
    category: 'GNSS & Surveying',
    serialNumber: 'SN-0001',
    status: 'Available',
    condition: 'Good',
    assignedSiteId: undefined,
    assignedCollectorId: undefined,
    lastCalibrationDate: '2026-08-01',
    nextCalibrationDate: '2027-02-01',
    storageLocation: 'Central Depot - Bin 1',
    notes: 'Sample equipment record.',
    handledBy: 'Sample Officer',
  },
];

export const INITIAL_ASSIGNMENTS: DailyAssignment[] = [
  {
    id: 'asg-001',
    date: '2026-09-08',
    siteId: 'site-001',
    collectorId: 'col-001',
    shift: 'Morning (07:00 - 15:00)',
    status: 'Scheduled',
    targetUnits: 50,
    unitsCollected: 0,
    checkInTime: undefined,
    checkOutTime: undefined,
    notes: 'Sample assignment.',
    assignedEquipmentIds: [],
    dispatchedBy: 'sagar',
  },
];

export const INITIAL_TRANSFERS: TransferLog[] = [
  {
    id: 'tr-001',
    equipmentId: 'eq-001',
    equipmentTag: 'EQ-001',
    equipmentName: 'Sample GNSS Receiver',
    fromLocation: 'Central Depot - Bin 1',
    toLocation: 'Central Depot - Bin 1',
    transferredBy: 'sagar',
    timestamp: '2026-09-08 09:00:00',
    condition: 'Good',
    notes: 'Sample transfer record.',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    loginId: 'sagar',
    password: 'password123',
    name: 'Sagar',
    email: 'sagar@example.com',
    role: 'Admin',
    status: 'Active',
    assignedSiteId: undefined,
    collectorId: undefined,
    createdAt: '2026-09-08',
    notes: 'Administrator account.',
  },
];
