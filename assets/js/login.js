/* Masuk & daftar, auth lokal. Sesi = id profil di localStorage. */

/* buka halaman masuk/daftar selalu mengakhiri sesi sebelumnya */
keluarLokal();

const PERAN_MASUK = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
/* tujuan setelah masuk/daftar; halaman tanpa toko otomatis dialihkan oleh store.js */
const TUJUAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };
const TUJUAN_DAFTAR = {
  pembeli: "../user/jelajah.html",
  staff: "../staff/toko.html",
  admin: "../admin/toko.html"
};

/* pesan galat inline di bawah form */
const galat = (teks, f) => {
  const x = (f && f.querySelector(".galat")) || document.querySelector(".galat");
  if (!x) return;
  x.textContent = teks;
  x.hidden = false;
  x.scrollIntoView({ block: "nearest" });
};
const sembunyiGalat = () => {
  document.querySelectorAll(".galat").forEach((x) => (x.hidden = true));
};

/* halaman Punya Toko: pindah antara mode Daftar dan Masuk */
const wadahDaftar = document.getElementById("modeDaftar");
const wadahMasuk = document.getElementById("modeMasuk");
if (wadahDaftar && wadahMasuk) {
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.onclick = () => {
      const daftar = b.dataset.mode === "daftar";
      document.querySelectorAll("[data-mode]").forEach((x) =>
        x.classList.toggle("on", x.dataset.mode === b.dataset.mode));
      wadahDaftar.hidden = !daftar;
      wadahMasuk.hidden = daftar;
      sembunyiGalat();
    };
  });
}

/* masuk & daftar */
document.querySelectorAll("form").forEach((f) => {
  f.onsubmit = async (e) => {
    e.preventDefault();
    sembunyiGalat();
    const data = f.elements;

    /* daftar: buat akun baru; peran dipilih dari kartu peran (bila ada) */
    if (data.konfirmasi) {
      const peranBaru = f.dataset.peran || (data.role ? data.role.value : "pembeli");
      if (data.password.value.length < 8)
        return galat("Kata sandi minimal 8 karakter.", f);
      if (data.password.value !== data.konfirmasi.value)
        return galat("Kata sandi belum sama, ulangi dengan benar.", f);
      const { error } = await daftarLokal(
        data.email.value.trim(),
        data.nama ? data.nama.value.trim() : "",
        data.password.value,
        peranBaru
      );
      if (error) return galat(error, f);
      /* tanpa toko: admin ke Kelola Toko, staff ke Pilih Toko, pembeli ke Jelajah */
      location.href = TUJUAN_DAFTAR[peranBaru] || TUJUAN_DAFTAR.pembeli;
      return;
    }

    /* masuk: email dicek dari daftar pengguna lokal */
    const { data: profil, error } = await masukLokal(data.email.value.trim(), data.password.value);
    if (error) return galat(error, f);

    const peranPilih = data.role ? data.role.value : profil.role;
    if (profil.role !== peranPilih) {
      keluarLokal();
      return galat(`Email ini terdaftar sebagai ${PERAN_MASUK[profil.role] || profil.role}, pilih peran itu di atas.`, f);
    }

    if (profil.role === "pembeli" && bacaToko() && new URLSearchParams(location.search).get("kembali") === "checkout") {
      const kunciTamu = "sortik2:keranjang:" + bacaToko();
      const kunciAkun = kunciTamu + ":akun:" + profil.id;
      try {
        const tamu = JSON.parse(localStorage.getItem(kunciTamu) || "[]");
        const akun = JSON.parse(localStorage.getItem(kunciAkun) || "[]");
        if (Array.isArray(tamu) && Array.isArray(akun) && tamu.length) {
          tamu.forEach((barang) => {
            const ada = akun.find((x) => x.produk === barang.produk);
            if (ada) ada.jumlah += barang.jumlah;
            else akun.push(barang);
          });
          localStorage.setItem(kunciAkun, JSON.stringify(akun));
          localStorage.removeItem(kunciTamu);
        }
      } catch { galat("Keranjang pengunjung belum dapat digabungkan. Periksa penyimpanan browser.", f); return; }
    }

    /* pembeli yang belum pernah memilih toko diarahkan ke Jelajah Toko */
    if (profil.role === "pembeli" && !bacaToko()) {
      location.href = "../user/jelajah.html";
      return;
    }
    location.href = profil.role === "pembeli" && new URLSearchParams(location.search).get("kembali") === "checkout" ? "../user/checkout.html" : (TUJUAN[profil.role] || TUJUAN.pembeli);
  };
});

/* ikon kartu peran (daftar tak punya, aman kosong) */
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

/* daftar: dua sandi harus sama, dicek per form (daftar pembeli & Punya Toko) */
document.querySelectorAll("form").forEach((f) => {
  const utama = f.elements.password;
  const konf = f.elements.konfirmasi;
  if (!utama || !konf) return;
  const samakan = () => {
    konf.setCustomValidity(
      konf.value && konf.value !== utama.value ? "Kata sandi belum sama" : ""
    );
  };
  konf.addEventListener("input", samakan);
  utama.addEventListener("input", () => konf.setCustomValidity(""));
});
