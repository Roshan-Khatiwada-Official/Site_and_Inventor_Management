import { Site, InventoryItem, Assignment, SiteRequest, UserAccount } from './types';

/**
 * First-run seed. Only used if a browser has no local data and the Google
 * Sheet is empty/unreachable. Once connected, the Sheet is the source of truth.
 */

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    loginId: 'sagar',
    password: 'password123',
    name: 'Sagar',
    role: 'Admin',
    status: 'Active',
    phone: '',
    email: '',
    address: '',
    notes: '',
    createdAt: '2026-09-10',
    updatedAt: '2026-09-10',
  },
];

export const INITIAL_SITES: Site[] = [];
export const INITIAL_INVENTORY: InventoryItem[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_REQUESTS: SiteRequest[] = [];
