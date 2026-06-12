# Workflow: Catat Transaksi & Kategori

## Kategori Final

10 kategori utama, tidak ada sub-kategori:

```
Belanja Dapur
Food & Drink
Daily Needs
Bills
Transport
Health
Entertainment
Social
Home Care
Others
```

---

## Struktur Expense

Setiap transaksi terdiri dari:

```
Nominal    → input angka
Kategori   → pilih dari 10 chip (tidak ada sub-kategori)
Catatan    → bebas ketik, opsional
             contoh: "Kopi Toska", "Listrik Juni", "Bensin full"
Wallet     → pilih: Kas Rumah Tangga atau Dompet Istri
Tanggal    → default hari ini, bisa diubah
```

---

## Workflow Catat Transaksi (Mobile)

```
1. Tap FAB (+) di bottom navigation
2. Pilih tipe: Expense / Transfer / Top Up
3. Input nominal
4. Pilih wallet
5. Pilih kategori dari chip grid
6. Ketik catatan detail (opsional, bebas tulis)
7. Konfirmasi tanggal (default hari ini)
8. Tap Save
```

Goal UX:

```
- Form harus cepat untuk input harian.
- Nominal otomatis memakai titik ribuan.
- Kategori dibuat chip, bukan dropdown.
- Tombol utama memakai label "Save".
- Mobile-first; idealnya Expense bisa dicatat tanpa scroll panjang di iPhone 13/15.
```

---

## Workflow Transfer

```
1. Tap FAB (+)
2. Pilih Transfer
3. Input nominal
4. Pilih wallet asal
5. Pilih wallet tujuan
6. Isi catatan jika perlu
7. Konfirmasi tanggal
8. Tap Save
```

Rules:

- Transfer tidak dihitung sebagai pengeluaran.
- Wallet asal berkurang.
- Wallet tujuan bertambah.
- Transfer tampil di History dan Recent Transactions.

---

## Workflow Top Up

```
1. Tap FAB (+)
2. Pilih Top Up
3. Input nominal
4. Pilih source account
5. Pilih wallet tujuan
6. Isi catatan jika perlu
7. Konfirmasi tanggal
8. Tap Save
```

Rules:

- Top Up tidak dihitung sebagai pengeluaran.
- Source account hanya metadata.
- Wallet tujuan bertambah.

---

## Logika Kategori

### Belanja Dapur
Semua pembelian bahan makanan untuk dikonsumsi di rumah.
Contoh catatan: "Sayur mayur", "Beras 5kg", "Buah-buahan", "Lauk pauk"

### Food & Drink
Semua konsumsi di luar rumah atau delivery.
Contoh catatan: "Kopi Toska", "Makan malam berdua", "GoFood ayam geprek", "Bubble tea"

### Daily Needs
Kebutuhan rumah tangga non-makanan yang rutin dibeli.
Contoh catatan: "Air galon", "Gas LPG", "Sabun & shampoo", "Laundry"

### Bills
Tagihan tetap bulanan.
Contoh catatan: "Listrik Juni", "Internet Indihome", "Iuran sampah", "Iuran keamanan"

### Transport
Semua pengeluaran terkait kendaraan dan mobilitas.
Contoh catatan: "Bensin full", "Parkir mall", "Grab ke RS", "Servis motor"

### Health
Pengeluaran kesehatan.
Contoh catatan: "Obat flu", "Dokter klinik", "Vitamin C"

### Entertainment
Pengeluaran hiburan dan gaya hidup pilihan.
Contoh catatan: "Netflix", "Bioskop", "Staycation", "Spotify"

### Social
Pengeluaran untuk keperluan sosial.
Contoh catatan: "Kado nikahan", "Donasi", "Arisan"

### Home Care
Pengeluaran untuk rumah — perbaikan, perabot, dan perlengkapan.
Contoh catatan: "Ganti kran bocor", "Keset baru", "Lemari", "Rice cooker"

### Others
Pengeluaran yang tidak masuk kategori manapun.
Contoh catatan: bebas

---

## Pembeda Transaksi Suami vs Istri

Kategori tidak membedakan siapa yang bayar.
Pembeda utama ada di dua field:

```
Wallet   → Kas Rumah Tangga (suami kelola)
           Dompet Istri (istri kelola)
User     → dicatat otomatis dari siapa yang login
```

Contoh di riwayat:
```
Food & Drink  "Kopi Toska"         Kas Rumah  Suami  − 23.000
Food & Drink  "Bubble tea"         Dompet Istri  Istri  − 18.000
Food & Drink  "Makan malam berdua" Kas Rumah  Suami  − 120.000
```

---

## Catatan Implementasi

- Dropdown kategori native dihapus sepenuhnya
- Diganti chip grid 10 item, semua terlihat tanpa scroll
- Field "Catatan" bebas ketik, tidak ada autocomplete
- Sub-kategori lama di database di-migrate ke field catatan
- Tabel `categories` cukup 10 baris, tidak ada parent-child
- Category Management berada di menu Profil -> Kelola Kategori
- Nama kategori boleh diedit, ditambah, dan dinonaktifkan
- Kategori nonaktif tidak muncul di form catat, tetapi tetap terbaca di transaksi lama
