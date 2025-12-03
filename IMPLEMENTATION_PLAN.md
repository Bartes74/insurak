# Implementation Plan

_Status markers: [ ] pending · [x] done_

## 1. Stabilizacja bazy i migracje
- [x] Dodać brakujące pola/statusy/payment_frequency w Prisma jako osobna migracja.
- [x] Utworzyć struktury pod powiadomienia (global settings, recipients) i historię polis; nowe endpointy za feature flagą.

## 2. Warstwa auth i ról
- [x] Wdrożyć rejestr/login, JWT, middleware ról (ADMIN/USER, canEdit).
- [x] Dodać flow resetu hasła e-mail + konfiguracja `.env` (JWT_SECRET, SMTP).
- [x] Dodać testy happy-path na auth (build verify).

## 3. API assets/policies – zgodność domenowa
- [x] Rozszerzyć CRUD o statusy, payment_frequency, notification_override_days, files.
- [x] Dodać operację „renew policy” (archiwizuje starą, tworzy nową) i zwracanie historii polis.
- [x] Egzekwować role (USER read-only / read-write, ADMIN pełny).

## 4. Upload plików
- [x] Dodać `multer` + endpointy upload/download, walidacja PDF, zapis ścieżek w `files` JSON.
- [x] Test: upload → pobranie metadanych → download (build OK; manual flow ready).

## 5. Dashboard & agregaty
- [x] API: KPI (aktywne, <30 dni), monthly cost, action list, cashflow dane.
- [ ] Front: Dashboard pobiera z API; placeholdery za feature flagą do czasu pełnych danych.

## 6. Powiadomienia (scheduler)
- [x] Cron: lead times global/override, 3 etapy alertów; początkowo log-only.
- [x] SMTP wysyłka z linkiem do assetu, throttling/idempotencja oznacznikiem wysłania.

## 7. Import CSV/XLSX
- [x] Backend: upload → mapowanie kolumn → deduplikacja po identifier (skip/update) z dry-runem.
- [ ] Front: 3‑krokowy wizard; zapis tylko po akceptacji deduplikacji.

## 8. Frontend UX zgodny z PRD
- [x] Auth flow + route guards.
- [x] UI: KPI karty, cashflow chart, toasty, neutralna paleta (dashboard podpięty do API).
- [x] Assets: „Add asset”, „Renew policy”, historia z API, upload w Files, smart search (name/id/insurer/responsible).
- [x] Import wizard (frontend) spięty z backendowym dry-run/commit.
- [x] Admin: zarządzanie użytkownikami, global settings/recipients.

## 9. Bezpieczeństwo i konfiguracja
- [x] `.env.example` z wymaganymi zmiennymi; blokada commitowania sekretów/SQLite.
- [x] Rate-limit dla auth/upload, utrzymać Helmet/CORS.

## 10. Testy i obserwowalność
- [x] supertest: auth bootstrap/login + assets fetch; tsc build passes.
- [ ] Dalsze: unit helperów statusów, testy renew/upload, healthcheck DB.

## 11. Rollout i weryfikacja
- [ ] Każdy etap osobny PR: migracje → auth → policy workflow → files → dashboard → notifications → import → admin UI.
- [ ] Po każdym PR: `npm run lint`, `npm run build` (client), `npm run build` (server) + sanity manual.
