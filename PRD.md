# Household Monthly

## Product Requirements Document

**Version 2.0**

---

## Product Overview

Household Monthly adalah aplikasi private household expense tracker untuk suami dan istri.

Aplikasi berfokus pada pencatatan pengeluaran harian, ringkasan pengeluaran bulanan, saldo wallet, category management, dan transparansi kondisi uang operasional rumah tangga.

**Aplikasi berfokus pada:**

- Pencatatan pengeluaran harian
- Ringkasan pengeluaran bulanan
- Wallet management
- Transfer antar wallet
- Category management
- Source account metadata untuk top up
- Soft delete dan audit transaksi
- Penggunaan pribadi oleh suami dan istri

**Bukan aplikasi:**

- Budget management ketat
- Crypto portfolio tracker
- Investment tracker
- Net worth tracker
- Personal accounting software lengkap
- Multi-family SaaS

---

## Target Users

**Primary Users:**

- Suami dan istri
- Penghasilan tidak selalu tetap
- Ingin mengetahui pengeluaran rumah tangga per hari dan per bulan
- Ingin memisahkan uang operasional, dompet istri, tabungan rumah, dan dana darurat

**Current Use Case:**

- Dana rumah tangga berasal dari tabungan atau hasil freelance
- Nominal operasional bulanan bisa berubah sesuai situasi
- Dompet istri diisi sekitar Rp500.000 untuk satu minggu, tetapi tanggal transfer bebas
- Sisa Dompet Istri tetap terakumulasi dan tidak hangus
- Tabungan Rumah dipisahkan dari pengeluaran operasional bulanan utama
- Sisa saldo operasional bulan sebelumnya dapat dipindahkan ke Tabungan Rumah melalui fitur closing bulanan

---

## Core Financial Philosophy

Jangan mengelola seluruh aset setiap hari.

Yang dikelola setiap hari adalah uang operasional rumah tangga dan histori pengeluaran.

**Model:**

```text
Source Account
  -> Top Up
Wallet
  -> Transfer Wallet
Wallet
  -> Expense
Monthly Summary
```

**Contoh alur:**

```text
SeaBank Suami
  -> Top Up Kas Rumah Tangga Rp5.000.000
Kas Rumah Tangga
  -> Transfer Dompet Istri Rp500.000
Dompet Istri
  -> Expense Belanja Dapur Rp150.000
```

---

## MVP Scope

**Included in MVP:**

- Username/password login
- Two private users: suami and istri
- Role admin/member
- Wallet management
- Source account metadata
- Top up wallet
- Transfer antar wallet
- Expense tracking manual
- Category management dengan 10 kategori utama tanpa sub-kategori
- Goals manual untuk target tabungan
- Dashboard bulanan
- Transaction history
- History filter per bulan, status, tipe transaksi, dan minggu
- Edit transaction
- Soft delete transaction
- Restore transaction
- Basic responsive UI for mobile and desktop

**Excluded from MVP:**

- Budget system
- Carry over budget
- Receipt upload
- OCR receipt
- Bank integration
- PDF export
- AI insights
- Multi-family support
- Public registration

---

## User Roles

### Admin - Suami

- Manage users
- Manage wallets
- Manage source accounts
- Manage categories and sub-categories
- View all transactions
- Add expense
- Add top up
- Add transfer
- Edit all transactions
- Soft delete all transactions
- View dashboard and history

### Member - Istri

- View dashboard
- View history
- Add expense
- Add transfer if needed
- Edit transactions
- Soft delete transactions
- View wallet details

---

## Authentication

Login menggunakan username dan password, bukan email.

### Rules

- Tidak ada public registration.
- User awal dibuat dari seed data atau admin setup.
- Password harus disimpan sebagai hash, bukan plaintext.
- Session disimpan menggunakan secure HTTP-only cookie.
- Route aplikasi wajib protected.
- Logout menghapus session cookie.

### User Fields

| Field | Keterangan |
|---|---|
| id | Primary key |
| username | Unique username |
| display_name | Nama tampilan |
| role | `admin` atau `member` |
| password_hash | Hash password |
| is_active | Status user |
| created_at | Waktu dibuat |
| updated_at | Waktu terakhir diubah |

---

## Wallet Structure

Wallet adalah tempat uang operasional dicatat. Saldo wallet berubah karena top up, transfer, expense, atau adjustment.

### Default Wallets

#### Kas Rumah Tangga

Wallet utama untuk pengeluaran operasional rumah tangga. Diisi dari source account melalui transaksi top up.

#### Dompet Istri

Wallet yang diisi dari Kas Rumah Tangga secara fleksibel, biasanya sekitar Rp500.000 untuk satu minggu.

**Rules:**

- Tanggal transfer bebas.
- Tidak ada reset mingguan otomatis.
- Sisa saldo terakumulasi.
- Pengeluaran dari wallet ini tetap masuk histori bulanan.
- Dashboard dapat menampilkan ringkasan transfer dan expense Dompet Istri per bulan.

#### Tabungan Rumah

Wallet khusus untuk tabungan rumah, pembelian furnitur, elektronik rumah, perlengkapan besar, dan kebutuhan rumah jangka menengah.

**Rules:**

- Dipisahkan dari pengeluaran operasional bulanan utama.
- Tetap tampil di dashboard wallet.
- Tetap bisa dianalisis di history.
- Dapat menerima transfer otomatis/manual dari sisa saldo operasional saat closing bulanan.

#### Dana Darurat

Wallet untuk pengeluaran darurat tidak terduga.

### Wallet Fields

| Field | Keterangan |
|---|---|
| id | Primary key |
| name | Nama wallet |
| type | `operational`, `wife`, `home_setup`, `emergency`, `custom` |
| initial_balance | Saldo awal saat wallet dibuat |
| sort_order | Urutan tampil |
| is_active | Status aktif |
| created_at | Waktu dibuat |
| updated_at | Waktu terakhir diubah |

---

## Source Accounts

Source account hanya digunakan sebagai metadata saat top up. Source account tidak diperlakukan sebagai wallet dan tidak tampil sebagai saldo utama.

### Default Source Accounts

- BCA Suami
- SeaBank Suami
- BCA Istri
- SeaBank Istri

### Source Account Fields

| Field | Keterangan |
|---|---|
| id | Primary key |
| name | Nama source account |
| owner | `suami`, `istri`, atau custom text |
| is_active | Status aktif |
| created_at | Waktu dibuat |
| updated_at | Waktu terakhir diubah |

---

## Transaction System

Semua perubahan uang dicatat sebagai transaksi. Dashboard, saldo wallet, dan laporan bulanan dihitung dari transaksi.

### Transaction Types

#### Expense

Pengeluaran dari satu wallet.

Required:

- Date
- Amount
- Wallet
- Category
- Description optional

#### Transfer

Perpindahan saldo antar wallet.

Required:

- Date
- Amount
- From wallet
- To wallet
- Description optional

Rules:

- Transfer tidak dihitung sebagai pengeluaran bulanan.
- Transfer mengurangi saldo wallet asal dan menambah saldo wallet tujuan.

#### Top Up

Penambahan saldo wallet dari source account.

Required:

- Date
- Amount
- Destination wallet
- Source account
- Description optional

Rules:

- Top up tidak dihitung sebagai pengeluaran bulanan.
- Source account hanya metadata.

#### Adjustment

Koreksi saldo manual jika ada ketidaksesuaian.

Required:

- Date
- Amount
- Wallet
- Direction: `increase` atau `decrease`
- Reason

Rules:

- Adjustment tidak digunakan untuk transaksi harian normal.
- Adjustment tampil jelas di history.

### Transaction Fields

| Field | Keterangan |
|---|---|
| id | Primary key |
| type | `expense`, `transfer`, `top_up`, `adjustment` |
| transaction_date | Tanggal transaksi |
| amount | Nominal positif |
| wallet_id | Wallet utama untuk expense/top up/adjustment |
| from_wallet_id | Wallet asal untuk transfer |
| to_wallet_id | Wallet tujuan untuk transfer |
| source_account_id | Source account untuk top up |
| category_id | Kategori expense |
| description | Catatan optional |
| created_by | User pembuat |
| updated_by | User terakhir edit |
| deleted_by | User yang menghapus |
| deleted_at | Soft delete timestamp |
| created_at | Waktu dibuat |
| updated_at | Waktu terakhir diubah |

### Soft Delete Rules

- Transaksi tidak dihapus permanen dari database.
- Transaksi dengan `deleted_at` tidak masuk saldo dan summary.
- Deleted transactions dapat dilihat dari filter `Deleted` di History.
- Restore transaction mengembalikan transaksi ke perhitungan aktif.

---

## Monthly Summary

Tidak ada budget bulanan pada MVP. Monthly summary berfungsi untuk melihat total pengeluaran dan pola penggunaan.

### Summary Metrics

- Total operational expense bulan ini
- Total home setup expense bulan ini
- Total emergency expense bulan ini
- Total expense per category
- Total top up per source account
- Total transfer antar wallet
- Wallet balances
- Recent transactions

### Operational Expense Rules

Operational expense adalah expense dari wallet:

- Kas Rumah Tangga
- Dompet Istri

Expense dari Tabungan Rumah dipisahkan dari operational expense.

---

## Categories

Kategori bersifat default dan dapat dikelola melalui Category Management.

MVP menggunakan 10 kategori utama tanpa sub-kategori:

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

Detail item spesifik masuk ke field `description` / catatan.

Contoh:

```text
Kategori: Bills
Catatan: Listrik token Juni

Kategori: Belanja Dapur
Catatan: Buah melon
```

---

## Category Management

Category Management masuk MVP.

### Permissions

- Admin dapat mengelola kategori.
- Member dapat melihat kategori aktif saat input transaksi.

### Actions

| Action | Keterangan |
|---|---|
| Tambah kategori | Buat kategori baru |
| Edit nama | Ubah nama kategori |
| Nonaktifkan | Sembunyikan dari form input, data lama tetap terbaca |
| Hapus | Hanya jika belum pernah dipakai transaksi |
| Atur urutan | Urutan tampilan di form input |

### Rules

- Kategori yang sudah dipakai transaksi tidak bisa dihapus, hanya bisa dinonaktifkan.
- Kategori nonaktif tidak muncul saat input transaksi baru.
- Kategori nonaktif tetap tampil di transaksi lama.
- Minimal harus ada satu kategori aktif.
- Kategori default tidak bisa dihapus permanen, hanya bisa dinonaktifkan.

---

## History

### Filter

- Bulan
- Tipe transaksi
- Deleted status
- Minggu dalam bulan:
  - W1: tanggal 1-7
  - W2: tanggal 8-14
  - W3: tanggal 15-21
  - W4: tanggal 22 sampai akhir bulan

Filter lanjutan seperti kategori, wallet, dan user dapat ditambahkan setelah MVP.

### Sort

- Tanggal terbaru
- Tanggal terlama
- Nominal terbesar
- Nominal terkecil

### Display

- List dikelompokkan per tanggal.
- Setiap item menampilkan tipe transaksi, kategori/title, nominal, wallet/source, user input, jam input, dan catatan jika ada.
- Expense, top up, transfer, dan adjustment dibedakan secara visual.
- Active transaction dapat diedit atau soft delete.
- Deleted transaction dapat direstore.

---

## Goals

Goals adalah target tabungan manual dan tidak terhubung otomatis ke wallet.

### Rules

- Goal punya nama, nominal terkumpul, target nominal, dan status aktif.
- User dapat tambah, edit, nonaktifkan, dan aktifkan ulang goal.
- Nominal goal diinput manual.
- Default goals:
  - Dana Darurat
  - Tabungan Rumah
- Icon goal otomatis berdasarkan nama goal menggunakan Lucide React.

### Auto Icon Mapping

- Dana Darurat -> ShieldCheck
- Tabungan Rumah / Renovasi -> House
- Liburan / Holiday / Vacation -> Plane
- Travel / Jalan -> Palmtree
- Mobil / Motor / Kendaraan -> Car
- Laptop / Komputer / PC -> Laptop
- Sekolah / Pendidikan / Kuliah -> GraduationCap
- Lainnya -> Target

---

## Dashboard

Dashboard harus memberi gambaran kondisi bulan berjalan dalam kurang dari 3 detik.

### Mobile

**Card 1 - Monthly Expense**

- Total operational expense bulan ini
- Perbandingan dengan bulan sebelumnya jika data tersedia

**Card 2 - Wallet Summary**

- Kas Rumah Tangga
- Dompet Istri
- Tabungan Rumah
- Dana Darurat

**Card 3 - Category Spending**

- Top 5 kategori pengeluaran bulan ini

**Card 4 - Dompet Istri**

- Saldo saat ini
- Total transfer masuk bulan ini
- Total expense bulan ini

**Card 5 - Recent Transactions**

- 5 transaksi terbaru

### Desktop

**Top Row**

- Monthly operational expense
- Tabungan Rumah expense
- Total wallet balance

**Middle Row**

- Wallet summary
- Category spending
- Dompet Istri summary

**Bottom Row**

- Recent transactions
- Source account top up summary

---

## UX Principles

User harus mengetahui kondisi pengeluaran bulan berjalan dalam kurang dari 3 detik setelah membuka aplikasi.

**Prioritas informasi:**

1. Pengeluaran bulan ini
2. Saldo wallet
3. Pengeluaran per kategori
4. Dompet Istri
5. Transaksi terbaru

---

## Design Philosophy

- Simple
- Calm
- Trustworthy
- Fast
- Minimal
- Mobile-first

---

## Design System

### Colors

**Neutral**

| Token | Value |
|---|---|
| Outer Background | `#262626` |
| App Background | `#F5F5F5` |
| Surface | `#FFFFFF` |
| Muted Surface | `#E5E5E5` |
| Active Surface | `#171717` |
| Primary Text | `#0A0A0A` |
| Secondary Text | `#737373` |
| Border | `#D4D4D4` |

**Accent and Status**

| Token | Value |
|---|---|
| Primary | `#3B82F6` |
| Success | `#16A34A` |
| Warning | `#F59E0B` |
| Danger | `#DC2626` |
| Info | `#0891B2` |

### Typography

| Field | Value |
|---|---|
| Font Family | Plus Jakarta Sans |
| Weights | Regular, Medium, Semibold, Bold |

### Icons

| Field | Value |
|---|---|
| Library | Lucide |
| Style | Mostly monochrome grayscale with limited blue accent |
| Stroke Width | 1.8-2 |

### Animations

**Allowed:**

- Fade in
- Slide up
- Progress animation
- Modal transition

**Forbidden:**

- Confetti
- Bounce
- Decorative animation
- Flashy effects

---

## Navigation

### Bottom Navigation

- Home
- History
- Catat
- Goals
- Profil

### Add Flow

Primary add button membuka pilihan:

- Expense
- Transfer
- Top Up
- Adjustment

---

## Technical Architecture

### Frontend

| Field | Value |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Styling | TailwindCSS |
| Components | Custom app components |
| Icons | Lucide React |

### Backend

| Field | Value |
|---|---|
| Runtime | Next.js server actions / route handlers |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Custom username/password auth |
| Session | HTTP-only cookie |

### Deployment

| Field | Value |
|---|---|
| Hosting | Vercel |
| DNS | Cloudflare |
| Version Control | GitHub |

### Infrastructure Flow

```text
User
  -> Cloudflare DNS
  -> Vercel
  -> Next.js Application
  -> PostgreSQL Database
```

---

## Database Tables

### Core Tables

- users
- sessions
- wallets
- source_accounts
- categories
- transactions
- goals

### Recommended Indexes

- `transactions(transaction_date)`
- `transactions(type)`
- `transactions(wallet_id)`
- `transactions(from_wallet_id)`
- `transactions(to_wallet_id)`
- `transactions(category_id)`
- `transactions(created_by)`
- `transactions(deleted_at)`
- `categories(sort_order)`
- `goals(sort_order)`

---

## Project Structure

```text
src/
  app/
    (auth)/
    (app)/
    api/
  components/
    ui/
    layout/
  features/
    auth/
    dashboard/
    wallets/
    transactions/
    categories/
    history/
    goals/
    settings/profile/
  lib/
    auth/
    db/
    format/
  types/
prisma/
  schema.prisma
  seed.ts
```

---

## Development Roadmap

### Phase 1 - Foundation - Done

- Setup Next.js project
- Setup TailwindCSS
- Setup Prisma
- Create database schema
- Create seed data
- Implement custom username/password login
- Implement protected routes

### Phase 2 - Core Transaction Flow - Done

- Wallet list
- Source account list
- Transaction model
- Create top up
- Create transfer
- Create expense
- Soft delete transaction
- Edit transaction
- Restore transaction

### Phase 3 - Category, Wallet, User Management - Mostly Done

- Seed default categories
- Add category
- Edit category
- Deactivate category
- Wallet management
- User management

### Phase 4 - Dashboard, History, Goals - Done

- Monthly summary
- Wallet balances
- Category spending
- Dompet Istri summary
- Recent transactions
- History filters by month, status, type, and week
- Manual goals
- Goal icon auto mapping

### Phase 5 - Current Polish

- Responsive refinements
- Loading states
- Empty states
- Form validation
- Error handling
- UI consistency across dashboard, catat, history, goals, profile
- Transaction flow audit
- Prepare private GitHub repo
- Prepare cloud database and Vercel deployment

### Future Phase

- Category icons
- Manual goal icon picker
- Advanced history filters
- Monthly closing flow to move leftover operational balance to Tabungan Rumah
- Receipt upload
- OCR parsing
- OCR fallback flow

---

## Success Metrics

| Metric | Target |
|---|---|
| Primary KPI | 90% household transactions recorded monthly |
| Speed KPI | Dashboard usable under 3 seconds |
| Target Usage | Used by husband and wife every week |
| Minimum Lifetime | 3+ years usage without redesign |

---

## Performance Notes

Expected data scale is small:

- 20 transactions per day for 5 years is about 36,500 transactions.
- PostgreSQL can handle this comfortably.
- Dashboard should query only the active month where possible.
- History should use pagination.
- Frequently filtered fields must be indexed.
- Receipt upload and OCR are excluded from MVP to keep the app fast and simple.

---

## Changelog

| Version | Perubahan |
|---|---|
| 1.0 | Initial PRD |
| 1.1 | Tambah carry over, dompet istri mechanics, OCR fallback, history specs |
| 1.2 | Tambah source account metadata, multiple goals, category management placeholder |
| 1.3 | Revisi kategori final, tambah Category Management section |
| 2.0 | Rename ke Household Monthly, hapus budget system, tambah username/password custom auth, soft delete, category management MVP, dan data model awal |
| 2.1 | Update implementasi: goals manual, UI mobile-first charcoal/gray, flat categories, history weekly filter, restore transaction, dan deployment handoff notes |
