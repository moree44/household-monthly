# Deployment Checklist

Target: GitHub private repo -> Vercel -> Neon PostgreSQL.

## 1. Database Provider

Selected provider:

- Neon
- Region: AWS Asia Pacific 1, Singapore
- Database: `neondb`

Use one shared cloud database so PC, laptop, phone, and Vercel read/write the same production data.

## 2. Environment Variables

Local development can keep using `.env`.

For Neon testing from local machine, keep a private local file such as:

```text
.env.local-neon
```

Do not commit this file.

Expected env values:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="long-random-production-secret"
SEED_SUAMI_PASSWORD="production-seed-password"
SEED_ISTRI_PASSWORD="production-seed-password"
```

Notes:

- Use Neon pooled URL for `DATABASE_URL`.
- Use Neon direct URL for `DIRECT_URL` / migrations.
- `SEED_SUAMI_PASSWORD` and `SEED_ISTRI_PASSWORD` are only used when running `npm run db:seed`.
- Store production env values in Vercel Environment Variables, not in GitHub.

## 3. Generate Production Auth Secret

Example:

```bash
openssl rand -base64 32
```

Put the output into `AUTH_SECRET`.

## 4. Cloud Database Status

Current Neon setup has been completed:

- Migrations applied with `npx prisma migrate deploy`.
- Seed completed with custom seed passwords.
- Initial cloud data verified:
  - 2 users
  - 4 wallets
  - 4 source accounts
  - 10 categories
  - 2 goals

For future migrations against Neon, use:

```bash
set -a
source .env.local-neon
set +a
npm run prisma:migrate:deploy
```

Latest applied performance migration:

- `20260613000000_add_transaction_query_indexes`

This adds indexes for Dashboard, History, wallet balance, and category/month queries.

Latest app-side performance changes:

- History filter chips run client-side inside the selected month.
- Transaction create/edit actions validate active wallet/category/source account references server-side.
- Transaction date parsing, month boundaries, form defaults, and History grouping use WIB (`Asia/Jakarta`) consistently.
- Dashboard previous/next month navigation prefetches adjacent months to reduce perceived delay.
- Dashboard wallet cards keep 4 cards by default and expand inline with `View all` / `Hide`.
- Settings count queries use grouped counts instead of relation `_count` includes.
- Delete/restore refreshes the current route after successful action.

Only run seed again if the target database is empty or intentionally being reset:

```bash
set -a
source .env.local-neon
set +a
npm run db:seed
```

## 5. Vercel Setup

In Vercel:

1. Import GitHub private repo.
2. Framework: Next.js.
3. Add Environment Variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `SEED_SUAMI_PASSWORD` optional after seed
   - `SEED_ISTRI_PASSWORD` optional after seed
4. Deploy.

Vercel does not need to run `npm run db:seed` during deploy because the Neon database has already been seeded.

## 6. Post Deploy Smoke Test

Open production URL and test:

- Login `suami`.
- Dashboard loads
- Create Expense
- Create Transfer
- Create Top Up
- Edit transaction
- Verify selected transaction date remains correct in WIB after create/edit
- Delete transaction
- Restore transaction
- Check History active/deleted
- Check History W1/W2/W3/W4 filters
- Check History Expense/Top Up/Transfer filters
- Check Dashboard previous/next month navigation
- Check Dashboard wallet `View all` toggle if more than 4 wallets exist
- Check mobile Add to Home Screen

Optional production audit:

- Run Lighthouse in Incognito with extensions disabled.
- Run twice and compare the second result to avoid cold-start noise.
- Check Performance, Accessibility, Best Practices, FCP, and LCP.

If users already exist and a password needs to be changed, update from:

```text
Profil -> Kelola Pengguna
```

## 7. Future Maintenance

For a normal code update:

```bash
git pull
npm install
npm run lint
npx tsc --noEmit
npm run build
```

If there is a new Prisma migration:

```bash
set -a
source .env.local-neon
set +a
npm run prisma:migrate:deploy
```

Then push to GitHub and let Vercel redeploy.

## 8. Important Safety

- Never commit `.env`.
- Never commit `.env.local-neon`.
- Do not use `password123` in production.
- Rotate Neon password and `AUTH_SECRET` if setup values were pasted/shared during development.
- Cloudflare Tunnel quick URLs are public while the tunnel runs.
- Use a private GitHub repo.
