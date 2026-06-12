# Development Notes

Last updated: 2026-06-12, Asia/Jakarta

## Project Summary

Household Monthly adalah private household expense tracker untuk suami dan istri.

Tujuan utama:

- Catat pengeluaran harian dengan cepat.
- Lihat ringkasan bulanan.
- Kelola saldo wallet rumah tangga.
- Kelola kategori, wallet, user, dan goals.
- Deploy pribadi ke Vercel setelah MVP stabil.

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

Ganti password sebelum pemakaian serius/deploy.

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
- Deployment target is likely GitHub private + Vercel + cloud PostgreSQL.
- User prefers testing on iPhone Safari / Add to Home Screen before production deploy.

## Known Gotchas

- `.env` must not be pushed to GitHub, even if repo is private.
- PostgreSQL local database is not synced between PC/laptop.
- To share the same data across devices, use cloud PostgreSQL such as Neon or Supabase.
- Codex chat session does not move automatically to laptop. Read this file, README, PRD, and workflow doc in the new session.
- If port 3000 is busy in WSL, check running Next process or WSL relay.
- Browser extension can cause React hydration warning by injecting HTML attributes. Test in incognito if needed.
- Cloudflare Tunnel quick URLs are temporary and public while the tunnel process is running.
- `next-env.d.ts` may flip between `.next/dev/types/routes.d.ts` and `.next/types/routes.d.ts` after dev/build; do not commit this flip unless intentionally needed.

## Recommended Next Steps

1. After pulling laptop changes on PC utama, run:
   - `npm install` if dependency changes exist
   - `npm run prisma:migrate`
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
2. Manual transaction checklist on iPhone/PWA:
   - Expense create/edit/delete/restore
   - Transfer create/edit/delete/restore
   - Top Up create/edit/delete/restore
   - Dashboard and wallet balance after each action
3. Change default seed passwords before serious use.
4. Decide database strategy:
   - local PostgreSQL per device, or
   - cloud PostgreSQL shared by PC/laptop/Vercel.
5. Prepare cloud PostgreSQL and Vercel deployment.
6. Polish PWA smoothness if needed:
   - route loading skeletons
   - stronger bottom-nav pressed states
   - route/data prefetch where useful
7. Polish Profile/settings detail if needed.
8. Add category/wallet icons later.

## Not Done Yet

- Vercel deployment is not configured yet.
- Cloud PostgreSQL is not configured yet.
- Default passwords are not changed yet.
- Full manual transaction checklist on iPhone PWA is not completed yet.
- Route transitions are functional but can still be made smoother with loading skeletons/prefetch polish.

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
