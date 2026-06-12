# Household Monthly

Private household expense tracker untuk mencatat pengeluaran harian, saldo wallet, history bulanan, dan target tabungan rumah tangga.

## Stack

- Next.js 16
- TypeScript
- TailwindCSS v4
- Prisma
- PostgreSQL
- Custom username/password auth
- Lucide React icons
- Plus Jakarta Sans

## Status Saat Ini

Fitur utama yang sudah berjalan:

- Login username/password
- Protected dashboard
- Dashboard bulanan dengan month selector
- Wallet summary
- Expense, Transfer, dan Top Up
- Edit transaksi
- Soft delete dan restore transaksi
- History transaksi dengan filter bulan, status, tipe, dan minggu
- Category management
- Wallet management
- User management
- Goals manual
- Responsive mobile-first UI

## Local Setup

### Prerequisites

Di laptop/WSL baru, install dulu:

- Node.js 20 atau lebih baru
- npm
- PostgreSQL
- Git

Ubuntu/WSL quick setup:

```bash
sudo apt update
sudo apt install -y git postgresql postgresql-client
```

Install Node.js disarankan lewat `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Pastikan versi sudah terbaca:

```bash
node -v
npm -v
psql --version
```

Siapkan database lokal:

```bash
sudo service postgresql start
sudo -u postgres createdb household_monthly
sudo -u postgres psql
```

Di dalam prompt `psql`:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### Project Setup

Install dependency:

```bash
npm install
```

Copy env:

```bash
cp .env.example .env
```

Isi `.env`:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/household_monthly"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/household_monthly"
AUTH_SECRET="isi-dengan-secret-lokal"
```

Start PostgreSQL di WSL:

```bash
sudo service postgresql start
```

Jalankan migration dan seed:

```bash
npm run prisma:migrate
npm run db:seed
```

Run dev server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

Default seed users:

- `suami` / `password123`
- `istri` / `password123`

Ganti password sebelum deploy atau penggunaan serius.

## Useful Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run prisma:migrate
npm run db:seed
npm run prisma:studio
npx prisma studio
```

Catatan: jalankan `npx prisma studio` dari folder project `household-monthly`, bukan dari folder home.

## GitHub Notes

Repo boleh private, tapi file ini tetap jangan dipush:

- `.env`
- `.next`
- `node_modules`
- database dump lokal

Yang perlu dipush:

- source code
- `prisma/schema.prisma`
- `prisma/migrations`
- `.env.example`
- README, PRD, workflow, dan development notes

Saat pindah ke laptop:

```bash
git clone <repo-private-url>
cd household-monthly
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
```

Kalau update dari laptop lalu lanjut di PC:

```bash
git pull
npm install
npm run prisma:migrate
```

`npm install` hanya wajib jika dependency berubah. `prisma:migrate` wajib jika ada migration baru.

## Deployment Direction

Target deploy:

- GitHub private repo
- Vercel hosting
- PostgreSQL cloud seperti Neon atau Supabase
- Environment variables disimpan di Vercel, bukan di repo

Untuk sinkron data antar PC/laptop/Vercel, gunakan database cloud yang sama.
