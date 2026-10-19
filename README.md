# SORTIK

Sistem Sortir & Katalog Elektronik — aplikasi web statis untuk tiga peran: pembeli, staff toko, dan admin toko.

## Menjalankan

```powershell
powershell -ExecutionPolicy Bypass -File tools/static-server.ps1
```

Buka <http://127.0.0.1:8123/> (otomatis ke halaman masuk). Server statis apa pun juga bisa dipakai —
semua tautan relatif.

## Struktur

```
index.html            pengalihan ke auth/login.html
auth/                 masuk & daftar
user/                 halaman pembeli
staff/                halaman staff
admin/                halaman admin
assets/css/app.css    gaya semua halaman peran
assets/css/login.css  gaya halaman masuk/daftar
assets/js/app.js      inti: data, util, sesi, sidebar, mesin kelola
assets/js/toko/       skrip operasional bersama staff & admin (rak, produk, pesanan)
assets/js/<peran>/    skrip khusus peran: beranda, pengguna, pengaturan, halaman pembeli
tools/                server statis untuk pengembangan
```

Aturan penamaan: `assets/js/user/cari.js` dipakai `user/cari.html`, dst. Setiap halaman memuat
`assets/js/app.js` lebih dulu, lalu satu skrip halaman.

Halaman staff dan admin berpasangan: `staff/rak.html` dan `admin/rak.html` sama-sama memuat
`assets/js/toko/rak.js`, jadi fitur staff otomatis dimiliki admin tanpa salinan logika. Menambah
aksi operasional cukup di `assets/js/toko/`; halaman admin hanya perlu ada bila tautannya berbeda
(menu sidebar diatur di `MENU` pada `assets/js/app.js`).

## Halaman

| Peran | Halaman |
|---|---|
| Pembeli | beranda, cari produk & rak, deskripsi produk, keranjang & checkout, pesan, riwayat |
| Staff | beranda, tata rak, kelola barang, kelola pesanan |
| Admin | beranda & laporan penjualan, tata rak, kelola barang, kelola pesanan, kelola pengguna, pengaturan toko & kategori |

## Data

`assets/js/app.js` adalah satu-satunya tempat yang tahu bentuk data. Halaman lain hanya membaca
`db` lewat util (`produkById`, `nilaiPesanan`, `pesananku`, …).

Saat backend siap:

```js
Object.assign(db, await (await fetch("/api/db")).json());  // isi awal
const simpan = (k) => fetch(`/api/${k}`, { method: "PUT", body: JSON.stringify(db[k]) });
```

Tabel yang dirujuk:

| Koleksi | Kolom |
|---|---|
| `kategori` | id, nama, ikon |
| `produk` | id, nama, kategori, harga, stok, rak, ikon, deskripsi |
| `rak` | baris, kolom |
| `pesanan` | id, produk, pembeli, jumlah, status, tanggal, cara, bayar, alamat, lunas, staff |
| `pengguna` | id, nama, email, role, status |
| `toko` | nama, alamat, jam, wa, ongkir, rekening[] |
| `keranjang` | produk, jumlah (+ user dari sesi) |

Status pesanan: `Menunggu → Diproses → Siap → Selesai`. `cara`: `ambil | antar`.
`role`: `pembeli | staff | admin`.

## Aturan yang dijaga

- Pesanan merujuk produk lewat `id`; nama/harga tidak disalin.
- Kategori yang masih dipakai barang tidak bisa dihapus.
- Barang yang sudah muncul di riwayat pesanan tidak bisa dihapus.
- Email pengguna unik; email yang sudah dipakai ditolak.
- `Esc` menutup form kelola atau detail pesanan yang sedang terbuka.
- Jumlah di keranjang dibatasi stok; barang terhapus/habis dibuang saat checkout.
- Pembeli hanya melihat pesanannya sendiri; pembayaran dan status dimajukan staff.
- Admin boleh melakukan semua aksi staff (tata rak, kelola barang, kelola pesanan); perbedaan peran
  hanya pada menu, bukan pada logika skrip `assets/js/toko/`.

## Batasan

Belum ada backend: sesi masih demo per folder, data disimpan di `localStorage` (`sortik2:*`)
sehingga berbeda per browser, login menerima kredensial apa pun, dan stok belum berkurang otomatis
saat pesanan dibuat.
