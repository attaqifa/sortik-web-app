/* Pengaturan toko, profil toko satu form; kategori dikelola di halaman Kelola Barang. */

const t = db.toko;
el("cadangUnduh").onclick = () => {
  const raw = localStorage.getItem(KUNCI_DB);
  if (!raw) return notif("Tidak ada data untuk dicadangkan.");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  a.download = "sortik-cadangan.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
el("cadangPulih").onclick = async () => {
  const file = el("cadangFile").files[0];
  if (!file) return notif("Pilih berkas cadangan terlebih dahulu.");
  let data;
  try { data = JSON.parse(await file.text()); } catch { return notif("Berkas cadangan tidak dapat dibaca."); }
  const unik = (daftar) => new Set(daftar.map((x) => x.id)).size === daftar.length;
  const angka = (n) => Number.isFinite(n) && n >= 0;
  const valid = data && Array.isArray(data.toko) && Array.isArray(data.pengguna)
    && data.pengguna.every((u) => u && typeof u.id === "string" && typeof u.nama === "string"
      && ["pembeli", "staff", "admin"].includes(u.role) && ["aktif", "nonaktif"].includes(u.status))
    && unik(data.pengguna) && data.toko.every((x) => x && typeof x.id === "string" && typeof x.nama === "string"
      && [x.alamat, x.jam, x.wa].every((v) => typeof v === "string") && angka(x.ongkir)
      && Array.isArray(x.produk) && x.produk.every((p) => p && Number.isInteger(p.id) && typeof p.nama === "string"
        && Number.isInteger(p.stok) && angka(p.stok) && angka(p.harga) && angka(p.diskon) && p.diskon <= 100
        && (p.galeri == null || (Array.isArray(p.galeri) && p.galeri.every((g) => typeof g === "string")))) && unik(x.produk)
      && Array.isArray(x.pesanan) && x.pesanan.every((o) => o && Number.isInteger(o.id) && Number.isInteger(o.produk)
        && Number.isInteger(o.jumlah) && o.jumlah > 0 && typeof o.tanggal === "string"
        && ["Menunggu", "Diproses", "Siap", "Selesai", "Dibatalkan"].includes(o.status)
        && typeof o.lunas === "boolean" && (o.harga == null || angka(o.harga)) && (o.ongkir == null || angka(o.ongkir))) && unik(x.pesanan)
      && Array.isArray(x.kategori) && x.kategori.every((k) => k && typeof k.id === "string" && typeof k.nama === "string") && unik(x.kategori)
      && x.rak && Array.isArray(x.rak.lantai) && x.rak.lantai.length > 0
      && x.rak.lantai.every((l) => l && typeof l.nama === "string" && Array.isArray(l.daftar) && (l.area == null || Array.isArray(l.area)))
      && Array.isArray(x.pesan) && x.pesan.every((m) => m && typeof m.teks === "string")
      && x.keuangan && Array.isArray(x.keuangan.pengeluaran)
      && x.keuangan.pengeluaran.every((p) => p && Number.isInteger(p.id) && angka(p.jumlah) && typeof p.tanggal === "string")
      && Array.isArray(x.rekening) && x.rekening.every((r) => r && [r.bank, r.nomor, r.atasNama].every((v) => typeof v === "string"))) && unik(data.toko);
  if (!valid) return notif("Format cadangan tidak valid atau tidak lengkap.");
  if (!await konfirmasi("Pulihkan cadangan?", "Seluruh data pada browser ini akan diganti. Unduh cadangan data saat ini terlebih dahulu.", "Ya, pulihkan")) return;
  if (versiData !== localStorage.getItem(KUNCI_DB)) return notif("Data berubah di tab lain. Muat ulang sebelum memulihkan cadangan.");
  const gagal = simpanDB(data);
  if (gagal) return notif("Gagal memulihkan: " + gagal.message);
  simpanSesi(null);
  location.href = "../auth/login.html";
};
el("t-nama").value = t.nama;
el("t-alamat").value = t.alamat;
el("t-jam").value = t.jam;
el("t-wa").value = t.wa;
el("t-ongkir").value = t.ongkir;
el("t-rek").value = t.rekening.map((r) => `${r.bank} | ${r.nomor} | ${r.atasNama}`).join("\n");

/* logo perusahaan: pratinjau + unggah/hapus, data URL kecil (maks 180px) di db.toko.logo */
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
    isi("t-info", "Logo tersimpan, tampil di sidebar admin & staff.");
    notif("Logo toko diperbarui.");
  } catch {
    isi("t-info", "Gagal membaca gambar, coba berkas lain.");
  }
};

el("t-logoHapus").onclick = () => {
  if (!t.logo) return;
  t.logo = "";
  simpan("toko");
  el("t-logo").value = "";
  pratinjauLogo();
  gambarSidebar();
  isi("t-info", "Logo dihapus, kembali ke logo SORTIK.");
};

/* foto toko: sampul kartu di Jelajah Toko, unggahan atau tautan gambar */
const pratinjauFoto = () => isi("fotoPratinjau", t.foto
  ? `<img src="${t.foto}" alt="Foto toko">`
  : `<span class="ikon" data-lucide="image"></span>Belum ada foto`);
pratinjauFoto();
el("t-fotoUrl").value = t.foto.startsWith("data:") ? "" : t.foto;

el("t-foto").onchange = async () => {
  const berkas = el("t-foto").files[0];
  if (!berkas) return;
  try {
    t.foto = await bacaGambar(berkas, 1200);
    simpan("toko");
    el("t-fotoUrl").value = "";
    pratinjauFoto();
    isi("t-info", "Foto toko tersimpan, tampil di halaman Jelajah Toko.");
    notif("Foto toko diperbarui.");
  } catch {
    isi("t-info", "Gagal membaca gambar, coba berkas lain.");
  }
};

el("t-fotoUrl").onchange = () => {
  t.foto = el("t-fotoUrl").value.trim();
  simpan("toko");
  el("t-foto").value = "";
  pratinjauFoto();
  isi("t-info", t.foto ? "Tautan foto tersimpan, tampil di Jelajah Toko." : "Foto toko dikosongkan.");
};

el("t-fotoHapus").onclick = () => {
  if (!t.foto) return;
  t.foto = "";
  simpan("toko");
  el("t-foto").value = "";
  el("t-fotoUrl").value = "";
  pratinjauFoto();
  isi("t-info", "Foto toko dihapus.");
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
  isi("t-info", "Tersimpan, langsung dipakai halaman checkout pembeli.");
};
