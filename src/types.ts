// ---------------------------------------------------------------------------
// Site & Inventory Manager — lean data model
//
// Three roles:
//   - Admin         : manages inventory, assigns data collectors to sites,
//                     approves site requests, sees all reports.
//   - Site Finder    : adds available field sites (only sees sites they found).
//   - Data Collector : browses available sites, requests them, logs collection
//                     hours on their assignments (only sees their own work).
// ---------------------------------------------------------------------------

export type UserRole = 'Admin' | 'Site Finder' | 'Data Collector';

export interface UserAccount {
  id: string;
  loginId: string;
  password: string;
  name: string;
  role: UserRole;
  status: 'Active' | 'Suspended';
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  lastLogin?: string;
}

export type SiteStatus = 'Available' | 'Assigned';

export interface Site {
  id: string;
  code: string;               // auto-generated
  name: string;
  latitude: number;
  longitude: number;
  supervisor: string;
  supervisorContact: string;
  workerCount: number;
  note: string;
  foundById: string;          // Site Finder user id
  foundByName: string;        // denormalised for reporting
  status: SiteStatus;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;             // human-readable code (required)
  name: string;               // required
  category: string;           // optional
  quantity: number;           // optional
  note: string;               // optional
  condition: 'OK' | 'Flagged'; // set to Flagged on a problem return
  conditionNote: string;      // what's wrong, if flagged
  createdAt: string;
}

export interface ReturnRecord {
  itemId: string;
  itemName: string;
  date: string;
  ok: boolean;                // everything in good condition?
  note: string;               // problem description if not ok
  byName: string;             // admin who processed the return
}

export interface CollectionSession {
  date: string;               // YYYY-MM-DD
  hours: number;
  note?: string;
}

export type AssignmentStatus = 'Active' | 'Completed';

export interface Assignment {
  id: string;
  siteId: string;
  siteName: string;           // denormalised
  collectorId: string;        // Data Collector user id
  collectorName: string;      // denormalised
  inventoryItemIds: string[]; // one assignment can carry several items
  assignedById: string;       // Admin user id
  assignedByName: string;
  status: AssignmentStatus;
  hoursLogged: number;        // sum of session hours
  sessions: CollectionSession[];
  returnedItems: ReturnRecord[]; // items handed back and checked in
  createdAt: string;
}

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface SiteRequest {
  id: string;
  siteId: string;
  siteName: string;
  collectorId: string;
  collectorName: string;
  status: RequestStatus;
  requestedAt: string;
  decidedAt?: string;
}
