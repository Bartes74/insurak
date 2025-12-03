/*
  Warnings:

  - You are about to drop the column `responsible_person` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `can_edit` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `asset_id` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `notification_override_days` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `payment_frequency` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `policy_number` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `premium_amount` on the `Policy` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `Policy` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assetId` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `policyNumber` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `premiumAmount` to the `Policy` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Policy` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "responsiblePerson" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Asset" ("createdAt", "id", "identifier", "name", "notes", "type", "updatedAt") SELECT "createdAt", "id", "identifier", "name", "notes", "type", "updatedAt" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset_identifier_key" ON "Asset"("identifier");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "role", "updatedAt") SELECT "createdAt", "email", "id", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Policy" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "policyNumber" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "premiumAmount" DECIMAL NOT NULL,
    "sumInsured" DECIMAL,
    "paymentFrequency" TEXT NOT NULL DEFAULT 'YEARLY',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "leasingRef" TEXT,
    "insured" TEXT,
    "comments" TEXT,
    "notificationOverrideDays" INTEGER,
    "files" TEXT,
    "assetId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Policy" ("createdAt", "files", "id", "insurer", "status", "updatedAt") SELECT "createdAt", "files", "id", "insurer", "status", "updatedAt" FROM "Policy";
DROP TABLE "Policy";
ALTER TABLE "new_Policy" RENAME TO "Policy";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
