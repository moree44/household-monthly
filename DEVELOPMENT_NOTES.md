# Development Notes

Last updated: 2026-06-13, Asia/Jakarta

## Project Summary

Household Monthly adalah private household expense tracker untuk suami dan istri.

Tujuan utama:

- Catat pengeluaran harian dengan cepat.
- Lihat ringkasan bulanan.
- Kelola saldo wallet rumah tangga.
- Kelola kategori, wallet, user, dan goals.
- Deploy pribadi ke Vercel dan Neon PostgreSQL.

## Current Tech

- Next.js 16
- TypeScript
- TailwindCSS v4
- Prisma
- PostgreSQL
- Custom username/password auth
- Lucide React
- Plus Jakarta Sans
- PWA metadata for iOS Safari Add to Home Screen

Dev script menggunakan webpack:

```bash
npm run dev
```

`package.json` saat ini memakai `next dev --webpack` karena sebelumnya Turbopack sempat memunculkan issue dev/hydration.

## Local Commands

Start PostgreSQL di WSL:

```bash
sudo service postgresql start
```

Run app:

```bash
npm run dev
```

Migration dan seed:

```bash
npm run prisma:migrate
npm run db:seed
```

Cloud migration deploy:

```bash
npm run prisma:migrate:deploy
```

Verification:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Prisma Studio:

```bash
npx prisma studio
```

Jalankan dari folder project, bukan dari `/home/moree`.

## Local Seed Users

- `suami` / `password123`
- `istri` / `password123`

Untuk environment baru, seed password bisa diganti via env sebelum `npm run db:seed`:

```bash
SEED_SUAMI_PASSWORD="new-password"
SEED_ISTRI_PASSWORD="new-password"
```

Untuk user yang sudah ada, ubah password lewat Profil -> Kelola Pengguna.

## Laptop Setup Handoff - 2026-06-12

Sesi laptop WSL berhasil dibuat sebagai environment kerja kedua.

Yang sudah dilakukan di laptop:

- Install dan pakai Node.js 22 via `nvm`.
- Install PostgreSQL 16 lokal di WSL.
- Buat database lokal `household_monthly`.
- Set password user PostgreSQL `postgres` menjadi `postgres`.
- Copy `.env.example` ke `.env`.
- Install dependency dengan `npm install`.
- Jalankan Prisma migration:
  - `20260605142214_init`
  - `20260605153000_rename_dana_isi_rumah_to_tabungan_rumah`
  - `20260609000000_add_goals`
- Generate Prisma Client.
- Jalankan seed data.
- App berhasil jalan lokal dengan seed user:
  - `suami` / `password123`
  - `istri` / `password123`
- Test PWA iPhone lewat Cloudflare Tunnel quick URL.

Catatan laptop:

- Setelah WSL/Cursor restart, shell bisa kembali memakai Node 18. Jalankan:

```bash
nvm use 22
```

- PostgreSQL juga bisa mati setelah WSL restart. Jalankan:

```bash
sudo service postgresql start
```

- Untuk test iPhone lokal yang paling stabil, gunakan production mode + Cloudflare Tunnel:

```bash
npm run build
npm run start -- --hostname 0.0.0.0
cloudflared tunnel --url http://localhost:3000
```

- Jangan commit file lokal seperti `.env`, `.next`, `node_modules`, atau installer `.deb`.

## Completed Features

- Login username/password.
- Protected dashboard.
- Dashboard bulanan.
- Month selector di Dashboard dan History.
- Wallet cards:
  - Kas Rumah Tangga
  - Dompet Istri
  - Tabungan Rumah
  - Dana Darurat
- Expense create/edit.
- Transfer create/edit.
- Top Up create/edit.
- Nominal input memakai format titik ribuan.
- Transaction history.
- Soft delete transaction.
- Restore deleted transaction.
- History filters:
  - month
  - active/deleted
  - type
  - week within month
- Deleted History tetap dapat difilter berdasarkan tipe transaksi.
- Category management.
- Wallet management.
- User management.
- Goals manual:
  - add
  - edit
  - activate/deactivate
  - auto icon by goal name
- Mobile-first UI polish for:
  - Dashboard
  - Catat
  - History
  - Goals
  - Profile
- PWA setup untuk iOS Safari:
  - manifest
  - generated app icons
  - Add to Home Screen metadata
  - iPhone safe-area top/bottom handling
- Dashboard Recent Transactions memakai icon per tipe transaksi.
- Delete/restore confirmation di History tidak overflow ke kanan pada mobile.
- Vercel deployment dengan Neon PostgreSQL.
- Singapore preferred region for Vercel functions.
- Route loading skeletons for smoother mobile navigation.
- Transaction create/update/delete/restore revalidates Dashboard, History, and Profile views.
- Dashboard data loading optimized with grouped aggregate queries.
- History data loading optimized to select only fields used by the UI.
- Production database indexes for long-term transaction growth.

## Important Product Decisions

### Categories

Use 10 flat categories, no sub-categories:

- Belanja Dapur
- Food & Drink
- Daily Needs
- Bills
- Transport
- Health
- Entertainment
- Social
- Home Care
- Others

Specific detail goes into `description` / catatan.

### Wallet Rules

- Kas Rumah Tangga is the main operational wallet.
- Dompet Istri accumulates leftover balance and does not reset weekly.
- Tabungan Rumah is separate from monthly operational spending.
- Dana Darurat is separate emergency money.

### Top Up

Source account is metadata only. It does not have balance.

### Transfer

Transfer does not count as expense.

### Expense

Only expense affects monthly operational/category spending.

### Goals

Goals are manual targets and are not linked to wallet balances.

Default goals:

- Dana Darurat
- Tabungan Rumah

Auto icon mapping is based on goal title:

- `darurat` -> ShieldCheck
- `rumah`, `renovasi` -> House
- `liburan`, `holiday`, `vacation` -> Plane
- `travel`, `jalan` -> Palmtree
- `mobil`, `motor`, `kendaraan` -> Car
- `laptop`, `komputer`, `pc` -> Laptop
- `sekolah`, `pendidikan`, `kuliah` -> GraduationCap
- fallback -> Target

### History Weekly Filter

Use 4 week slots per month:

- W1 = 1-7
- W2 = 8-14
- W3 = 15-21
- W4 = 22-end of month

This avoids awkward W5 for only 1-3 days.

## UI Direction

Current visual direction:

- Mobile-first app shell.
- Outer background charcoal `#262626`.
- App background `#F5F5F5`.
- Cards use `#FFFFFF` or `#E5E5E5`.
- Active controls use `#171717`.
- Blue accent is used sparingly for FAB/progress/positive values.
- Font: Plus Jakarta Sans.
- Icons: Lucide React, mostly monochrome grayscale.

Bottom navigation:

- home
- history
- catat
- goals
- profil

Main FAB opens Catat / Expense flow.

PWA Home Screen mode should feel close to a mini app on iOS Safari. Bottom navigation uses iPhone safe-area spacing.

## Current User Preferences

- User prefers Indonesian casual discussion.
- UI should feel premium, clean, compact, and not too bright.
- Avoid overly colorful icons.
- Prefer charcoal/gray palette with limited blue accent.
- Use `Save` instead of `Simpan` for primary transaction buttons.
- Keep transaction input fast, especially on phone.
- Category icons can be done later.
- Deployment target is GitHub private + Vercel + Neon PostgreSQL.
- User prefers testing on iPhone Safari / Add to Home Screen before production deploy.

## Known Gotchas

- `.env` must not be pushed to GitHub, even if repo is private.
- PostgreSQL local database is not synced between PC/laptop.
- Shared cloud database is now prepared on Neon for PC/laptop/Vercel production data.
- Codex chat session does not move automatically to laptop. Read this file, README, PRD, and workflow doc in the new session.
- If port 3000 is busy in WSL, check running Next process or WSL relay.
- Browser extension can cause React hydration warning by injecting HTML attributes. Test in incognito if needed.
- Cloudflare Tunnel quick URLs are temporary and public while the tunnel process is running.
- `next-env.d.ts` may flip between `.next/dev/types/routes.d.ts` and `.next/types/routes.d.ts` after dev/build; do not commit this flip unless intentionally needed.
- `.env.local-neon` must not be pushed to GitHub.
- Neon/Vercel free/serverless setup can still have cold start delay after idle, even after query optimization.
- If credentials were pasted/shared during setup, rotate Neon password and `AUTH_SECRET` before serious daily use.

## 2026-06-13 Production Performance Update

Goal: keep the app smooth for long-term daily use, especially quick transaction input on mobile.

Completed:

- Vercel production deploy is live.
- Neon PostgreSQL production database is live in Singapore.
- Vercel functions prefer Singapore region via `preferredRegion = "sin1"`.
- Prisma Client generation runs during Vercel install via `postinstall`.
- Bottom navigation uses route prefetch and loading skeletons for smoother page transitions.
- Removed redundant manual nav prefetcher to avoid duplicate route prefetch work.
- Transaction create/update/delete/restore now calls `revalidatePath` for:
  - `/dashboard`
  - `/history`
  - `/profile`
- Dashboard balance calculation was refactored away from loading all transaction rows.
- Dashboard now uses grouped aggregate queries for:
  - wallet direct transaction balance
  - transfer out balance
  - transfer in balance
- Wife summary queries are included in the main `Promise.all`.
- History query now uses `select` for only the fields needed by the UI.
- Added production database indexes:
  - `deleted_at + transaction_date`
  - `type + deleted_at + transaction_date`
  - `wallet_id + deleted_at`
  - `from_wallet_id + deleted_at`
  - `to_wallet_id + deleted_at`
  - `category_id + deleted_at + transaction_date`
- Migration applied to Neon:
  - `20260613000000_add_transaction_query_indexes`
- Follow-up app performance changes:
  - History month data is fetched once per month.
  - History status/type/week filters now run client-side, so W1/W2/W3/W4 and type chips do not round-trip to Vercel/Neon.
  - History URL is kept in sync with selected filters using `window.history.replaceState`.
  - Delete/restore buttons refresh the current route after a successful action so client-side History remains synced.
  - Transaction create/edit actions were simplified to reduce extra validation lookups before writes.
  - Settings user/wallet/category counts were moved from relation `_count` includes to grouped count queries.

Verification:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All passed.

Production notes:

- After save, there can still be a short delay because the app writes to Neon, revalidates views, and redirects.
- The delay should be more stable now as data grows because dashboard/history queries are lighter.
- History filter chips should feel instant after the latest client-side filtering update.
- If production feels slow after being idle, likely cause is serverless cold start from Vercel/Neon.
- For future Prisma migrations against Neon, use:

```bash
set -a
source .env.local-neon
set +a
npm run prisma:migrate:deploy
```

## 2026-06-13 Lighthouse Snapshot

Production URL tested from Chrome Lighthouse on dashboard:

- Performance: 87
- Accessibility: 95
- Best Practices: 77
- First Contentful Paint: 1.6s
- Largest Contentful Paint: 2.1s

Interpretation:

- Initial dashboard load is acceptable for a private dynamic app.
- Lighthouse measures page load, not the in-app History filter delay or post-save delay.
- Best Practices should be inspected next from Lighthouse details.
- For cleaner audit numbers, run Lighthouse in Incognito with extensions disabled and repeat after the first cold-start run.

## Recommended Next Steps

1. Rotate production secrets before serious daily use:
   - reset Neon database password
   - update `DATABASE_URL` and `DIRECT_URL` in Vercel and local `.env.local-neon`
   - generate new `AUTH_SECRET`
   - redeploy Vercel
2. After pulling laptop changes on PC utama, run:
   - `npm install` if dependency changes exist
   - `npm run prisma:migrate`
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
3. Change default seed passwords before serious use:
   - new environment: set `SEED_SUAMI_PASSWORD` and `SEED_ISTRI_PASSWORD` before seed
   - existing users: update via Profil -> Kelola Pengguna
4. Run production smoke test after each important Vercel deploy:
   - login
   - create Expense
   - create Transfer
   - create Top Up
   - delete/restore
   - test History filters W1/W2/W3/W4 and type chips
   - test iPhone Add to Home Screen from production URL
5. Inspect Lighthouse Best Practices details and fix actionable warnings.
6. Polish remaining PWA smoothness if needed:
   - smaller perceived delay after save
   - smoother cold-start messaging if needed
7. Polish Profile/settings detail if needed.
8. Add category/wallet icons later.

## Cloud Database Status

- 2026-06-13: Neon PostgreSQL project created.
- Provider: Neon.
- Region: AWS Asia Pacific 1, Singapore.
- Database: `neondb`.
- Migrations applied with `npx prisma migrate deploy`.
- Latest performance index migration applied with `npm run prisma:migrate:deploy`.
- Seed completed with custom `SEED_SUAMI_PASSWORD` and `SEED_ISTRI_PASSWORD`.
- Initial cloud data verified:
  - 2 users
  - 4 wallets
  - 4 source accounts
  - 10 categories
  - 2 goals
  - 0 transactions

## Manual Test Status

- 2026-06-13: Full `TESTING_CHECKLIST.md` passed on PC WSL + Cloudflare Tunnel + iPhone/PWA.
- Tested flows include Expense, Transfer, Top Up, edit, delete, restore, History filters, Goals, Profile/settings, and iPhone Add to Home Screen behavior.

## Not Done Yet

- Rotate Neon password and `AUTH_SECRET` because setup secrets were pasted/shared during development.
- Confirm production user passwords are strong enough for daily use.
- Production smoke test after every performance/deploy change.
- Lighthouse Best Practices detail review.
- Extra PWA smoothness polish if production still feels delayed after idle.

## GitHub Handoff Plan

Files that should be committed:

- source code
- `prisma/schema.prisma`
- `prisma/migrations`
- `.env.example`
- `README.md`
- `PRD.md`
- `workflow-catat-kategori.md`
- `DEVELOPMENT_NOTES.md`

Files that should not be committed:

- `.env`
- `node_modules`
- `.next`
- local database dump

On laptop:

```bash
git clone <repo-url>
cd household-monthly
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

If using cloud PostgreSQL, set `DATABASE_URL` and `DIRECT_URL` in `.env` to the cloud database URL.
