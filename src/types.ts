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
  foundById: string;          // Site Finder user id
  foundByName: string;        // denormalised for reporting
  status: SiteStatus;
  createdAt: string;
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
