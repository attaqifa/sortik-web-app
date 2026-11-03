/* Masuk & daftar — auth lokal. Sesi = id profil di localStorage. */

/* buka halaman masuk/daftar selalu mengakhiri sesi sebelumnya */
keluarLokal();

const PERAN_MASUK = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };

/* branding toko: diambil dari database lokal; halaman login tidak memuat
   store.js, jadi db diambil langsung lewat muatDB() (atau tetap "SORTIK"). */
const awalMasuk = muatDB();
const tokoMasuk = (Array.isArray(awalMasuk.toko) ? awalMasuk.toko[0] : awalMasuk.toko) || {};
document.querySelectorAll(".brand").forEach((brand) => {
  const h1 = brand.querySelector("h1");
  if (!h1) return;
  h1.textContent = tokoMasuk.nama || "SORTIK";
  const co = document.createElement("i");
  co.className = "co";
  co.textContent = "with SORTIK";
  h1.append(co);
});

const TUJUAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };

/* pesan galat inline di bawah form */
const galat = (teks) => {
  const x = document.getElementById("galatMasuk");
  if (!x) return;
  x.textContent = teks;
  x.hidden = false;
  x.scrollIntoView({ block: "nearest" });
};
const sembunyiGalat = () => {
  const x = document.getElementById("galatMasuk");
  if (x) x.hidden = true;
};

document.querySelectorAll("form").forEach((f) => {
  f.onsubmit = async (e) => {
    e.preventDefault();
    sembunyiGalat();
    const data = f.elements;

    /* ---------- daftar: buat akun pembeli baru di database lokal ----------
       Peran selalu "pembeli" — staf/admin ditetapkan pemilik lewat data awal. */
    if (data.konfirmasi) {
      if (data.password.value.length < 8)
        return galat("Kata sandi minimal 8 karakter.");
      if (data.password.value !== data.konfirmasi.value)
        return galat("Kata sandi belum sama — ulangi dengan benar.");
      const { error } = daftarLokal(data.email.value.trim(), data.nama.value.trim());
      if (error) return galat(error);
      location.href = TUJUAN.pembeli;
      return;
    }

    /* ---------- masuk: email dicek dari daftar pengguna lokal ---------- */
    const { data: profil, error } = masukLokal(data.email.value.trim());
    if (error) return galat(error);

    const peranPilih = data.role ? data.role.value : profil.role;
    if (profil.role !== peranPilih) {
      keluarLokal();
      return galat(`Email ini terdaftar sebagai ${PERAN_MASUK[profil.role] || profil.role} — pilih peran itu di atas.`);
    }

    location.href = TUJUAN[profil.role] || TUJUAN.pembeli;
  };
});

/* ikon kartu peran (daftar tak punya — aman kosong) */
if (window.lucide) lucide.createIcons();

/* kolom sandi: lihat/sembunyi + catatan Caps Lock */
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

/* daftar: dua sandi harus sama */
const konfirmasi = document.getElementById("konfirmasi");
if (konfirmasi) {
  const utama = document.getElementById("password");
  const samakan = () => {
    konfirmasi.setCustomValidity(
      konfirmasi.value && konfirmasi.value !== utama.value ? "Kata sandi belum sama" : ""
    );
  };
  konfirmasi.addEventListener("input", samakan);
  utama.addEventListener("input", () => konfirmasi.setCustomValidity(""));
}
