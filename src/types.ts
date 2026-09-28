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

// A site stays 'Available' once approved, no matter how many collectors are
// working there at once — multiple people may collect at the same site
// concurrently, and one collector may hold several sites at once.
export type SiteStatus = 'Pending Approval' | 'Available';

export const SITE_CATEGORIES = [
  'Retail and Consumer Goods',
  'Fashion',
  'Repair Services',
  'Food and Beverage',
  'Construction and Hardware',
  'Food Processing',
  'Printing and Design',
  'Factory',
  'Hospitality',
  'Automotive and Transport',
  'Sports and Recreation',
  'Creative Workshops',
  'Administrative',
  'Education and Training',
  'Industrial Manufacturing',
  'Energy and Utilities',
  'Healthcare and Pharmacy',
  'Administrative & Office Services',
  'Cleaning and Sanitation',
  'Laboratory / Scientific',
  'Childcare and Caregiving',
  'Public Safety and Emergency Response',
  'Agriculture and Farming',
  'Beauty and Personal Care',
  'Entertainment and Events',
  'Other',
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
  reservedById: string;       // the finder who ticked "I'll collect this myself" ('' = nobody self-claimed it).
                               // Informational only — does NOT block anyone else from requesting/being assigned here too.
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
  fromCollectorId: string;    // collector the item came back from
  fromCollectorName: string;  // denormalised
  quantity: number;           // how many units were checked in this time
}

// A field worker holding some (not necessarily all) of an item's stock.
// Several holders can share the same item's quantity at once, e.g. 30
// cables in stock can be split 10 / 8 / 12 across three different people
// while some stay unassigned.
export interface InventoryHolder {
  collectorId: string;
  collectorName: string;      // denormalised
  quantity: number;           // units this collector currently holds
}

export interface InventoryItem {
  id: string;
  itemId: string;             // human-readable code (required)
  name: string;               // required
  category: string;           // optional
  quantity: number;           // total stock of this item, across in-stock + assigned
  note: string;               // optional
  // Flagged = a check-in reported a problem, pending review. Damaged/Lost are
  // the reviewed outcome — set either from a Flagged item or directly at any time.
  condition: 'OK' | 'Flagged' | 'Damaged' | 'Lost';
  conditionNote: string;      // what's wrong, if not OK
  holders: InventoryHolder[]; // who currently holds how much of this item ([] = fully in stock)
  returnLog: ReturnRecord[];  // check-in history
  createdAt: string;
  updatedAt: string;
}

export interface CollectionSession {
  id: string;                  // stable id, so admin verification can address one entry
  date: string;               // YYYY-MM-DD — set once by the collector; approving/verifying later never changes it
  hours: number;               // entered hours, as the data collector claimed them
  actualHours?: number;        // verified hours, filled in by admin during approval (undefined = not yet reviewed)
  verifiedByName?: string;
  verifiedAt?: string;
  note?: string;               // legacy free-form note
  cameraId?: string;           // inventory item id of the camera used
  cameraName?: string;         // denormalised
  cameraItemId?: string;       // denormalised human-readable camera code (cameras often share the same name)
  task?: string;                // task performed with that camera on that date
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
