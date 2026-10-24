/* SORTIK — penyimpanan browser, sesi, dan sidebar.
   Satu koleksi = satu endpoint: /api/<koleksi>, /api/<koleksi>/<id>.
   Saat backend siap, cukup ganti isi `baca()`/`simpan()` dengan panggilan API. */

/* ---------- penyimpanan ---------- */
const VERSI = "sortik2:";
const KOLEKSI = ["kategori", "toko", "rak", "produk", "pesanan", "pengguna"];
const baca = (k, d) => { try { return JSON.parse(localStorage.getItem(VERSI + k)) ?? d; } catch { return d; } };
const simpan = (k) => {
  try {
    localStorage.setItem(VERSI + k, JSON.stringify(db[k]));
  } catch {
    notif("Penyimpanan browser penuh — hapus foto lama atau gunakan foto yang lebih kecil.");
  }
};

/* data contoh dipakai untuk sekali mengisi foto/ikon pada data lama */
const contohProduk = db.produk.map((p) => ({ ...p }));
const contohKategori = db.kategori.map((k) => ({ ...k }));
KOLEKSI.forEach((k) => (db[k] = baca(k, db[k])));

/* Kategori lama yang tersimpan di browser hanya punya emoji; lengkapi nama ikon
   Lucide-nya dari data contoh supaya tampil sebagai ikon garis. Cukup sekali. */
let ikonBaru = false;
db.kategori.forEach((k) => {
  const c = contohKategori.find((x) => x.id === k.id);
  if (!k.lucide && c && c.lucide) { k.lucide = c.lucide; ikonBaru = true; }
});
if (ikonBaru) simpan("kategori");

/* Produk lama yang tersimpan di browser (foto masih kosong) diisi sekali dari
   data contoh, lalu penanda dibuat agar penghapusan foto oleh admin tetap
   dihormati pada kunjungan berikutnya. */
const TANDA_FOTO = VERSI + "foto-awal";
if (!localStorage.getItem(TANDA_FOTO)) {
  let berubah = false;
  db.produk.forEach((p) => {
    const c = contohProduk.find((x) => x.id === p.id) || {};
    if (c.foto && !p.foto) { p.foto = c.foto; berubah = true; }
  });
  if (berubah) simpan("produk");
  try { localStorage.setItem(TANDA_FOTO, "1"); } catch {}
}

/* ---------- keranjang ---------- */
/* { produk: id, jumlah } — harga selalu dihitung dari db.produk */
const keranjang = baca("keranjang", []);
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const simpanKeranjang = () => {
  localStorage.setItem(VERSI + "keranjang", JSON.stringify(keranjang));
  const badge = el("jml");
  if (badge) badge.textContent = jmlKeranjang() || "";
};

/* ---------- sesi ---------- */
/* Peran dibaca dari folder halaman; dengan backend: GET /api/sesi.
   Akun yang sedang masuk = baris `pengguna` dengan peran sesuai folder.
   `sortik2:sesi` menyimpan id-nya; bila kosong dipilih yang pertama. */
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";

const idSesi = +baca("sesi", 0);
db.akun = db.pengguna.find((u) => u.id === idSesi && u.role === peran)
  || db.pengguna.find((u) => u.role === peran)
  || { id: 0, nama: "Pengguna", role: peran, email: "", telepon: "", alamat: "", avatar: "", ikon: "🧑" };
db.akun.peran = peran;

const labelPeran = (r) => PERAN[r] || r;
const inisial = (nama) => String(nama || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const avatarHTML = (u) => (u.avatar ? `<img src="${u.avatar}" alt="">` : (u.ikon || inisial(u.nama)));
const pesananku = () => db.pesanan.filter((o) => o.pembeli === db.akun.nama);

/* ---------- sidebar ---------- */
/* [nama ikon Lucide, label desktop, href, ekstra, label mobile] */
const MENU = {
  pembeli: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["search", "Cari Produk & Rak", "cari.html", "", "Cari"],
    ["shopping-cart", "Keranjang", "checkout.html", `<b class="badge" id="jml">${jmlKeranjang() || ""}</b>`, "Keranjang"],
    ["clipboard-list", "Pesan & Booking", "pesan.html", "", "Pesan"],
    ["history", "Riwayat", "riwayat.html", "", "Riwayat"],
    ["user-round", "Akun Saya", "akun.html", "", "Akun"]
  ],
  staff: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", "", "Pesanan"]
  ],
  admin: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    /* admin mewarisi seluruh menu operasional staff — halamannya sendiri,
       tetapi memakai skrip yang sama di assets/js/toko/ */
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", "", "Pesanan"],
    ["users", "Kelola Pengguna", "pengguna.html", "", "Pengguna"],
    ["settings", "Pengaturan Toko", "pengaturan.html", "", "Toko"]
  ]
};

/* ---------- ikon (Lucide via CDN) ----------
   Sidebar & komponen memakai ikon garis Lucide. Fungsi gambarIkon() ada di
   ui.js (dipanggil otomatis oleh isi()); di sini cukup memuat skripnya sekali.
   Bila offline, menu tetap tampil (hanya tanpa ikon). */
const LUCIDE = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
function muatLucide() {
  if (window.lucide) return gambarIkon();
  const s = document.createElement("script");
  s.src = LUCIDE;
  s.onload = gambarIkon;
  document.head.append(s);
}

function gambarSidebar() {
  const berkas = location.pathname.split("/").pop() || "index.html";
  isi("side", `<a class="logo" href="index.html">
  <img src="../assets/img/SortikLogo.jpeg" alt="" width="34"><b>SORTIK</b>
</a>
<nav>${MENU[peran].map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}"><span class="ikon" data-lucide="${ikon}"></span><span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</nav>
<div class="me"><div class="avatar">${avatarHTML(db.akun)}</div><div class="siapa"><b>${db.akun.nama}</b><span>${labelPeran(db.akun.role)}</span></div>
<a class="keluar" href="../auth/login.html" title="Keluar"><span class="ikon" data-lucide="log-out"></span><span class="lengkap">Keluar</span></a></div>`);
}
gambarSidebar();
muatLucide();
