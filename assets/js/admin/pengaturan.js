/* SORTIK — admin: pengaturan toko + kategori produk
   Bagian profil toko ditulis langsung di sini (satu form, satu tombol), bagian
   kategori memakai mesin `kelola` karena butuh daftar + tambah/ubah/hapus.
   DB: PUT /api/toko, dan POST/PUT/DELETE /api/kategori lewat mesin kelola. */

/* ---------- profil & pembayaran toko ---------- */
const t = db.toko;
el("t-nama").value = t.nama;
el("t-alamat").value = t.alamat;
el("t-jam").value = t.jam;
el("t-wa").value = t.wa;
el("t-ongkir").value = t.ongkir;

/* rekening disimpan satu baris per rekening: "Bank | Nomor | Atas Nama"
   (di database: tabel rekening, satu baris per rekening) */
el("t-rek").value = t.rekening.map((r) => `${r.bank} | ${r.nomor} | ${r.atasNama}`).join("\n");

el("t-simpan").onclick = () => {
  Object.assign(db.toko, {
    nama: el("t-nama").value.trim() || t.nama,
    alamat: el("t-alamat").value.trim(),
    jam: el("t-jam").value.trim(),
    wa: el("t-wa").value.replace(/\D/g, ""),   /* hanya angka: dipakai link wa.me */
    ongkir: +el("t-ongkir").value || 0,
    rekening: el("t-rek").value.split("\n").map((b) => b.split("|").map((x) => x.trim()))
      .filter(([bank]) => bank).map(([bank, nomor = "", atasNama = ""]) => ({ bank, nomor, atasNama }))
  });
  simpan("toko");
  isi("t-info", "✓ Tersimpan — langsung dipakai halaman checkout pembeli.");
};

/* ---------- kategori produk ---------- */
/* id kategori = nama yang dijadikan kode (slug). Nama boleh diubah kapan saja
   tanpa mengubah id, supaya barang yang merujuk id itu tidak lepas. */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

kelola({
  wadah: "kategori",
  kunci: "kategori",
  nama: "Kategori",
  petunjuk: "Cari nama kategori...",
  kolom: [["nama", "Nama kategori", "text"], ["ikon", "Ikon (emoji)", "text"]],
  cari: (k) => k.nama,
  urut: (a, b) => a.nama.localeCompare(b.nama),

  /* id dibuat dari nama, bukan nomor urut — dan kategori kembar ditolak
     (kembalikan null supaya mesin kelola tidak menambah baris apa pun) */
  baru: (d) => {
    const id = slug(d.nama);
    if (db.kategori.some((k) => k.id === id)) {
      alert(`Kategori "${d.nama}" sudah ada.`);
      return null;
    }
    return { id, ...d, ikon: d.ikon || "📦" };
  },

  /* kategori yang masih dipakai barang tidak boleh dihapus */
  cek: (k) => (db.produk.some((p) => p.kategori === k.id)
    ? `Kategori "${k.nama}" masih dipakai barang — pindahkan dulu barangnya di Kelola Barang.`
    : ""),

  baris: (k) => `<div class="thumb">${k.ikon || "📦"}</div>
  <div><b>${k.nama}</b><span>kode: ${k.id} · dipakai ${db.produk.filter((p) => p.kategori === k.id).length} barang</span></div>`
});
