/* Pengaturan toko — profil toko satu form; kategori dikelola di halaman Kelola Barang.
   Semua perubahan disimpan ke server (PUT /toko); db.toko diganti dengan jawaban server. */

const t = db.toko;
el("t-nama").value = t.nama;
el("t-alamat").value = t.alamat;
el("t-jam").value = t.jam;
el("t-wa").value = t.wa;
el("t-ongkir").value = t.ongkir;
el("t-rek").value = t.rekening.map((r) => `${r.bank} | ${r.nomor} | ${r.atasNama}`).join("\n");

/* kirim seluruh profil toko; ubah = bagian yang mau diganti. Mengembalikan true bila berhasil. */
async function kirimToko(ubah = {}) {
  const r = await api.put("/toko", { ...db.toko, ...ubah });
  if (r.error) { notif(r.error); return false; }
  Object.assign(db.toko, r.data);
  return true;
}

/* logo toko: pratinjau + unggah/hapus */
const pratinjauLogo = () => isi("logoPratinjau", t.logo
  ? `<img src="${urlGambar(t.logo)}" alt="Logo toko">`
  : `<span class="ikon" data-lucide="image"></span>Belum ada logo`);
pratinjauLogo();

el("t-logo").onchange = async () => {
  const berkas = el("t-logo").files[0];
  if (!berkas) return;
  try {
    const form = new FormData();
    form.append("berkas", dataUrlKeBlob(await bacaGambar(berkas, 180)), "logo.jpg");
    const u = await api.unggah("/berkas/foto", form);
    if (u.error) return isi("t-info", "⚠ " + esc(u.error));
    if (!await kirimToko({ logo: u.data.url })) return;
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
  if (!await kirimToko({ logo: "" })) return;
  el("t-logo").value = "";
  pratinjauLogo();
  gambarSidebar();
  isi("t-info", "Logo dihapus — kembali ke logo SORTIK.");
};

el("t-simpan").onclick = async () => {
  const ok = await kirimToko({
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
  if (ok) isi("t-info", "✓ Tersimpan — langsung dipakai halaman checkout pembeli.");
};
