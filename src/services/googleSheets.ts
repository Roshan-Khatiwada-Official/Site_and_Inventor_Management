import { Site, DataCollector, DailyAssignment, Equipment, TransferLog, UserAccount } from '../types';

export interface SheetDatabaseConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
}

const STORAGE_CONFIG_KEY = 'site_mgr_google_sheets_config';

export function getStoredSheetConfig(): SheetDatabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSheetConfig(config: SheetDatabaseConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_CONFIG_KEY);
    }
  } catch (e) {
    console.error('Error saving sheets config:', e);
  }
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export const SHEET_NAMES = {
  SITES: 'Sites',
  COLLECTORS: 'Collectors',
  ASSIGNMENTS: 'Assignments',
  EQUIPMENT: 'Equipment',
  TRANSFERS: 'Transfers',
  USERS: 'Users',
} as const;

// Headers definition
export const HEADERS = {
  SITES: [
    'Site ID',
    'Site Code',
    'Name',
    'Region',
    'Address',
    'Latitude',
    'Longitude',
    'Status',
    'Supervisor',
    'Contact Phone',
    'Daily Target Units',
    'Unit Type',
    'Required Certifications',
    'Safety Notes',
    'Access Code',
    'Created At',
  ],
  COLLECTORS: [
    'Collector ID',
    'Employee ID',
    'Full Name',
    'Role',
    'Phone',
    'Email',
    'Status',
    'Certifications',
    'Assigned Vehicle',
    'Daily Capacity',
  ],
  ASSIGNMENTS: [
    'Assignment ID',
    'Date',
    'Shift',
    'Site ID',
    'Site Name',
    'Collector ID',
    'Collector Name',
    'Status',
    'Target Units',
    'Units Collected',
    'Check In Time',
    'Check Out Time',
    'Assigned Equipment IDs',
    'Notes',
  ],
  EQUIPMENT: [
    'Asset ID',
    'Asset Tag',
    'Equipment Name',
    'Category',
    'Serial Number',
    'Status',
    'Condition',
    'Storage Location',
    'Assigned Site ID',
    'Assigned Collector ID',
    'Last Calibration',
    'Next Calibration',
    'Notes',
  ],
  TRANSFERS: [
    'Transfer ID',
    'Equipment ID',
    'Asset Tag',
    'Equipment Name',
    'From Location',
    'To Location',
    'Transferred By',
    'Timestamp',
    'Condition',
    'Notes',
  ],
  USERS: [
    'User ID',
    'Login ID',
    'Password',
    'Full Name',
    'Email',
    'Assigned Role',
    'Status',
    'Assigned Site ID',
    'Collector ID',
    'Created At',
    'Notes',
  ],
};

// Data conversion helpers: Models -> Row Arrays
export function sitesToRows(sites: Site[]): (string | number)[][] {
  return sites.map(s => [
    s.id,
    s.code,
    s.name,
    s.region,
    s.address,
    s.coordinates?.lat ?? '',
    s.coordinates?.lng ?? '',
    s.status,
    s.supervisor || '',
    s.contactPhone || '',
    s.targetDailyUnits || 0,
    s.unitType || 'units',
    (s.requiredCertifications || []).join(', '),
    s.safetyNotes || '',
    s.accessCode || '',
    s.createdAt || new Date().toISOString().split('T')[0],
  ]);
}

export function collectorsToRows(collectors: DataCollector[]): (string | number)[][] {
  return collectors.map(c => [
    c.id,
    c.employeeId || '',
    c.name,
    c.role,
    c.phone,
    c.email,
    c.status,
    (c.certifications || []).join(', '),
    c.vehicleAssigned || '',
    c.dailyCapacity || 0,
  ]);
}

export function assignmentsToRows(
  assignments: DailyAssignment[],
  sites: Site[],
  collectors: DataCollector[]
): (string | number)[][] {
  const siteMap = new Map(sites.map(s => [s.id, s.name]));
  const colMap = new Map(collectors.map(c => [c.id, c.name]));

  return assignments.map(a => [
    a.id,
    a.date,
    a.shift,
    a.siteId,
    siteMap.get(a.siteId) || a.siteId,
    a.collectorId,
    colMap.get(a.collectorId) || a.collectorId,
    a.status,
    a.targetUnits || 0,
    a.unitsCollected || 0,
    a.checkInTime || '',
    a.checkOutTime || '',
    (a.assignedEquipmentIds || []).join(', '),
    a.notes || '',
  ]);
}

export function equipmentToRows(equipment: Equipment[]): (string | number)[][] {
  return equipment.map(e => [
    e.id,
    e.assetTag,
    e.name,
    e.category,
    e.serialNumber,
    e.status,
    e.condition,
    e.storageLocation,
    e.assignedSiteId || '',
    e.assignedCollectorId || '',
    e.lastCalibrationDate || '',
    e.nextCalibrationDate || '',
    e.notes || '',
  ]);
}

export function transfersToRows(transfers: TransferLog[]): (string | number)[][] {
  return transfers.map(t => [
    t.id,
    t.equipmentId,
    t.equipmentTag,
    t.equipmentName,
    t.fromLocation,
    t.toLocation,
    t.transferredBy,
    t.timestamp,
    t.condition,
    t.notes || '',
  ]);
}

export function usersToRows(users: UserAccount[]): (string | number)[][] {
  return users.map(u => [
    u.id,
    u.loginId,
    u.password,
    u.name,
    u.email,
    u.role,
    u.status,
    u.assignedSiteId || '',
    u.collectorId || '',
    u.createdAt || '',
    u.notes || '',
  ]);
}

// Row Arrays -> Models
export function rowsToSites(rows: any[][]): Site[] {
  if (!rows || rows.length <= 1) return [];
  // Skip header row
  return rows.slice(1).map((r, idx) => {
    const lat = parseFloat(r[5]);
    const lng = parseFloat(r[6]);
    const certs = r[12] ? String(r[12]).split(',').map(s => s.trim()).filter(Boolean) : [];
    
    return {
      id: r[0] || `site-${idx + 1}`,
      code: r[1] || `SITE-${idx + 1}`,
      name: r[2] || `Site ${idx + 1}`,
      region: r[3] || 'Central',
      address: r[4] || '',
      coordinates: (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : { lat: 37.7749, lng: -122.4194 },
      status: (['Active', 'Planned', 'Paused', 'Completed'].includes(r[7]) ? r[7] : 'Active') as any,
      supervisor: r[8] || '',
      contactPhone: r[9] || '',
      targetDailyUnits: Number(r[10]) || 0,
      unitType: r[11] || 'units',
      requiredCertifications: certs,
      safetyNotes: r[13] || '',
      accessCode: r[14] || undefined,
      createdAt: r[15] || new Date().toISOString().split('T')[0],
    };
  });
}

export function rowsToCollectors(rows: any[][]): DataCollector[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((r, idx) => {
    const certs = r[7] ? String(r[7]).split(',').map(s => s.trim()).filter(Boolean) : [];
    return {
      id: r[0] || `col-${idx + 1}`,
      employeeId: r[1] || `EMP-${idx + 1}`,
      name: r[2] || `Collector ${idx + 1}`,
      role: (['Lead Field Specialist', 'Senior Surveyor', 'Field Enumerator', 'GIS Technician', 'Environmental Tech'].includes(r[3]) ? r[3] : 'Field Enumerator') as any,
      phone: r[4] || '',
      email: r[5] || '',
      status: (['Active', 'On Leave', 'Standby'].includes(r[6]) ? r[6] : 'Active') as any,
      certifications: certs,
      vehicleAssigned: r[8] || undefined,
      dailyCapacity: Number(r[9]) || 100,
    };
  });
}

export function rowsToAssignments(rows: any[][]): DailyAssignment[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((r, idx) => {
    const eqIds = r[12] ? String(r[12]).split(',').map(s => s.trim()).filter(Boolean) : [];
    return {
      id: r[0] || `asg-${idx + 1}`,
      date: r[1] || new Date().toISOString().split('T')[0],
      shift: (['Morning (07:00 - 15:00)', 'Afternoon (14:00 - 22:00)', 'Night (21:00 - 05:00)', 'Full Day (08:00 - 17:00)'].includes(r[2]) ? r[2] : 'Morning (07:00 - 15:00)') as any,
      siteId: r[3] || '',
      collectorId: r[5] || '',
      status: (['Scheduled', 'Dispatched', 'On-Site', 'Completed', 'Cancelled'].includes(r[7]) ? r[7] : 'Scheduled') as any,
      targetUnits: Number(r[8]) || 0,
      unitsCollected: Number(r[9]) || 0,
      checkInTime: r[10] || undefined,
      checkOutTime: r[11] || undefined,
      assignedEquipmentIds: eqIds,
      notes: r[13] || '',
    };
  });
}

export function rowsToEquipment(rows: any[][]): Equipment[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((r, idx) => {
    return {
      id: r[0] || `eq-${idx + 1}`,
      assetTag: r[1] || `AST-${idx + 1}`,
      name: r[2] || 'Equipment Item',
      category: (['Sensor Unit', 'Mobile Terminal', 'GPS Surveyor', 'Power & Battery', 'Safety Gear', 'Tool Kit'].includes(r[3]) ? r[3] : 'Sensor Unit') as any,
      serialNumber: r[4] || '',
      status: (['Available', 'Deployed', 'Maintenance', 'Decommissioned'].includes(r[5]) ? r[5] : 'Available') as any,
      condition: (['Excellent', 'Good', 'Fair', 'Needs Repair'].includes(r[6]) ? r[6] : 'Good') as any,
      storageLocation: r[7] || 'Central Depot',
      assignedSiteId: r[8] || undefined,
      assignedCollectorId: r[9] || undefined,
      lastCalibrationDate: r[10] || undefined,
      nextCalibrationDate: r[11] || undefined,
      notes: r[12] || '',
    };
  });
}

export function rowsToTransfers(rows: any[][]): TransferLog[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((r, idx) => {
    return {
      id: r[0] || `tr-${idx + 1}`,
      equipmentId: r[1] || '',
      equipmentTag: r[2] || '',
      equipmentName: r[3] || '',
      fromLocation: r[4] || '',
      toLocation: r[5] || '',
      transferredBy: r[6] || 'System',
      timestamp: r[7] || new Date().toLocaleString(),
      condition: (['Excellent', 'Good', 'Fair', 'Needs Repair'].includes(r[8]) ? r[8] : 'Good') as any,
      notes: r[9] || '',
    };
  });
}

export function rowsToUsers(rows: any[][]): UserAccount[] {
  if (!rows || rows.length <= 1) return [];
  return rows.slice(1).map((r, idx) => {
    return {
      id: r[0] || `usr-${idx + 1}`,
      loginId: r[1] || `user${idx + 1}`,
      password: r[2] || 'password123',
      name: r[3] || `User ${idx + 1}`,
      email: r[4] || '',
      role: (['Admin', 'Operations Manager', 'Site Dispatcher', 'Equipment Officer', 'Field Collector'].includes(r[5])
        ? r[5]
        : 'Field Collector') as any,
      status: (r[6] === 'Suspended' ? 'Suspended' : 'Active') as any,
      assignedSiteId: r[7] || undefined,
      collectorId: r[8] || undefined,
      createdAt: r[9] || new Date().toISOString().split('T')[0],
      notes: r[10] || '',
    };
  });
}

// Google Sheets API Calls
export async function createMasterSpreadsheet(
  accessToken: string,
  title: string = 'Site & Inventory Operations Database'
): Promise<SheetDatabaseConfig> {
  const body = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: SHEET_NAMES.SITES } },
      { properties: { title: SHEET_NAMES.COLLECTORS } },
      { properties: { title: SHEET_NAMES.ASSIGNMENTS } },
      { properties: { title: SHEET_NAMES.EQUIPMENT } },
      { properties: { title: SHEET_NAMES.TRANSFERS } },
      { properties: { title: SHEET_NAMES.USERS } },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create Google Sheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetTitle: title,
    spreadsheetUrl,
    lastSyncedAt: new Date().toISOString(),
    autoSyncEnabled: true,
  };
}

export async function verifySpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetNames: string[] }> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to access spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const title = data.properties?.title || 'Google Sheet Database';
  const sheetNames = (data.sheets || []).map((s: any) => s.properties?.title as string);

  return { title, sheetNames };
}

export async function ensureSheetTabsExist(
  accessToken: string,
  spreadsheetId: string,
  existingTabs: string[]
): Promise<void> {
  const requiredTabs = Object.values(SHEET_NAMES);
  const missingTabs = requiredTabs.filter(t => !existingTabs.includes(t));

  if (missingTabs.length === 0) return;

  const requests = missingTabs.map(tabName => ({
    addSheet: {
      properties: {
        title: tabName,
      },
    },
  }));

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.warn('Could not add missing tabs automatically:', err);
  }
}

export async function writeAllDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: {
    sites: Site[];
    collectors: DataCollector[];
    assignments: DailyAssignment[];
    equipment: Equipment[];
    transfers: TransferLog[];
    users?: UserAccount[];
  }
): Promise<void> {
  // Prepare clear requests to wipe old rows and write fresh ones cleanly
  const rangesToClear = [
    `${SHEET_NAMES.SITES}!A:P`,
    `${SHEET_NAMES.COLLECTORS}!A:J`,
    `${SHEET_NAMES.ASSIGNMENTS}!A:N`,
    `${SHEET_NAMES.EQUIPMENT}!A:M`,
    `${SHEET_NAMES.TRANSFERS}!A:J`,
    `${SHEET_NAMES.USERS}!A:K`,
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges: rangesToClear }),
  }).catch(e => console.warn('Non-blocking clear error:', e));

  const batchData: any[] = [
    {
      range: `${SHEET_NAMES.SITES}!A1`,
      values: [HEADERS.SITES, ...sitesToRows(data.sites)],
    },
    {
      range: `${SHEET_NAMES.COLLECTORS}!A1`,
      values: [HEADERS.COLLECTORS, ...collectorsToRows(data.collectors)],
    },
    {
      range: `${SHEET_NAMES.ASSIGNMENTS}!A1`,
      values: [HEADERS.ASSIGNMENTS, ...assignmentsToRows(data.assignments, data.sites, data.collectors)],
    },
    {
      range: `${SHEET_NAMES.EQUIPMENT}!A1`,
      values: [HEADERS.EQUIPMENT, ...equipmentToRows(data.equipment)],
    },
    {
      range: `${SHEET_NAMES.TRANSFERS}!A1`,
      values: [HEADERS.TRANSFERS, ...transfersToRows(data.transfers)],
    },
  ];

  if (data.users && data.users.length > 0) {
    batchData.push({
      range: `${SHEET_NAMES.USERS}!A1`,
      values: [HEADERS.USERS, ...usersToRows(data.users)],
    });
  }

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to update spreadsheet values: ${res.statusText}`);
  }
}

export async function readAllDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  sites: Site[];
  collectors: DataCollector[];
  assignments: DailyAssignment[];
  equipment: Equipment[];
  transfers: TransferLog[];
  users: UserAccount[];
}> {
  const ranges = [
    `${SHEET_NAMES.SITES}!A:P`,
    `${SHEET_NAMES.COLLECTORS}!A:J`,
    `${SHEET_NAMES.ASSIGNMENTS}!A:N`,
    `${SHEET_NAMES.EQUIPMENT}!A:M`,
    `${SHEET_NAMES.TRANSFERS}!A:J`,
    `${SHEET_NAMES.USERS}!A:K`,
  ];

  const queryString = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryString}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to read spreadsheet values: ${res.statusText}`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  const sitesRows = valueRanges[0]?.values || [];
  const collectorsRows = valueRanges[1]?.values || [];
  const assignmentsRows = valueRanges[2]?.values || [];
  const equipmentRows = valueRanges[3]?.values || [];
  const transfersRows = valueRanges[4]?.values || [];
  const usersRows = valueRanges[5]?.values || [];

  return {
    sites: rowsToSites(sitesRows),
    collectors: rowsToCollectors(collectorsRows),
    assignments: rowsToAssignments(assignmentsRows),
    equipment: rowsToEquipment(equipmentRows),
    transfers: rowsToTransfers(transfersRows),
    users: rowsToUsers(usersRows),
  };
}
