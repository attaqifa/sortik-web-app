/* Kelola barang (staff & admin), form di sini, logika di mesin kelola. */

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
    ["diskon", "Diskon (%), 0 = tanpa promo", "angka"],
    ["stok", "Stok", "angka"],
    ["rak", "Rak", "pilih", () => semuaRak().map((r) => [r, labelRak(r)])],
    ["foto", "Foto barang (tautan/unggah)", "foto"],
    ["galeri", "Foto detail (tautan/unggah)", "galeri"],
    ["deskripsi", "Deskripsi", "area"]
  ],

  siapkan: (d, lama) => {
    if (!Number.isInteger(d.stok) || d.stok < 0 || d.harga < 0 || d.diskon < 0 || d.diskon > 100) {
      notif("Stok harus bilangan bulat nonnegatif, harga tidak negatif, dan diskon 0–100%.");
      return null;
    }
    if (lama && d.stok < lama.stok && d.stok < stokDipesan(lama.id)) {
      notif(`Stok tidak boleh kurang dari ${stokDipesan(lama.id)} unit yang masih dipesan.`);
      return null;
    }
    if (lama && lama.stok !== d.stok) {
      const alasan = prompt("Tuliskan alasan perubahan stok:");
      if (!alasan || !alasan.trim()) { notif("Alasan perubahan stok wajib diisi."); return null; }
      alasanMutasiStok = alasan.trim();
    }
    return d;
  },

  cari: (p) => `${p.nama} ${kat(p)} ${p.rak}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),
  baris: (p) => `<div class="thumb">${p.diskon ? `<span class="ptanda">−${p.diskon}%</span>` : ""}${fotoHTML(p)}</div>
  <div><b>${p.nama}</b><span>${kat(p)} · ${rp(hargaJual(p))}${p.diskon ? ` <s>${rp(p.harga)}</s>` : ""} · stok ${p.stok} · rak ${p.rak}</span>
    <div class="rowinfo">${p.stok < 1
      ? `<span class="tag habis">Stok habis</span>`
      : p.stok <= 3 ? `<span class="tag menipis">Stok menipis</span>` : ""}</div></div>`,

  /* riwayat pesanan merujuk id produk, menghapusnya akan merusak riwayat */
  cek: (p) => (db.pesanan.some((o) => o.produk === p.id)
    ? `"${p.nama}" sudah ada di riwayat pesanan. Kosongkan stoknya saja bila barang tidak dijual lagi.`
    : "")
});

const riwayatStok = document.createElement("section");
riwayatStok.className = "card";
riwayatStok.innerHTML = `<h2>Riwayat perubahan stok</h2><div id="riwayatStok"></div>`;
el("kelola").after(riwayatStok);
function gambarRiwayatStok() {
  const riwayat = (db.toko.mutasiStok || []).slice().reverse();
  isi("riwayatStok", riwayat.length ? riwayat.slice(0, 50).map((m) => `<div class="row"><div><b>${esc(m.nama)}</b><span>${esc(m.waktu)} · ${esc(m.pelaku)} · ${esc(m.alasan || "Tidak tercatat")}</span></div><b>${m.sebelum} → ${m.sesudah}</b></div>`).join("") : "Belum ada perubahan stok tercatat.");
}
gambarRiwayatStok();
el("kelola").addEventListener("submit", () => setTimeout(gambarRiwayatStok, 0));

/* kategori barang, id = slug nama, ganti nama tidak memutus barang */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

kelola({
  wadah: "kategori",
  kunci: "kategori",
  nama: "Kategori",
  petunjuk: "Cari nama kategori...",
  kolom: [["nama", "Nama kategori", "text"], ["lucide", "Ikon kategori", "pilih", () => IKON_KATEGORI]],
  cari: (k) => k.nama,
  urut: (a, b) => a.nama.localeCompare(b.nama),

  baru: (d) => {
    const id = slug(d.nama);
    if (db.kategori.some((k) => k.id === id)) {
      alert(`Kategori "${d.nama}" sudah ada.`);
      return null;
    }
    return { id, ...d, lucide: d.lucide || "tag" };
  },

  cek: (k) => (db.produk.some((p) => p.kategori === k.id)
    ? `Kategori "${k.nama}" masih dipakai barang, pindahkan dulu barangnya ke kategori lain.`
    : ""),

  baris: (k) => `<div class="thumb">${ikonKategori(k)}</div>
  <div><b>${k.nama}</b><span>kode: ${k.id} · dipakai ${db.produk.filter((p) => p.kategori === k.id).length} barang</span></div>`
});
