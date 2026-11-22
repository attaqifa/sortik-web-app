<div align="center">

# SORTIK

**Sistem Sortir & Katalog Elektronik**

Aplikasi web toko elektronik untuk mengelola katalog, lokasi rak, pesanan, dan keuangan dalam satu sistem.

![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black)
![Tanpa framework](https://img.shields.io/badge/framework-none-2563EB)

[Fitur](#fitur) · [Memulai](#memulai) · [Alur Pesanan](#alur-pesanan) · [Struktur Proyek](#struktur-proyek) · [Keamanan](#keamanan) · [Deployment](#deployment)

</div>

---

## Tentang

SORTIK menjawab tiga pertanyaan harian sebuah toko elektronik: **barang apa yang tersedia**, **di rak mana
letaknya**, dan **bagaimana status pesanannya**. Pembeli memesan lewat web, staff memprosesnya, dan admin
memantau penjualan serta keuangan.

Seluruh data (akun, sesi, keranjang, pesanan, foto) disimpan di server dan PostgreSQL. Browser tidak
menyimpan data apa pun, sehingga akun dan pesanan yang sama dapat dibuka dari perangkat mana pun.

## Fitur

**Pembeli**
- Pencarian dan filter produk dengan lokasi rak pada denah toko
- Detail produk: galeri foto, diskon, stok
- Keranjang, checkout (ambil di toko atau antar), unggah bukti transfer
- Pantau status pesanan, batalkan pesanan yang belum dibayar, riwayat pesanan

**Staff**
- Antrean pesanan: konfirmasi pembayaran dan ubah status
- Kelola produk dan kategori, termasuk foto
- Editor denah rak per lantai

**Admin**
- Semua fitur staff
- Keuangan: pendapatan, piutang, pengeluaran, laba bersih, grafik 6 bulan, ekspor CSV
- Kelola pengguna dan peran
- Pengaturan toko: info, ongkos kirim, rekening, logo

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | HTML, CSS, JavaScript murni (tanpa framework dan tanpa proses build) |
| Backend | PHP 8.3 native, API JSON di `/api` |
| Basis data | PostgreSQL (PDO, prepared statement) |
| Ikon | [Lucide](https://lucide.dev), disimpan lokal |

## Memulai

### Prasyarat

- PHP 8.3 dengan ekstensi `pdo_pgsql`, `pgsql`, dan `fileinfo`
- PostgreSQL

Tidak membutuhkan Docker, Composer, atau Node.js untuk menjalankan aplikasi.

### Instalasi

1. Buat database, misalnya `sortik_dev`.
2. Jalankan berkas SQL berurutan pada database tersebut:

   ```bash
   psql -d sortik_dev -f backend/db/skema.sql
   psql -d sortik_dev -f backend/db/seed.sql
   ```

   Bisa juga lewat Query Tool di pgAdmin.

3. Salin konfigurasi dan isi kata sandi database:

   ```bash
   cp .env.example .env
   ```

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=sortik_dev
   DB_USER=postgres
   DB_PASS=
   ```

4. Jalankan server dari akar repo:

   ```bash
   php -S 127.0.0.1:8080 -t public backend/dev-router.php
   ```

5. Buka <http://127.0.0.1:8080/>.

### Akun awal

Dibuat oleh `seed.sql`. Kata sandi semua akun: `Sortik#2026`.

| Peran | Email |
|---|---|
| Admin | `admin@sortik.id` |
| Staffsayagaboleh   | `staff@sortik.id` |
| Pembeli | `budi@sortik.id`, `sari@sortik.id` |

> Ganti kata sandi dan hapus akun contoh sebelum dipakai di server sungguhan.

## Alur Pesanan

```
Checkout ──► stok dicadangkan ──► konfirmasi bayar ──► Menunggu → Diproses → Siap → Selesai
                  │
                  └─► belum dibayar > 2 hari / dibatalkan pembeli ──► Dibatalkan (stok kembali)
```

- Stok dikurangi saat checkout dan dilindungi penguncian baris, sehingga tidak terjual ganda.
- Pembayaran lewat transfer (unggah bukti) atau di kasir, dikonfirmasi staff atau admin.
- Pesanan yang belum dibayar dibatalkan otomatis setelah 2 hari (cron per jam). Pesanan yang dibatalkan
  tetap tercatat dengan status `Dibatalkan`.
- Pesanan lunas dihitung sebagai pendapatan, yang belum lunas sebagai piutang.

## Struktur Proyek

```
.
├── public/                  Frontend (satu-satunya folder yang disajikan web server)
│   ├── auth/                Masuk dan daftar
│   ├── user/                Halaman pembeli
│   ├── staff/               Halaman staff
│   ├── admin/               Halaman admin
│   └── assets/              CSS, JS, gambar
│       └── js/core/         Klien API, state tampilan, komponen UI
├── backend/
│   ├── public/index.php     Router API
│   ├── src/                 Autentikasi, koneksi DB, dan endpoint (src/api/)
│   ├── db/                  skema.sql, seed.sql, migrasi/
│   ├── cron/                Pembatalan pesanan kedaluwarsa
│   ├── tests/               Tes balapan stok
│   └── uploads/             Foto dan bukti transfer (tidak ikut git)
└── .env.example
```

## Keamanan

- Kata sandi di-hash dengan Argon2id; sesi memakai cookie `HttpOnly` dan `SameSite=Lax` (`Secure` di HTTPS).
- Percobaan masuk dibatasi: 5 kali salah menahan percobaan berikutnya selama 60 detik per email dan IP.
- Peran diperiksa di server pada setiap endpoint; permintaan pengubah data wajib JSON dan diperiksa `Origin`.
- Prepared statement untuk semua query, `esc()` untuk teks pengguna, dan Content-Security-Policy tanpa skrip inline.
- Unggahan divalidasi dari isi berkas (JPG, PNG, WebP, maks. 2 MB) dan disimpan di luar folder web.
  Bukti transfer hanya dapat dibuka pemiliknya, staff, dan admin.
- Hanya `public/` yang disajikan; `backend/`, `.env`, dan `.git/` berada di luarnya.

## Pengujian

Tes balapan stok mengirim checkout serentak pada produk berstok kecil dan memastikan stok tidak pernah
negatif atau terjual ganda. Tes ini membuat akun uji (`@sortik.test`), jadi jalankan hanya pada database
pengembangan:

```bash
node backend/tests/balapan-stok.cjs http://127.0.0.1:8080
```

## Deployment

Susunan yang disarankan di server Linux:

- Nginx menyajikan `public/` dan meneruskan `/api/` ke `backend/public/index.php` lewat PHP-FPM.
- `.env` berada di luar folder web dengan hak akses terbatas; gunakan user database khusus, bukan `postgres`.
- `backend/uploads/` dapat ditulis oleh user PHP-FPM dan berada di luar folder web.
- Aktifkan HTTPS.
- Jadwalkan pembatalan pesanan kedaluwarsa:

  ```cron
  0 * * * * php /var/www/sortik/backend/cron/batal_kedaluwarsa.php
  ```

## Pemecahan Masalah

| Gejala | Solusi |
|---|---|
| `php` tidak dikenali | Tambahkan PHP ke `PATH`, lalu buka terminal baru. |
| Halaman tidak ditemukan | Jalankan server dengan `-t public`, bukan `-t .`. |
| "Data gagal dimuat" | Periksa `.env` dan pastikan PostgreSQL berjalan; lihat log di terminal server. |
| Tidak bisa masuk | Pastikan `seed.sql` sudah dijalankan; tunggu 60 detik bila terkena pembatas. |

Tim rak sortik 2026