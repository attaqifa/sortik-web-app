/* Akun saya — ubah profil, avatar, alamat pengiriman, dan kata sandi.
   Khusus pelanggan (akun.html hanya ada di folder user/). */

const u = db.akun;
let avatar = u.avatar || "";

function renderAvatar() {
  isi("a-avatar", avatar ? `<img src="${avatar}" alt="Foto profil">` : (u.ikon || "🧑"));
  el("a-hapusfoto").hidden = !avatar;
}

el("a-nama").value = u.nama || "";
el("a-email").value = u.email || "";
el("a-telepon").value = u.telepon || "";
el("a-alamat").value = u.alamat || "";
el("a-ikon").value = u.ikon || "";
renderAvatar();

el("a-foto").onchange = async (e) => {
  const berkas = e.target.files[0];
  if (!berkas) return;
  try {
    avatar = await bacaGambar(berkas, 400);
    renderAvatar();
  } catch {
    notif("Gagal membaca gambar. Coba file JPG atau PNG.");
  }
  e.target.value = "";
};

el("a-hapusfoto").onclick = () => { avatar = ""; renderAvatar(); };

el("a-simpan").onclick = () => {
  const nama = el("a-nama").value.trim();
  if (!nama) return el("a-nama").focus();
  const lama = u.nama;

  Object.assign(u, {
    nama,
    email: el("a-email").value.trim(),
    telepon: el("a-telepon").value.trim(),
    alamat: el("a-alamat").value.trim(),
    avatar,
    ikon: el("a-ikon").value.trim()
  });

  /* riwayat pesanan memakai nama pembeli sebagai kunci — ikut diperbarui saat nama berubah */
  if (nama !== lama) db.pesanan.forEach((o) => { if (o.pembeli === lama) o.pembeli = nama; });

  simpan("pengguna");
  if (nama !== lama) simpan("pesanan");
  gambarSidebar();
  notif("Profil tersimpan");
};

el("a-sandisimpan").onclick = () => {
  const sandi = el("a-sandi").value;
  if (sandi.length < 8) return notif("Kata sandi minimal 8 karakter.");
  if (sandi !== el("a-sandi2").value) return notif("Ulangi kata sandi belum sama.");
  u.sandi = sandi;
  simpan("pengguna");
  el("a-sandi").value = "";
  el("a-sandi2").value = "";
  notif("Kata sandi diperbarui");
};
