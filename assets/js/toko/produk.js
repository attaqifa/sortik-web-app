/* Kelola barang — kolom form didaftarkan di sini, logikanya di mesin kelola. */

kelola({
  wadah: "kelola",
  kunci: "produk",
  nama: "Barang",
  kode: "PRD-",
  petunjuk: "Cari nama, kategori, atau rak...",

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
  <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok} · rak ${p.rak}</span></div>`,

  /* riwayat pesanan merujuk id produk — menghapusnya akan merusak riwayat */
  cek: (p) => (db.pesanan.some((o) => o.produk === p.id)
    ? `"${p.nama}" sudah ada di riwayat pesanan. Kosongkan stoknya saja bila barang tidak dijual lagi.`
    : "")
});
