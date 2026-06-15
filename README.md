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
- Vercel + Neon PostgreSQL production deployment
- Route loading skeletons and optimized dashboard/history queries
- Client-side History filters for status, type, and week within the selected month
- WIB-consistent transaction date handling for local/Vercel parity
- Dashboard wallet `View all` toggle for extra wallets such as `Dompet Suami`

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
SEED_SUAMI_PASSWORD="password123"
SEED_ISTRI_PASSWORD="password123"
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

Untuk environment baru, ubah `SEED_SUAMI_PASSWORD` dan `SEED_ISTRI_PASSWORD` sebelum `npm run db:seed` jika tidak ingin memakai `password123`.

Untuk user yang sudah terlanjur dibuat, ubah password lewat menu:

```text
Profil -> Kelola Pengguna -> Password baru -> Save
```

## Useful Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run db:seed
npm run prisma:studio
npx prisma studio
```

Catatan: jalankan `npx prisma studio` dari folder project `household-monthly`, bukan dari folder home.

## PWA / iPhone Test

Project sudah punya metadata PWA, generated app icons, dan safe-area handling untuk Safari iOS Add to Home Screen.

Untuk test dari iPhone di jaringan luar/laptop, bisa pakai production mode + Cloudflare Tunnel:

```bash
npm run build
npm run start -- --hostname 0.0.0.0
cloudflared tunnel --url http://localhost:3000
```

Cloudflare Tunnel quick URL bersifat sementara dan publik selama proses tunnel berjalan.

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

`npm install` hanya wajib jika dependency berubah. `prisma:migrate` wajib jika ada migration lokal baru.

Jika ada migration baru untuk database Neon production, gunakan:

```bash
set -a
source .env.local-neon
set +a
npm run prisma:migrate:deploy
```

## Deployment Direction

Target deploy:

- GitHub private repo
- Vercel hosting
- Neon PostgreSQL cloud
- Environment variables disimpan di Vercel, bukan di repo

Neon database sudah dibuat dan migration/seed awal sudah selesai. Untuk sinkron data antar PC/laptop/Vercel, gunakan database cloud yang sama.

Production performance notes:

- Vercel functions diarahkan ke Singapore.
- Dashboard memakai grouped aggregate queries untuk saldo wallet.
- Dashboard month selector prefetches adjacent months to reduce perceived delay.
- Dashboard wallet section shows 4 wallets by default and can expand inline with `View all`.
- History query mengambil data bulan sekali, lalu status/type/week filter diproses di browser.
- Transaction indexes sudah ditambahkan untuk data jangka panjang.
- Transaction save actions validate active wallet/category/source account references server-side.
- Transaction date parsing, month boundaries, History grouping, and form date defaults use WIB consistently.
- Delay singkat setelah idle masih mungkin terjadi karena serverless cold start.

Latest Lighthouse snapshot:

- Performance: 87
- Accessibility: 95
- Best Practices: 77
- FCP: 1.6s
- LCP: 2.1s

Next audit target: inspect Lighthouse Best Practices details and fix actionable warnings.

Detail deployment ada di:

```text
DEPLOYMENT.md
```
