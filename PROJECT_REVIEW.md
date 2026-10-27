# PEAS project review

Reviewed and updated on 24 October 2026.

## Project structure

PEAS is a Vue 3 application backed by Express, Sequelize, and PostgreSQL.
Pinia manages authentication and chat state; Vue Router protects authenticated
and administrator pages. Socket.IO delivers chat events. Vue I18n provides five
languages, and Vite PWA packages the installable application.

- `server.js`: API registration, static frontend hosting, sockets, database startup.
- `routes/`, `controllers/`, `models/`: feature APIs and persistence.
- `client/src/views/`: health, money, estates, chat, library, profile, and tools.
- `client/src/components/`: shared navigation, authentication shell, and icons.
- `client/src/stores/`: persisted sessions and real-time chat.
- `utils/helpers.js`: health evaluation and formatting rules.

## Changes

- Rebuilt the public and authenticated home page with an orbital illustration,
  responsive module cards, mint accents, and keyboard-accessible links.
- Applied shared graphite surfaces, readable muted text, focus outlines, disabled
  button behavior, horizontally scrollable tables, and reduced-motion support.
- Added a branded shell for login, registration, and verification; translated
  new copy in all five supported languages and replaced the Vite favicon.
- Added chat to the home hub and preserved the requested module through login
  and 2FA verification. Route checks reject external and guest redirects.
- Split page imports so the initial main JavaScript bundle is approximately
  174 KB instead of 562 KB before compression.
- Kept ordinary permission failures, incorrect passwords, and invalid 2FA codes
  from unnecessarily clearing the session. Expired/invalid access tokens still
  trigger logout.
- Made persisted authentication JSON resilient to corruption and cleared
  temporary 2FA state on cross-tab logout.
- Removed duplicate optimistic chat messages, ignored duplicate delivery events,
  restored room subscriptions after reconnect, preserved unsent disconnected
  input, and ignored delayed responses for a previously selected room.
- Applied positive finite amount validation to expense and saving edits.
- Fixed zero-stock library creation, overdue returns and deletion checks, and
  quantity edits that would reduce stock below the number of outstanding loans.
- Changed authenticated API PWA requests to NetworkOnly to prevent cached
  responses from being served across sessions. Static assets remain cached.

## Verification

- Backend: **175 tests pass**, including new tests using the actual routes,
  controllers, middleware, models, and transactions with in-memory SQLite.
- Frontend: **86 tests pass**, including regression coverage for chat delivery,
  session persistence, error handling, and login redirects.
- Production build and service worker generation pass.
- Configured PostgreSQL connection succeeds.
- Running `/api/health`, `/api/health/ready`, and `/api/health/live` return 200.
- Running library, money, and chat APIs reject unauthenticated requests with 401.
- Both the backend-served production frontend and Vite frontend return 200.
- Browser review confirms the mobile landing page, module navigation to login,
  sign-in layout, and English/Indonesian language switching.

## Remaining verification limits

External email and WhatsApp delivery, real-user authenticated browser sessions,
all game playthroughs, and visual PDF output were not tested end to end.
The integration suite uses SQLite; it does not substitute for PostgreSQL
concurrency/load testing. Existing health classification rules were preserved.

The legacy `test_all_features.js` script deletes library records in its configured
database. It was not run; the new integration tests use a disposable database.

## Running locally

Start the backend with `npm start` and the frontend with `npm run dev:fe`.
The backend uses the existing `.env` configuration. Vite proxies API and socket
requests to port 3000. Use `npm test -- --runInBand` for backend checks,
`npm test --prefix client` for frontend checks, and `npm run build:fe` to rebuild
the production frontend served by Express.

## PEAS AI assistant

The application is now branded PEAS (Personal Everyday Assistant System) across
the home page, navigation, authentication, PWA manifest, favicon, and email subjects.
The new authenticated `/assistant` page provides streamed text chat, Stop and New
chat controls, and session-only conversation context. API requests use server-side
credentials and never automatically include app records. See `AI_SETUP.md`.

AI tests use mocked provider responses, including network chunk boundaries,
cancellation, incomplete replies, configuration errors, and session expiry. No
live paid provider request was made because an API key is not configured locally.
