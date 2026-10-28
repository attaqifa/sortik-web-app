/* Masuk & daftar — kredensial dicek ke pengguna tersimpan (sandi di-hash).
   ui.js/store.js tidak dimuat di sini: data pengguna dibaca langsung dari
   localStorage (awalan sortik2:), sama seperti pola tokoMasuk di bawah. */

const KUNCI_MASUK = "sortik2:";
const bacaMasuk = (k, d) => {
  try { return JSON.parse(localStorage.getItem(KUNCI_MASUK + k)) ?? d; }
  catch { return d; }
};
const simpanMasuk = (k, v) => {
  try { localStorage.setItem(KUNCI_MASUK + k, JSON.stringify(v)); } catch {}
};

/* keluar: membuka halaman masuk/daftar selalu mengakhiri sesi sebelumnya */
try { localStorage.removeItem(KUNCI_MASUK + "sesi"); } catch {}

const penggunaMasuk = bacaMasuk("pengguna", db.pengguna);
const PERAN_MASUK = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };

/* branding toko: logo perusahaan (bila diunggah admin) + nama perusahaan
   dengan "with SORTIK" di sebelahnya. */
const tokoMasuk = bacaMasuk("toko", db.toko);
document.querySelectorAll(".brand").forEach((brand) => {
  const h1 = brand.querySelector("h1");
  if (!h1) return;
  /* logo hanya bila admin mengunggahnya — berkas JPEG bawaan putih di atas
     putih (transparensinya hilang saat diekspor JPEG), jadi tak dipakai */
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

const masukSebagai = (u) => {
  try { localStorage.setItem(KUNCI_MASUK + "sesi", String(u.id)); } catch {}
  location.href = TUJUAN[u.role] || TUJUAN.pembeli;
};

document.querySelectorAll("form").forEach((f) => {
  f.onsubmit = (e) => {
    e.preventDefault();
    sembunyiGalat();
    const data = f.elements;

    /* ---------- daftar: buat akun pembeli baru ---------- */
    if (data.konfirmasi) {
      const nama = data.nama.value.trim();
      const email = data.email.value.trim().toLowerCase();
      const sandi = data.password.value;
      if (sandi !== data.konfirmasi.value) return galat("Kata sandi belum sama — ulangi dengan benar.");
      if (penggunaMasuk.some((u) => u.email.toLowerCase() === email))
        return galat("Email sudah terdaftar — silakan masuk di halaman Masuk.");
      const baru = {
        id: Math.max(0, ...penggunaMasuk.map((u) => u.id)) + 1,
        nama, email, role: "pembeli", status: "aktif",
        telepon: "", alamat: "", avatar: "", ikon: "🧑",
        sandi: sandiHash(sandi)
      };
      penggunaMasuk.push(baru);
      simpanMasuk("pengguna", penggunaMasuk);
      masukSebagai(baru);
      return;
    }

    /* ---------- masuk: email + sandi + peran harus cocok ---------- */
    const email = data.email.value.trim().toLowerCase();
    const u = penggunaMasuk.find((x) => x.email.toLowerCase() === email);
    if (!u) return galat("Email tidak terdaftar — daftar dulu lewat tautan di bawah.");
    if (u.status !== "aktif") return galat("Akun ini nonaktif — hubungi admin toko.");
    if (!u.sandi || sandiHash(data.password.value) !== u.sandi) return galat("Kata sandi salah.");
    const peranPilih = data.role ? data.role.value : u.role;
    if (u.role !== peranPilih)
      return galat(`Email ini terdaftar sebagai ${PERAN_MASUK[u.role] || u.role} — pilih peran itu di atas.`);
    masukSebagai(u);
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
