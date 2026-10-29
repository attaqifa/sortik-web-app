/* Akun — profil, foto, dan kata sandi. Dipakai pembeli, staff, dan admin
   (halaman akun.html di masing-masing folder; peran menentukan detail).
   Perubahan hanya menyangkut AKUN PRIBADI: nama/telepon/alamat/ikon/avatar
   disimpan ke tabel profil, kata sandi ke Supabase Auth. Data toko tetap
   dikelola lewat Supabase Dashboard. */

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

el("a-simpan").onclick = async () => {
  if (!u.id) return notif("Masuk dulu dengan akun Anda untuk mengubah profil.");
  const nama = el("a-nama").value.trim();
  if (!nama) return el("a-nama").focus();

  const perubahan = {
    nama,
    telepon: el("a-telepon").value.trim(),
    alamat: el("a-alamat").value.trim(),
    ikon: el("a-ikon").value.trim(),
    avatar
  };

  const tombol = el("a-simpan");
  tombol.disabled = true;
  const { error } = await sb.from("profil").update(perubahan).eq("id", u.id);
  tombol.disabled = false;
  if (error) return notif("Gagal menyimpan profil: " + error.message);

  Object.assign(u, perubahan);
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

el("a-sandisimpan").onclick = async () => {
  if (!u.id) return notif("Masuk dulu dengan akun Anda untuk mengubah kata sandi.");
  const sandi = el("a-sandi").value;
  if (sandi.length < 8) return notif("Kata sandi minimal 8 karakter.");
  if (sandi !== el("a-sandi2").value) return notif("Ulangi kata sandi belum sama.");

  const tombol = el("a-sandisimpan");
  tombol.disabled = true;
  const { error } = await sb.auth.updateUser({ password: sandi });
  tombol.disabled = false;
  if (error) return notif("Gagal mengubah kata sandi: " + error.message);

  el("a-sandi").value = "";
  el("a-sandi2").value = "";
  notif("Kata sandi diperbarui");
};
