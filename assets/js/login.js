/* Masuk & daftar — Supabase Auth. Sesi disimpan otomatis oleh supabase-js. */

/* buka halaman masuk/daftar selalu mengakhiri sesi sebelumnya */
sb.auth.signOut().catch(() => {});

const PERAN_MASUK = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };

/* branding toko: diambil dari tabel toko; halaman login tidak memuat store.js,
   jadi nama toko diambil langsung dari Supabase (atau tetap "SORTIK"). */
const tokoMasuk = db.toko;
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

/* galat Supabase → bahasa pengguna */
const artiGalat = (e) => {
  const m = String(e?.message || e || "");
  if (/invalid login credentials/i.test(m)) return "Email atau kata sandi salah.";
  if (/already registered/i.test(m)) return "Email sudah terdaftar — silakan masuk di halaman Masuk.";
  if (/confirm/i.test(m)) return "Email belum dikonfirmasi — cek kotak masuk Anda.";
  return "Terjadi kesalahan: " + m;
};

document.querySelectorAll("form").forEach((f) => {
  f.onsubmit = async (e) => {
    e.preventDefault();
    sembunyiGalat();
    const data = f.elements;

    /* ---------- daftar: buat akun pembeli baru lewat Supabase Auth ----------
       Baris profil dibuat otomatis oleh trigger buat_profil_baru(); peran
       selalu "pembeli" — staf/admin ditetapkan pemilik di dashboard. */
    if (data.konfirmasi) {
      if (data.password.value.length < 8)
        return galat("Kata sandi minimal 8 karakter.");
      if (data.password.value !== data.konfirmasi.value)
        return galat("Kata sandi belum sama — ulangi dengan benar.");
      const { data: hasil, error } = await sb.auth.signUp({
        email: data.email.value.trim(),
        password: data.password.value,
        options: { data: { nama: data.nama.value.trim() } }   // dipakai trigger untuk kolom nama profil
      });
      if (error) return galat(artiGalat(error));
      if (hasil.session) location.href = TUJUAN.pembeli;       // langsung masuk (auto confirm)
      else galat("Daftar berhasil — cek email untuk konfirmasi, lalu masuk.");
      return;
    }

    /* ---------- masuk: email + sandi, peran dicek dari tabel profil ---------- */
    const { data: sesi, error } = await sb.auth.signInWithPassword({
      email: data.email.value.trim(),
      password: data.password.value
    });
    if (error) return galat(artiGalat(error));

    const { data: profil, error: errProfil } = await sb.from("profil")
      .select("nama, role, status").eq("id", sesi.user.id).single();
    if (errProfil || !profil) return galat("Profil tidak ditemukan — hubungi admin toko.");
    if (profil.status !== "aktif") return galat("Akun ini nonaktif — hubungi admin toko.");

    const peranPilih = data.role ? data.role.value : profil.role;
    if (profil.role !== peranPilih)
      return galat(`Email ini terdaftar sebagai ${PERAN_MASUK[profil.role] || profil.role} — pilih peran itu di atas.`);

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
