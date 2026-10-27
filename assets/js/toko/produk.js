/* Kelola barang (staff & admin) — form di sini, logika di mesin kelola. */

kelola({
  wadah: "kelola",
  kunci: "produk",
  nama: "Barang",
  kode: "PRD-",
  petunjuk: "Cari nama, kategori, atau rak...",

  /* filter cepat kondisi stok */
  chips: {
    opsi: [["", "Semua"], ["menipis", "Stok menipis (≤ 3)"], ["habis", "Stok habis"]],
    terapkan: (p, s) => s === "menipis" ? p.stok > 0 && p.stok <= 3 : p.stok < 1
  },

  kolom: [
    ["nama", "Nama barang", "text"],
    ["kategori", "Kategori", "pilih", () => db.kategori.map((k) => [k.id, k.nama])],
    ["harga", "Harga (Rp)", "angka"],
    ["stok", "Stok", "angka"],
    ["rak", "Rak", "pilih", () => semuaRak().map((r) => [r, labelRak(r)])],
    ["foto", "Foto barang (tautan/unggah)", "foto"],
    ["galeri", "Foto detail (tautan/unggah)", "galeri"],
    ["deskripsi", "Deskripsi", "area"]
  ],

  cari: (p) => `${p.nama} ${kat(p)} ${p.rak}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),
  baris: (p) => `<div class="thumb">${fotoHTML(p)}</div>
  <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok} · rak ${p.rak}</span>
    <div class="rowinfo">${p.stok < 1
      ? `<span class="tag habis">Stok habis</span>`
      : p.stok <= 3 ? `<span class="tag menipis">Stok menipis</span>` : ""}</div></div>`,

  /* riwayat pesanan merujuk id produk — menghapusnya akan merusak riwayat */
  cek: (p) => (db.pesanan.some((o) => o.produk === p.id)
    ? `"${p.nama}" sudah ada di riwayat pesanan. Kosongkan stoknya saja bila barang tidak dijual lagi.`
    : "")
});
