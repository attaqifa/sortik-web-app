/* Pengaturan toko — profil toko satu form; kategori dikelola di halaman Kelola Barang. */

const t = db.toko;
el("t-nama").value = t.nama;
el("t-alamat").value = t.alamat;
el("t-jam").value = t.jam;
el("t-wa").value = t.wa;
el("t-ongkir").value = t.ongkir;
el("t-rek").value = t.rekening.map((r) => `${r.bank} | ${r.nomor} | ${r.atasNama}`).join("\n");

/* logo perusahaan: pratinjau + unggah/hapus — data URL kecil (maks 180px) di db.toko.logo */
const pratinjauLogo = () => isi("logoPratinjau", t.logo
  ? `<img src="${urlGambar(t.logo)}" alt="Logo toko">`
  : `<span class="ikon" data-lucide="image"></span>Belum ada logo`);
pratinjauLogo();

el("t-logo").onchange = async () => {
  const berkas = el("t-logo").files[0];
  if (!berkas) return;
  try {
    const sebelum = t.logo;
    t.logo = await bacaGambar(berkas, 180);
    if (!await simpan("toko")) { t.logo = sebelum; return; }
    pratinjauLogo();
    gambarSidebar();
    isi("t-info", "✓ Logo tersimpan — tampil di sidebar admin & staff.");
    notif("Logo toko diperbarui.");
  } catch {
    isi("t-info", "⚠ Gagal membaca gambar — coba berkas lain.");
  }
};

el("t-logoHapus").onclick = async () => {
  if (!t.logo) return;
  const sebelum = t.logo;
  t.logo = "";
  if (!await simpan("toko")) { t.logo = sebelum; return; }
  el("t-logo").value = "";
  pratinjauLogo();
  gambarSidebar();
  isi("t-info", "Logo dihapus — kembali ke logo SORTIK.");
};

el("t-simpan").onclick = async () => {
  const sebelumnya = { ...db.toko };
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
  if (!await simpan("toko")) { Object.assign(db.toko, sebelumnya); return; }
  isi("t-info", "✓ Tersimpan — langsung dipakai halaman checkout pembeli.");
};
