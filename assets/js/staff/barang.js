/* SORTIK — staff: kelola barang (tambah, ubah, hapus)
   Seluruh logika daftar, form, pencarian, dan hapus ada di mesin `kelola`
   (app.js) — di sini cukup mendaftar kolomnya. Nama field = nama kolom
   database, jadi tidak perlu dipetakan lagi saat pindah ke DB.
   DB: GET /api/produk, POST /api/produk, PUT/DELETE /api/produk/<id> */

kelola({
  wadah: "kelola",          /* tempat kartu dirender (staff/produk.html) */
  kunci: "produk",          /* koleksi di db + endpoint di ENDPOINT */
  nama: "Barang",           /* sebutan satuannya: "Tambah Barang" */
  kode: "PRD-",             /* awalan nomor pada judul form ubah */
  petunjuk: "Cari nama, kategori, atau rak...",

  /* kolom form: [field di database, label, jenis, pilihan untuk jenis "pilih"] */
  kolom: [
    ["nama", "Nama barang", "text"],
    ["kategori", "Kategori", "pilih", () => db.kategori.map((k) => [k.id, k.nama])],
    ["harga", "Harga (Rp)", "angka"],
    ["stok", "Stok", "angka"],
    ["rak", "Rak", "pilih", () => semuaRak().map((r) => [r, r])],
    ["ikon", "Ikon (emoji)", "text"],
    ["deskripsi", "Deskripsi", "area"]
  ],

  cari: (p) => `${p.nama} ${kat(p)} ${p.rak}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),
  baris: (p) => `<div class="thumb">${p.ikon || "📦"}</div>
  <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok} · rak ${p.rak}</span></div>`
});
