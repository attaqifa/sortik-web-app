# SORTIK

Sistem Sortir & Katalog Elektronik — aplikasi web toko elektronik dengan tiga peran:
**pembeli**, **staff toko**, dan **admin toko**.

Data, sesi, dan keranjang disimpan di server (PHP + PostgreSQL); browser tidak menyimpan data apa pun.
Rancangan backend: `docs/rancangan-backend.md`.

## Menjalankan (lokal)

Butuh PHP 8.3 (ekstensi `pdo_pgsql`) dan PostgreSQL.

1. Buat database `sortik_dev` di PostgreSQL (mis. lewat pgAdmin), lalu jalankan
   `backend/db/skema.sql` dan setelah itu `backend/db/seed.sql` di Query Tool.
2. Buat berkas `.env` di akar repo (tidak ikut git):

   ```
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=sortik_dev
   DB_USER=postgres
   DB_PASS=kata_sandi_anda
   ```

3. Jalankan dari akar repo, lalu buka <http://127.0.0.1:8080/>:

   ```bash
   php -S 127.0.0.1:8080 -t public backend/dev-router.php
   ```

Halaman (folder `public/`) dan API disajikan satu alamat (`/api/...`), jadi tidak perlu CORS. Membuka
halaman lewat server statis biasa (mis. `python -m http.server`) tidak akan jalan
karena `/api` tidak ada di sana.

## Akun awal

Berkas `seed.sql` membuat akun awal. Ganti kata sandinya sebelum dipakai sungguhan. Kata sandi awal: `Sortik#2026`

| Peran   | Email              |
|---------|--------------------|
| Admin   | admin@sortik.id    |
| Staff   | staff@sortik.id    |
| Pembeli | budi@sortik.id     |
| Pembeli | sari@sortik.id     |

Pembeli baru bisa mendaftar sendiri dari halaman Daftar (kata sandi minimal 8 karakter).
Mereset data: hapus lalu buat ulang database, atau jalankan ulang `skema.sql` dan `seed.sql`.

## Alur pesanan

1. Pembeli memasukkan barang ke keranjang lalu checkout. **Stok langsung dicadangkan.**
2. Status pesanan: `Menunggu` → `Diproses` → `Siap` → `Selesai`.
3. Transfer: pembeli mengunggah bukti; staff mengonfirmasi pembayaran (pesanan menjadi `Diproses`).
4. Pesanan `Menunggu` yang belum dibayar **dibatalkan otomatis setelah 2 hari**
   (cron: `php backend/cron/batal_kedaluwarsa.php` tiap jam; daftar pesanan juga memeriksanya). Pembeli juga
   bisa membatalkan sendiri selama belum dibayar. Pembatalan tidak menghapus data: statusnya
   menjadi `Dibatalkan`, stok dikembalikan, dan pesanan tetap muncul di riwayat.

## Keamanan

- Kata sandi di-hash dengan Argon2id di server; sesi memakai cookie `HttpOnly` + `SameSite=Lax`
  (`Secure` otomatis di HTTPS).
- Percobaan masuk dibatasi di server (5 kali salah → jeda 60 detik per email + IP).
- Peran dicek di server (`wajib_peran()`), permintaan pengubah data wajib JSON dan diperiksa `Origin`.
- Semua query memakai prepared statement. Galat ke klien bersifat umum, rincian masuk log server.
- `Content-Security-Policy` membatasi skrip hanya dari origin sendiri; ikon Lucide
  disimpan lokal di `assets/vendor/`, tanpa CDN.
- Hanya folder `public/` yang disajikan web server; `backend/`, `.env`, dan `.git/` berada di luarnya.

## Struktur kode

```
public/               frontend (admin/, auth/, staff/, user/, assets/, index.html)
backend/
  public/index.php   router API (/api)
  src/               http.php (JSON, galat), db.php (PDO), auth.php (sesi, peran), api/ (endpoint)
  db/                skema.sql, seed.sql
  dev-router.php     router untuk `php -S` (lokal)
public/assets/js/core/
  api.js      klien API tipis ({ data, error })
  data.js     wadah data `db` (cache tampilan yang diisi dari server)
  domain.js   logika tampilan: harga jual, status (logika pesanan dipindah ke server di B3)
  ui.js       komponen tampilan & util (esc, kartu, notif, konfirmasi, denah rak)
  store.js    memuat data dari API, sesi dari server, sidebar
  kelola.js   mesin daftar + form tambah/ubah/hapus
  mulai.js    pemuat skrip halaman; daftar `HALAMAN_TERSAMBUNG` mencatat halaman yang sudah pindah
public/assets/js/{user,staff,admin,toko}/  skrip per halaman
```

Teks dari data pengguna wajib lewat `esc()` sebelum masuk `innerHTML`.

## Tes

```bash
for f in tests/*.test.cjs; do node "$f"; done
```

Tes frontend berjalan di `vm` dengan DOM tiruan (hanya Node). Tes balapan stok (butuh server berjalan):

```bash
node backend/tests/balapan-stok.cjs http://127.0.0.1:8080
```
