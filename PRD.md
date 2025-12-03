# Product Requirements Document (PRD)

**Project Name:** InsureGuard (System Zarządzania Ubezpieczeniami) **Version:** 1.0 **Date:** December 2, 2025 **Target Stack:** Node.js (Express), SQLite (Prisma ORM), React (Vite + Tailwind + shadcn/ui).

## 1. Executive Summary

A modern web application to manage company assets (vehicles, machinery) and their insurance policies. The goal is to replace a manual Excel file with a proactive system that tracks costs, stores documents, and automates email notifications for renewals. The UI focuses on readability, avoiding dense tables in favor of actionable cards and slide-over details.

## 2. User Roles & Permissions

### 2.1. Admin

- **Access:** Full access to all modules.
- **Capabilities:**
  - Manage Users (Invite, Delete, set Read/Write permissions).
  - CRUD (Create, Read, Update, Delete) on all Assets and Policies.
  - Configure global Notification Settings.
  - Import data from CSV/XLSX with duplicate handling.
  - Manage Master Data (e.g., notification recipients).

### 2.2. User

- **Access:** Defined by Admin.
- **Capabilities:**
  - **Read-only:** Can view Dashboard and Asset List, search, and download files.
  - **Read/Write:** Can add/edit assets and upload files (if granted by Admin).
  - *Restriction:* Cannot manage other users or global settings.

## 3. Functional Requirements

### 3.1. Authentication

- **Method:** Email & Password.
- **Features:**
  - Login page.
  - "Forgot Password" flow (SMTP based email reset).
  - JWT based session management.

### 3.2. Dashboard (Home View)

- **KPI Cards:**
  - Total Active Policies.
  - **Expiring Soon:** Count of policies expiring in < 30 days (Red highlight).
  - Monthly Cost Projection: Total annualized cost / 12.
- **Visuals:** Bar chart showing cost distribution per month (Cashflow view).
- **Action List:** List of items requiring immediate attention (Expired or Missing Docs).

### 3.3. Asset & Policy Management (The Core)

- **List View (Modern UI):**
  - **NO dense tables.** Use a "Card Row" layout.
  - **Columns/Data shown:** Icon (Car/Machine), Name (Bold), Reg/Serial Number, Status Badge (Active/Expiring/Ended), Visual Progress Bar (Time elapsed), "Valid Until" date.
  - **Search:** Global "Smart Search" input (filters by name, reg number, insurer, person).
- **Detail View (Slide-over Panel):**
  - Clicking a row opens a right-side drawer (slide-over).
  - **Tabs:**
    - *Overview:* Key dates, Costs, Insurer, Responsible Person.
    - *Files:* Drag & drop area for PDF uploads.
    - *History:* Timeline of previous renewals for this specific asset.
- **Renewal Workflow (History Preservation):**
  - "Renew Policy" button.
  - Action: Archives the current policy to history, creates a new active policy entry linked to the same Asset, prompts user for new dates/costs.

### 3.4. Notifications Engine

- **Recipients:** Defined per asset. Defaults to a "Global List" if not overridden.
- **Logic:**
  - **Global Settings:** Admin sets default "Days Before" (e.g., 30 days).
  - **Per-Item Override:** Admin can set specific lead time for complex machines.
  - **Stages:**
    1. **First Alert:** X days before expiry.
    2. **Follow-up:** Y days (e.g., 10) before expiry IF status is not "In Progress".
    3. **Deadline:** On the expiry date (Call to action: "Update or Archive").
- **Content:** Email includes Asset Name, Expiry Date, and a direct link to the Asset in the app.

### 3.5. Data Import (Excel/CSV)

- **Wizard Steps:**
  1. Upload File.
  2. Map Columns (Header matching).
  3. **Deduplication:** Check against `Registration Number` (Vehicles) or `Serial Number` (Machines).
     - If match found: Prompt to Skip or Update.

## 4. Data Model (Schema Concepts)

### `User`

- `id`, `email`, `password_hash`, `role` (ADMIN, USER), `can_edit` (Boolean).

### `Asset` (The physical item)

- `id`
- `name` (e.g., "KIA Sorento")
- `type` (VEHICLE, MACHINE, OTHER)
- `identifier` (Reg No or Serial No - Unique)
- `responsible_person` (String - from "Ubezpieczony" or "Kto jeździ")
- `notes`

### `Policy` (The insurance contract)

- `id`
- `asset_id` (FK)
- `insurer` (e.g., PZU, Uniqa)
- `policy_number`
- `start_date`
- `end_date`
- `premium_amount` (Decimal)
- `payment_frequency` (YEARLY, MONTHLY, QUARTERLY - Default: YEARLY)
- `status` (ACTIVE, EXPIRED, RENEWAL_IN_PROGRESS, ARCHIVED)
- `notification_override_days` (Int, nullable)
- `files` (JSON array of file paths)

## 5. UI/UX Guidelines

- **Esthetics:** Professional, SaaS-like (Linear/Vercel style).
- **Palette:** Neutral grays/slates, White background, subtle borders. Primary action color: Indigo or Blue.
- **Feedback:** Toast notifications for all successful actions ("Policy Updated", "Import Complete").
- **Responsiveness:** Desktop-first (due to data density), but readable on mobile.

## 6. Implementation Plan (Vibe Coding Steps)

1. **Setup:** Initialize React (Vite) + Express + SQLite + Tailwind.
2. **DB:** Define Prisma schema and run migrations.
3. **Backend:** Create API endpoints (Auth, Assets CRUD, Uploads).
4. **Frontend Core:** Build Layout (Sidebar/Nav) and Dashboard UI.
5. **Frontend List:** Implement the "Card Row" list and Slide-over details.
6. **Import Logic:** Build the CSV parsing and mapping UI.
7. **Scheduler:** Implement the Node.js cron job for checking dates and sending emails.