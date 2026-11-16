/* Masuk & daftar — lewat API server (sesi = cookie HttpOnly dari server). */

/* buka halaman masuk/daftar selalu mengakhiri sesi sebelumnya */
api.post("/keluar");

/* branding toko dari server (sebelum terisi tetap "SORTIK") */
api.get("/toko").then(({ data }) => {
  const nama = (data && data.nama) || "SORTIK";
  document.querySelectorAll(".brand").forEach((brand) => {
    const h1 = brand.querySelector("h1");
    if (!h1) return;
    h1.textContent = nama;
    const co = document.createElement("i");
    co.className = "co";
    co.textContent = "with SORTIK";
    h1.append(co);
  });
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

    /* ---------- daftar: buat akun pembeli baru ----------
       Peran selalu "pembeli" — staf/admin ditetapkan pemilik lewat data awal. */
    if (data.konfirmasi) {
      if (data.password.value.length < 8)
        return galat("Kata sandi minimal 8 karakter.");
      if (data.password.value !== data.konfirmasi.value)
        return galat("Kata sandi belum sama — ulangi dengan benar.");
      const { data: hasil, error } = await api.post("/daftar", {
        nama: data.nama.value.trim(), email: data.email.value.trim(), sandi: data.password.value,
      });
      if (error) return galat(error);
      location.href = TUJUAN.pembeli;
      return;
    }

    /* ---------- masuk: server memeriksa sandi, peran, status akun, dan pembatas percobaan ---------- */
    const { data: hasil, error } = await api.post("/masuk", {
      email: data.email.value.trim(), sandi: data.password.value, peran: data.role ? data.role.value : undefined,
    });
    if (error) return galat(error);

    location.href = TUJUAN[hasil.user.role] || TUJUAN.pembeli;
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
