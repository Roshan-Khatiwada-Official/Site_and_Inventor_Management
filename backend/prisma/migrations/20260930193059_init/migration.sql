-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'Site Finder', 'Data Collector', 'Field Worker');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Suspended');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('Pending Approval', 'Available');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('Active', 'Completed');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "IssueCondition" AS ENUM ('Flagged', 'Damaged', 'Lost');

-- CreateEnum
CREATE TYPE "IssueOutcome" AS ENUM ('Cleared', 'Damaged', 'Lost');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "lastLogin" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supervisor" TEXT NOT NULL DEFAULT '',
    "supervisorContact" TEXT NOT NULL DEFAULT '',
    "workerCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "foundById" TEXT,
    "foundByName" TEXT NOT NULL DEFAULT '',
    "reservedById" TEXT,
    "reservedByName" TEXT NOT NULL DEFAULT '',
    "status" "SiteStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_holders" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "inventory_holders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_issues" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "condition" "IssueCondition" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "reportedAt" TEXT NOT NULL,
    "reportedByCollectorId" TEXT,
    "reportedByCollectorName" TEXT,

    CONSTRAINT "inventory_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolved_issues" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "condition" "IssueCondition" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "reportedAt" TEXT NOT NULL,
    "reportedByCollectorId" TEXT,
    "reportedByCollectorName" TEXT,
    "outcome" "IssueOutcome" NOT NULL,
    "resolvedAt" TEXT NOT NULL,
    "resolvedByName" TEXT NOT NULL,

    CONSTRAINT "resolved_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_records" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "byName" TEXT NOT NULL,
    "fromCollectorId" TEXT NOT NULL DEFAULT '',
    "fromCollectorName" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "return_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT '',
    "collectorId" TEXT NOT NULL,
    "collectorName" TEXT NOT NULL DEFAULT '',
    "assignedById" TEXT NOT NULL,
    "assignedByName" TEXT NOT NULL DEFAULT '',
    "status" "AssignmentStatus" NOT NULL DEFAULT 'Active',
    "hoursLogged" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_sessions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "actualHours" DOUBLE PRECISION,
    "verifiedByName" TEXT,
    "verifiedAt" TEXT,
    "note" TEXT,
    "cameraId" TEXT,
    "cameraName" TEXT,
    "cameraItemId" TEXT,
    "task" TEXT,

    CONSTRAINT "collection_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_requests" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT '',
    "collectorId" TEXT NOT NULL,
    "collectorName" TEXT NOT NULL DEFAULT '',
    "status" "RequestStatus" NOT NULL DEFAULT 'Pending',
    "requestedAt" TEXT NOT NULL,
    "decidedAt" TEXT,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "site_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_loginId_key" ON "users"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_holders_itemId_collectorId_key" ON "inventory_holders"("itemId", "collectorId");

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_foundById_fkey" FOREIGN KEY ("foundById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_holders" ADD CONSTRAINT "inventory_holders_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_holders" ADD CONSTRAINT "inventory_holders_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_issues" ADD CONSTRAINT "inventory_issues_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolved_issues" ADD CONSTRAINT "resolved_issues_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_records" ADD CONSTRAINT "return_records_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_sessions" ADD CONSTRAINT "collection_sessions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_requests" ADD CONSTRAINT "site_requests_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_requests" ADD CONSTRAINT "site_requests_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
