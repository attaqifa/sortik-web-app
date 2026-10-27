/* Masuk & daftar — sementara tanpa backend, peran menentukan halaman tujuan. */

/* branding toko: logo perusahaan (bila diunggah admin) + nama perusahaan
   dengan "with SORTIK" di sebelahnya. ui.js/store.js tidak dimuat di sini,
   jadi data toko disimpan dibaca langsung dari localStorage (awalan sortik2:). */
const tokoMasuk = (() => {
  try { return JSON.parse(localStorage.getItem("sortik2:toko")) || db.toko; }
  catch { return db.toko; }
})();
document.querySelectorAll(".brand").forEach((brand) => {
  const h1 = brand.querySelector("h1");
  if (!h1) return;
  if (tokoMasuk.logo && !brand.querySelector("img")) {
    const img = document.createElement("img");
    img.src = tokoMasuk.logo;
    img.alt = "";
    img.className = "brandlogo";
    h1.before(img);
  }
  h1.textContent = tokoMasuk.nama || "SORTIK";
  const co = document.createElement("i");
  co.className = "co";
  co.textContent = "with SORTIK";
  h1.append(co);
});

const TUJUAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };

document.querySelectorAll("form").forEach((f) => {
  f.onsubmit = (e) => {
    e.preventDefault();
    location.href = TUJUAN[e.target.elements.role ? e.target.elements.role.value : "pembeli"] || TUJUAN.pembeli;
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
