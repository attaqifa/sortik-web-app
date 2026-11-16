/* Akun — profil, foto, dan kata sandi. Dipakai pembeli, staff, dan admin
   (halaman akun.html di masing-masing folder; peran menentukan detail).
   Perubahan hanya menyangkut AKUN PRIBADI: nama/telepon/alamat disimpan lewat
   PATCH /saya, foto profil lewat POST /saya/avatar. */

const u = db.akun;
let avatar = u.avatar || "";   /* alamat foto saat ini, atau data URL pratinjau foto baru */

function renderAvatar() {
  isi("a-avatar", avatar ? `<img src="${urlGambar(avatar)}" alt="Foto profil">` : esc(inisial(u.nama)));
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
const fotoBaru = () => /^data:/.test(avatar);

el("a-simpan").onclick = async () => {
  if (!u.id) return notif("Masuk dulu dengan akun Anda untuk mengubah profil.");
  const nama = el("a-nama").value.trim();
  if (!nama) return el("a-nama").focus();

  const tombol = el("a-simpan");
  tombol.disabled = true;
  let r = await api.patch("/saya", {
    nama,
    telepon: el("a-telepon").value.trim(),
    alamat: el("a-alamat").value.trim(),
    ...(avatar === "" ? { avatar: "" } : {})
  });
  if (!r.error && fotoBaru()) {
    const form = new FormData();
    form.append("berkas", dataUrlKeBlob(avatar), "avatar.jpg");
    r = await api.unggah("/saya/avatar", form);
  }
  tombol.disabled = false;
  if (r.error) return notif(r.error);

  Object.assign(u, r.data.user);
  avatar = u.avatar || "";
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
