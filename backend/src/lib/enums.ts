import { $Enums } from '@prisma/client';
import type { AssignmentStatus, RequestStatus, SiteStatus, UserRole } from '../types.js';

// Prisma's generated enum identifiers can't contain spaces, so values like
// "Site Finder" were declared as `SiteFinder @map("Site Finder")` in the
// schema — the DB column stores the human string, but the Prisma Client
// runtime speaks the identifier form in both directions. These convert
// between that identifier form and the exact literal strings the frontend
// type (frontend/src/types.ts) and the app's UI already use everywhere.

export const ROLE_TO_DB: Record<UserRole, $Enums.UserRole> = {
  Admin: 'Admin',
  'Site Finder': 'SiteFinder',
  'Data Collector': 'DataCollector',
  'Field Worker': 'FieldWorker',
};
export const ROLE_FROM_DB: Record<$Enums.UserRole, UserRole> = {
  Admin: 'Admin',
  SiteFinder: 'Site Finder',
  DataCollector: 'Data Collector',
  FieldWorker: 'Field Worker',
};

export const SITE_STATUS_TO_DB: Record<SiteStatus, $Enums.SiteStatus> = {
  'Pending Approval': 'PendingApproval',
  Available: 'Available',
};
export const SITE_STATUS_FROM_DB: Record<$Enums.SiteStatus, SiteStatus> = {
  PendingApproval: 'Pending Approval',
  Available: 'Available',
};

// These two have no spaces, so the identifier and the literal already match
// 1:1 — kept here anyway so every enum has one obvious place to look.
export const ASSIGNMENT_STATUS_TO_DB: Record<AssignmentStatus, $Enums.AssignmentStatus> = {
  Active: 'Active',
  Completed: 'Completed',
};
export const ASSIGNMENT_STATUS_FROM_DB: Record<$Enums.AssignmentStatus, AssignmentStatus> = {
  Active: 'Active',
  Completed: 'Completed',
};

export const REQUEST_STATUS_TO_DB: Record<RequestStatus, $Enums.RequestStatus> = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
};
export const REQUEST_STATUS_FROM_DB: Record<$Enums.RequestStatus, RequestStatus> = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
};
