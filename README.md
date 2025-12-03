# InsureGuard

System Zarządzania Ubezpieczeniami (Insurance Management System).

## Prerequisites

- Node.js (v18 or higher)
- npm

## Getting Started

### 1. Setup Server

The server uses SQLite by default.

```bash
cd server
npm install
npx prisma migrate dev --name init
npm run build
npm start
```

The API will be available at `http://localhost:3000`.

### 2. Setup Client

```bash
cd client
npm install
npm run dev
```

The application will be available at `http://localhost:5173` (or similar, check console output).

## Features Implemented

- **Dashboard:** Overview of active policies, expiring items, and monthly costs.
- **Asset Management:** List view with "Card Rows", search, and status indicators.
- **Asset Details:** Slide-over panel with details, file upload placeholder, and history.
- **Authentication (Backend):** Login endpoint and JWT middleware (Frontend integration pending).

## Project Structure

- `/client`: React + Vite + Tailwind CSS application.
- `/server`: Node.js + Express + Prisma API.
