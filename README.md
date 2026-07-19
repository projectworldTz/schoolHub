# SchoolHub Africa

Enterprise multi-tenant School ERP SaaS platform.

## Stack

- **Backend:** Laravel 12, PHP 8.2+ locally (target 8.4 in production — see note below), MySQL/MariaDB (via XAMPP locally)
- **Auth:** Laravel Sanctum (SPA cookie auth)
- **Permissions:** Spatie Laravel Permission (roles + granular permissions)
- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS + shadcn/ui, TanStack Query, React Hook Form + Zod, Recharts
- **Mobile:** Expo (React Native + TypeScript), React Navigation — a Parent-role vertical slice against the public API (see below)
- **Cache/queue/sessions:** database driver locally, Redis in production (see note below)

## Tenancy model

Single shared MySQL database. Every tenant-scoped table carries a `school_id` column, enforced
by an Eloquent global scope (`app/Models/Concerns/BelongsToSchool.php`, driven by
`App\Support\Tenancy\Tenant`) that auto-filters every query by the current request's `school_id`.

This is the **only** isolation mechanism — MySQL has no equivalent to Postgres Row-Level Security,
so unlike an RLS-backed design there is no database-level backstop if a query bypasses Eloquent
(raw `DB::table()` calls, a forgotten scope). Keep all tenant-scoped data access going through
Eloquent models that use the `BelongsToSchool` trait. See the doc comments on `Tenant` and
`BelongsToSchool` for the exact rules (deny-by-default when no tenant is set, explicit
`Tenant::runAsPlatform()` opt-in for legitimate cross-tenant Super Admin operations).

The `schools` table itself is the tenant registry and is not tenant-scoped — it's owned by the
Super Admin (Platform) layer.

## Local environment

### 1. Database

Uses XAMPP's MySQL/MariaDB directly — make sure it's running (XAMPP Control Panel), then create
the database once:

```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS schoolhub_africa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

No Docker required for local dev. Cache, queue, and sessions run on Laravel's `database` driver
locally (see `backend/.env`) rather than Redis, to avoid needing anything beyond XAMPP.

Redis is still the intended **production** driver for cache/queue/sessions (`REDIS_*` settings are
already in `.env`, just unused locally). `docker-compose.yml` is optional — bring it up later if
you want Redis and/or Mailpit (a local mail viewer) matching production more closely; instructions
are in that file's header comment.

### 2. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env   # already pre-filled for mysql + database cache/queue/session
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Seeds a Super Admin at `admin@schoolhub.africa` / `password` (override via `PLATFORM_ADMIN_EMAIL`
/ `PLATFORM_ADMIN_NAME` / `PLATFORM_ADMIN_PASSWORD` before seeding anywhere but local).

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

### 4. Mobile (Expo / React Native)

Authenticates against the versioned public API (`/api/v1/*`, personal-access-token auth) rather
than the SPA's session cookie — see "Public REST API" in `ROADMAP.md` Phase 7 for why that's a
separate auth path from the backend the frontend uses.

```bash
cd mobile
npm install
cp .env.example .env   # EXPO_PUBLIC_API_URL — localhost is correct for web/iOS simulator;
                        # an Android emulator or physical device needs your machine's LAN IP instead
npm run web             # runs in a real browser — the only target verifiable without a simulator/device
# npm run ios / npm run android need a simulator or the Expo Go app on a device
```

Currently a Parent-role vertical slice (login, announcements, per-child attendance/homework/exam
results) proving the public API end-to-end for a mobile client, not full feature parity with the
web dashboard across every role — see `ROADMAP.md` Phase 7 for scope reasoning.

## Project structure

```
schoolhub-africa/
├── backend/            Laravel 12 API (REST, Sanctum SPA auth + token auth for mobile/third-party)
├── frontend/            React 19 + TS SPA (Vite, Tailwind, shadcn/ui)
├── mobile/               Expo (React Native + TS) — Parent-role app against the public API
├── docker-compose.yml    Optional: Redis + Mailpit, not required for local dev
└── ROADMAP.md            Phased module build-out plan
```

## Roles

Super Admin, School Owner, Principal, Vice Principal, Academic Master, Registrar, Admissions Officer,
Accountant, Bursar, HR Officer, Teacher, Class Teacher, Student, Parent, Librarian, Hostel Warden,
Transport Officer, Nurse, Receptionist, Store Keeper, Security Officer — seeded via Spatie Permission
in `database/seeders/RolesAndPermissionsSeeder.php`.

## Note on PHP version

`composer.json` requires PHP `^8.2` (not `^8.4` as in the original spec) so `composer install`
actually runs on this machine's current PHP (XAMPP bundles 8.2.12). Bump it to `^8.4` once PHP 8.4
is installed — `spatie/laravel-permission` can also move from 6.x to 8.x at that point (8.x requires
PHP 8.3+).

See [ROADMAP.md](./ROADMAP.md) for module build order.
