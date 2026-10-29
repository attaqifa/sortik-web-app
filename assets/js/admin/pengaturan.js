/* Pengaturan toko & kategori — profil toko satu form, kategori lewat mesin kelola. */

const t = db.toko;
el("t-nama").value = t.nama;
el("t-alamat").value = t.alamat;
el("t-jam").value = t.jam;
el("t-wa").value = t.wa;
el("t-ongkir").value = t.ongkir;
el("t-rek").value = t.rekening.map((r) => `${r.bank} | ${r.nomor} | ${r.atasNama}`).join("\n");

/* form baca-saja: data toko diubah di Supabase Dashboard, bukan di sini */
document.querySelectorAll(".card .form input, .card .form textarea").forEach((x) => { x.disabled = true; });

/* logo perusahaan: pratinjau + unggah/hapus — data URL kecil (maks 180px) di db.toko.logo */
const pratinjauLogo = () => isi("logoPratinjau", t.logo
  ? `<img src="${t.logo}" alt="Logo toko">`
  : `<span class="ikon" data-lucide="image"></span>Belum ada logo`);
pratinjauLogo();

el("t-logo").onchange = async () => {
  const berkas = el("t-logo").files[0];
  if (!berkas) return;
  try {
    t.logo = await bacaGambar(berkas, 180);
    simpan("toko");
    pratinjauLogo();
    gambarSidebar();
    isi("t-info", "✓ Logo tersimpan — tampil di sidebar admin & staff.");
    notif("Logo toko diperbarui.");
  } catch {
    isi("t-info", "⚠ Gagal membaca gambar — coba berkas lain.");
  }
};

el("t-logoHapus").onclick = () => {
  if (!t.logo) return;
  t.logo = "";
  simpan("toko");
  el("t-logo").value = "";
  pratinjauLogo();
  gambarSidebar();
  isi("t-info", "Logo dihapus — kembali ke logo SORTIK.");
};

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

/* id kategori = slug nama — ganti nama tidak memutus barang */
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
