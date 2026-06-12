# Deployment Checklist

Target: GitHub private repo -> Vercel -> PostgreSQL cloud.

## 1. Choose Database Provider

Recommended options:

- Neon
- Supabase

Use one shared cloud database if the app should have the same data across PC, laptop, phone, and Vercel.

## 2. Create Cloud PostgreSQL Database

Create one production database, then copy the connection string.

Expected env values:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="long-random-production-secret"
SEED_SUAMI_PASSWORD="change-this"
SEED_ISTRI_PASSWORD="change-this"
```

Notes:

- Some providers give pooled and direct URLs.
- Use pooled URL for `DATABASE_URL` if recommended by provider.
- Use direct URL for `DIRECT_URL` / migrations.

## 3. Generate Production Auth Secret

Example:

```bash
openssl rand -base64 32
```

Put the output into `AUTH_SECRET`.

## 4. Run Migration Against Cloud DB

From local machine after setting `.env` to cloud DB:

```bash
npm run prisma:migrate
npm run db:seed
```

Before seed, change:

```env
SEED_SUAMI_PASSWORD="..."
SEED_ISTRI_PASSWORD="..."
```

If users already exist, update password from:

```text
Profil -> Kelola Pengguna
```

## 5. Vercel Setup

In Vercel:

1. Import GitHub private repo.
2. Framework: Next.js.
3. Add Environment Variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `AUTH_SECRET`
   - `SEED_SUAMI_PASSWORD` optional
   - `SEED_ISTRI_PASSWORD` optional
4. Deploy.

## 6. Post Deploy Smoke Test

Open production URL and test:

- Login `suami`
- Dashboard loads
- Create Expense
- Create Transfer
- Create Top Up
- Edit transaction
- Delete transaction
- Restore transaction
- Check History active/deleted
- Check mobile Add to Home Screen

## 7. Important Safety

- Never commit `.env`.
- Do not use `password123` in production.
- Cloudflare Tunnel quick URLs are public while the tunnel runs.
- Use a private GitHub repo.
