# Repository Guidelines

## Project Structure & Modules
- `client/`: React + TypeScript via Vite and Tailwind CSS v4. Entry `src/main.tsx`, routing in `src/App.tsx`, shared UI in `src/components`, contexts in `src/context`, types in `src/types.ts`. Build output: `client/dist/`.
- `server/`: Express + TypeScript API with Prisma (SQLite default at `prisma/dev.db`). Source in `src/` (`controllers/`, `middleware/`, `routes/`, `lib/`), compiled JS in `dist/`, schema/migrations in `prisma/`.
- Temporary logs (`*.log`, `*.out`, `*.err`) are local artifacts; do not commit.

## Setup, Build & Run
- Prereqs: Node.js ≥ 18 and npm.
- Install dependencies separately: `npm install` inside `client/` and `server/`.
- Server: `npx prisma migrate dev --name <tag>` to sync DB; `npm run dev` for hot-reload (defaults to `PORT=3000`); `npm run build` then `npm start` for production.
- Client: `npm run dev` (Vite dev server, ~http://localhost:5173); `npm run lint`; `npm run build` and `npm run preview` to verify the bundle. Run client and API in separate terminals; the UI expects the API at `http://localhost:3000`.

## Coding Style & Naming
- TypeScript-first; functional React components and hooks. Two-space indent, semicolons, single quotes to match existing files.
- Names: components/contexts `PascalCase` files (e.g., `Layout.tsx`, `ThemeContext.tsx`); variables and functions `camelCase`. Keep DTO/type defs in `src/types.ts` and server models in Prisma schema.
- Client linting uses ESLint flat config; run before pushing. Server currently relies on `tsc` for type safety—keep controllers lean and prefer helpers in `lib/`.

## Testing Expectations
- No automated suite is wired yet. At minimum, run `npm run lint` (client) and `npm run build` (server) before raising a PR.
- If you add tests, place them next to the code or under `__tests__/`. Suggested stacks: Vitest + React Testing Library for UI; supertest against the compiled API for endpoints.

## Commit & PR Practices
- Use concise, imperative subjects; Conventional Commit prefixes with scopes are encouraged (e.g., `feat(client): add asset grid`, `fix(server): handle missing policy`).
- PRs should include: summary of changes, manual test steps, screenshots for UI updates, and a note about any Prisma migration. Update docs (`README.md`, `PRD.md`, `AGENTS.md`) when behavior shifts.

## Security & Configuration
- Keep secrets out of VCS. Store env vars in `server/.env` (e.g., `PORT`, `DATABASE_URL` if overriding SQLite path). Do not commit `prisma/dev.db`.
- Helmet and CORS are already enabled; ensure new routes return JSON errors consistently and avoid leaking stack traces in responses.
