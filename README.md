# SORTIK

Sistem Sortir & Katalog Elektronik — aplikasi web toko elektronik dengan tiga peran:
**pembeli**, **staff toko**, dan **admin toko**.

> **Mode demo lokal.** Tidak ada server: seluruh data (produk, pesanan, pengguna,
> keuangan, denah rak) disimpan di `localStorage` browser. Data tidak dibagikan
> antar perangkat, dan pemeriksaan peran/kata sandi hanya berjalan di browser
> sehingga bisa dilewati lewat Console. Jangan dipakai untuk data sungguhan
> sebelum ada backend.

## Menjalankan

HTML, CSS, dan JavaScript murni tanpa proses build. Sajikan folder ini lewat server
statis di `localhost` (penguncian data antar-tab butuh `localhost` atau HTTPS, jadi
jangan buka lewat `file://`):

```bash
python -m http.server 8000
```

Lalu buka <http://localhost:8000/>.

## Akun contoh

Kata sandi semua akun contoh: `Sortik#2026`

| Peran   | Email              |
|---------|--------------------|
| Admin   | admin@sortik.id    |
| Staff   | staff@sortik.id    |
| Pembeli | budi@sortik.id     |
| Pembeli | sari@sortik.id     |

Pembeli baru bisa mendaftar sendiri dari halaman Daftar (kata sandi minimal 8 karakter).

Mereset data: jalankan `localStorage.removeItem("sortik-db")` di Console, lalu muat ulang.

## Alur pesanan

1. Pembeli memasukkan barang ke keranjang lalu checkout. **Stok langsung dicadangkan.**
2. Status pesanan: `Menunggu` → `Diproses` → `Siap` → `Selesai`.
3. Transfer: pembeli mengunggah bukti; staff mengonfirmasi pembayaran (pesanan menjadi `Diproses`).
4. Pesanan `Menunggu` yang belum dibayar **dibatalkan otomatis setelah 2 hari**
   (`HARI_TAHAN` di `assets/js/core/ui.js`). Pembeli juga bisa membatalkan sendiri selama
   belum dibayar. Pembatalan tidak menghapus data: statusnya menjadi `Dibatalkan`, stok
   dikembalikan, dan pesanan tetap muncul di riwayat. Pesanan yang dibatalkan tidak
   dihitung di laporan keuangan.

## Keamanan (apa yang sudah dan belum)

- Kata sandi di-hash dengan PBKDF2-SHA256 (garam acak per akun); hash lama otomatis
  ditingkatkan saat berhasil masuk. Akun tanpa kata sandi tidak bisa masuk.
- Percobaan masuk dibatasi (5 kali salah → jeda 60 detik) — hanya menahan tebakan iseng,
  karena dijalankan di browser.
- `Content-Security-Policy` membatasi skrip hanya dari origin sendiri; ikon Lucide
  disimpan lokal di `assets/vendor/` (versi 1.73.0), tanpa CDN.
- **Belum aman untuk produksi:** otorisasi peran, validasi harga/stok, dan data semuanya
  di sisi klien. Perlu backend (mis. Supabase Auth + Row Level Security) agar benar-benar aman.

## Struktur kode

```
assets/js/core/
  koneksi.js  penyimpanan localStorage + masuk/daftar (hash sandi, pembatas percobaan)
  data.js     wadah data kosong `db`
  domain.js   logika data tanpa DOM: harga, transaksi, stok, buat/bayar/batalkan pesanan
  ui.js       komponen tampilan & util (esc, kartu, notif, konfirmasi, denah rak)
  store.js    sesi, simpan ke localStorage, sidebar, pembatalan otomatis
  kelola.js   mesin daftar + form tambah/ubah/hapus
  mulai.js    pemuat skrip halaman (pengganti skrip inline)
assets/js/{user,staff,admin,toko}/  skrip per halaman
```

Aturan: logika yang mengubah data diletakkan di `domain.js` dan mengembalikan `urungkan()`
bila perlu; halaman hanya memanggilnya, menyimpan (`simpan`), lalu menampilkan hasilnya.
Teks dari data pengguna wajib lewat `esc()` sebelum masuk `innerHTML`; label `chipSaring`
dipasang sebagai HTML.

## Tes

```bash
for f in tests/*.test.cjs; do node "$f"; done
```

Tanpa dependensi (hanya Node). Tes berjalan di `vm` dengan DOM tiruan.
