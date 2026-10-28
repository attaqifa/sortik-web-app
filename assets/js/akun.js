/* Akun — profil, foto, dan kata sandi. Dipakai pembeli, staff, dan admin
   (halaman akun.html di masing-masing folder; peran menentukan detail). */

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
  const email = el("a-email").value.trim().toLowerCase();
  if (!nama) return el("a-nama").focus();
  if (!email) return el("a-email").focus();
  /* email unik: dipakai untuk masuk, jadi tidak boleh bentrok dengan milik orang lain */
  if (email !== (u.email || "").toLowerCase() && db.pengguna.some((x) => x.id !== u.id && (x.email || "").toLowerCase() === email))
    return notif(`Email sudah dipakai pengguna lain.`);

  const lama = u.nama;

  Object.assign(u, {
    nama,
    email: el("a-email").value.trim(),
    telepon: el("a-telepon").value.trim(),
    alamat: el("a-alamat").value.trim(),
    avatar,
    ikon: el("a-ikon").value.trim()
  });

  /* riwayat & pesanan memakai nama pembeli — ikut diperbarui saat nama berubah */
  if (u.role === "pembeli" && nama !== lama) db.pesanan.forEach((o) => { if (o.pembeli === lama) o.pembeli = nama; });

  simpan("pengguna");
  if (u.role === "pembeli" && nama !== lama) simpan("pesanan");
  gambarSidebar();
  notif("Profil tersimpan");
};

/* toggle sandi + catatan Caps Lock */
document.querySelectorAll(".sandi").forEach((kotak) => {
  const input = kotak.querySelector("input");
  kotak.querySelector(".lihat").onclick = () => {
    const terlihat = kotak.classList.toggle("terlihat");
    input.type = terlihat ? "text" : "password";
  };
  const tanda = document.createElement("span");
  tanda.className = "kaps";
  tanda.textContent = "Caps Lock menyala";
  tanda.hidden = true;
  kotak.appendChild(tanda);
  const cek = (e) => (tanda.hidden = !(e.getModifierState && e.getModifierState("CapsLock")));
  input.addEventListener("keydown", cek);
  input.addEventListener("keyup", cek);
  input.addEventListener("blur", () => (tanda.hidden = true));
});

el("a-sandisimpan").onclick = () => {
  const sandi = el("a-sandi").value;
  if (sandi.length < 8) return notif("Kata sandi minimal 8 karakter.");
  if (sandi !== el("a-sandi2").value) return notif("Ulangi kata sandi belum sama.");
  u.sandi = sandiHash(sandi); /* simpan hash, bukan teks sandinya */
  simpan("pengguna");
  el("a-sandi").value = "";
  el("a-sandi2").value = "";
  notif("Kata sandi diperbarui");
};
