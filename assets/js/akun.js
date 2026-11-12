/* Akun — profil, foto, dan kata sandi. Dipakai pembeli, staff, dan admin
   (halaman akun.html di masing-masing folder; peran menentukan detail).
   Perubahan hanya menyangkut AKUN PRIBADI: nama/telepon/alamat/avatar
   disimpan ke baris akun di database lokal. Avatar hanya dari foto. */

const u = db.akun;
let avatar = u.avatar || "";

function renderAvatar() {
  isi("a-avatar", avatar ? `<img src="${avatar}" alt="Foto profil">` : inisial(u.nama));
  el("a-hapusfoto").hidden = !avatar;
}

el("a-nama").value = u.nama || "";
el("a-email").value = u.email || "";
el("a-telepon").value = u.telepon || "";
el("a-alamat").value = u.alamat || "";
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
    avatar
  };

  const tombol = el("a-simpan");
  tombol.disabled = true;
  const baris = db.pengguna.find((p) => p.id === u.id);
  if (!baris) { tombol.disabled = false; return notif("Akun tidak ditemukan di database lokal."); }
  Object.assign(baris, perubahan);
  const ok = await simpan("pengguna");
  tombol.disabled = false;
  if (!ok) return;

  Object.assign(u, perubahan);
  renderAvatar();
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

el("a-sandisimpan").onclick = () =>
  notif("Kata sandi diatur oleh admin toko — hubungi admin untuk menggantinya.");
