/* Pengaturan toko & kategori — profil toko satu form, kategori lewat mesin kelola. */

const t = db.toko;
el("t-nama").value = t.nama;
el("t-alamat").value = t.alamat;
el("t-jam").value = t.jam;
el("t-wa").value = t.wa;
el("t-ongkir").value = t.ongkir;
el("t-rek").value = t.rekening.map((r) => `${r.bank} | ${r.nomor} | ${r.atasNama}`).join("\n");

el("t-simpan").onclick = () => {
  Object.assign(db.toko, {
    nama: el("t-nama").value.trim() || t.nama,
    alamat: el("t-alamat").value.trim(),
    jam: el("t-jam").value.trim(),
    wa: el("t-wa").value.replace(/\D/g, ""),
    ongkir: +el("t-ongkir").value || 0,
    rekening: el("t-rek").value.split("\n")
      .map((b) => b.split("|").map((x) => x.trim()))
      .filter(([bank]) => bank)
      .map(([bank, nomor = "", atasNama = ""]) => ({ bank, nomor, atasNama }))
  });
  simpan("toko");
  isi("t-info", "✓ Tersimpan — langsung dipakai halaman checkout pembeli.");
};

/* id kategori = slug nama, jadi mengubah nama tidak memutus barang yang merujuknya */
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
    ? `Kategori "${k.nama}" masih dipakai barang — pindahkan dulu barangnya di Kelola Barang.`
    : ""),

  baris: (k) => `<div class="thumb">${ikonKategori(k)}</div>
  <div><b>${k.nama}</b><span>kode: ${k.id} · dipakai ${db.produk.filter((p) => p.kategori === k.id).length} barang</span></div>`
});
