// ---------------------------------------------------------------------------
// Site & Inventory Manager — lean data model
//
// Roles:
//   - Admin         : manages inventory, assigns collectors to sites, approves
//                     requests, sees all reports.
//   - Site Finder   : adds field sites (only sees sites they found).
//   - Data Collector: browses available sites, requests them, logs collection
//                     hours (only sees their own work).
//   - Field Worker  : can do both — find sites AND collect data.
// ---------------------------------------------------------------------------

export type UserRole = 'Admin' | 'Site Finder' | 'Data Collector' | 'Field Worker';

/** Roles allowed to add sites. */
export const CAN_FIND_SITES: UserRole[] = ['Site Finder', 'Field Worker'];
/** Roles allowed to collect data / request sites. */
export const CAN_COLLECT: UserRole[] = ['Data Collector', 'Field Worker'];

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
  updatedAt: string;
  lastLogin?: string;
}

export type SiteStatus = 'Available' | 'Assigned';

export const SITE_CATEGORIES = [
  'Butchery',
  "Electronical Equipments repairmen's",
  'Barber shop',
  'Welding (CNC cutting, full object making process)',
  'Construction marble layout / plumbing etc',
] as const;

export interface Site {
  id: string;
  code: string;               // auto-generated
  name: string;
  category: string;           // one of SITE_CATEGORIES (or '')
  latitude: number;
  longitude: number;
  supervisor: string;
  supervisorContact: string;
  workerCount: number;
  note: string;
  foundById: string;          // user id who added it
  foundByName: string;        // denormalised for reporting
  reservedById: string;       // if set, only this user may collect here ('' = open pool)
  reservedByName: string;
  status: SiteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnRecord {
  date: string;
  ok: boolean;                // everything in good condition?
  note: string;               // problem description if not ok
  byName: string;             // admin who processed the return
  fromCollectorName: string;  // collector the item came back from
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
  heldById: string;           // Data Collector currently holding it ('' = in stock)
  heldByName: string;         // denormalised
  returnLog: ReturnRecord[];  // check-in history
  createdAt: string;
  updatedAt: string;
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
  assignedById: string;       // Admin user id
  assignedByName: string;
  status: AssignmentStatus;
  hoursLogged: number;        // sum of session hours
  sessions: CollectionSession[];
  createdAt: string;
  updatedAt: string;
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
  updatedAt: string;
}
