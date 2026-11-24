/* Kelola barang (staff & admin) — form di sini, logika di mesin kelola. */

kelola({
  wadah: "kelola",
  kunci: "produk",
  dasar: "/produk",
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
    ["diskon", "Diskon (%) — 0 = tanpa promo", "angka"],
    ["stok", "Stok", "angka"],
    ["rak", "Rak", "pilih", () => semuaRak().map((r) => [r, labelRak(r)])],
    ["foto", "Foto barang (tautan/unggah)", "foto"],
    ["galeri", "Foto detail (tautan/unggah)", "galeri"],
    ["deskripsi", "Deskripsi", "area"]
  ],

  /* kirim stok saat form dibuka: server hanya menerapkan selisihnya, jadi
     pesanan yang masuk selama form terbuka tidak tertimpa */
  siapkan: (data, lama) => (lama ? { ...data, stokLama: lama.stok } : data),

  cari: (p) => `${p.nama} ${kat(p)} ${p.rak}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),
  baris: (p) => `<div class="thumb">${p.diskon ? `<span class="ptanda">−${p.diskon}%</span>` : ""}${fotoHTML(p)}</div>
  <div><b>${esc(p.nama)}</b><span>${esc(kat(p))} · ${rp(hargaJual(p))}${p.diskon ? ` <s>${rp(p.harga)}</s>` : ""} · stok ${p.stok} · rak ${esc(p.rak)}</span>
    <div class="rowinfo">${p.stok < 1
      ? `<span class="tag habis">Stok habis</span>`
      : p.stok <= 3 ? `<span class="tag menipis">Stok menipis</span>` : ""}</div></div>`
});

/* kategori barang — id = slug nama (dibuat server), ganti nama tidak memutus barang */

kelola({
  wadah: "kategori",
  kunci: "kategori",
  dasar: "/kategori",
  nama: "Kategori",
  petunjuk: "Cari nama kategori...",
  kolom: [["nama", "Nama kategori", "text"], ["lucide", "Ikon kategori", "pilih", () => IKON_KATEGORI]],
  cari: (k) => k.nama,
  urut: (a, b) => a.nama.localeCompare(b.nama),

  baris: (k) => `<div class="thumb">${ikonKategori(k)}</div>
  <div><b>${esc(k.nama)}</b><span>kode: ${esc(k.id)} · dipakai ${db.produk.filter((p) => p.kategori === k.id).length} barang</span></div>`
});
