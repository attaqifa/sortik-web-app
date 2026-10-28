/* SORTIK — penyimpanan browser, sesi, dan sidebar.
   Satu koleksi = satu endpoint /api/<koleksi>[/<id>] — bila backend siap,
   cukup ganti baca()/simpan() dengan panggilan API. */

/* ---------- penyimpanan ---------- */
const VERSI = "sortik2:";
const KOLEKSI = ["kategori", "toko", "rak", "produk", "pesanan", "pengguna", "pesan", "keuangan"];
const baca = (k, d) => { try { return JSON.parse(localStorage.getItem(VERSI + k)) ?? d; } catch { return d; } };
const simpan = (k) => {
  try {
    localStorage.setItem(VERSI + k, JSON.stringify(db[k]));
  } catch {
    notif("Penyimpanan browser penuh — hapus foto lama atau gunakan foto yang lebih kecil.");
  }
};

/* contoh dipakai sekali untuk mengisi data lama */
const contohProduk = db.produk.map((p) => ({ ...p }));
const contohKategori = db.kategori.map((k) => ({ ...k }));
const contohPengguna = db.pengguna.map((u) => ({ ...u }));
KOLEKSI.forEach((k) => (db[k] = baca(k, db[k])));

/* pengguna lama tanpa sandi: isi sekali dari data contoh — masuk tetap bisa */
const TANDA_SANDI = VERSI + "sandi-awal";
if (!localStorage.getItem(TANDA_SANDI)) {
  let berubah = false;
  db.pengguna.forEach((u) => {
    const c = contohPengguna.find((x) => x.email === u.email) || {};
    if (c.sandi && !u.sandi) { u.sandi = c.sandi; berubah = true; }
  });
  if (berubah) simpan("pengguna");
  try { localStorage.setItem(TANDA_SANDI, "1"); } catch {}
}

/* kategori lama: lengkapi nama ikon dari data contoh */
let ikonBaru = false;
db.kategori.forEach((k) => {
  const c = contohKategori.find((x) => x.id === k.id);
  if (!k.lucide && c && c.lucide) { k.lucide = c.lucide; ikonBaru = true; }
});
if (ikonBaru) simpan("kategori");

/* produk lama tanpa foto: isi sekali, lalu ditandai admin tetap dihormati */
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

/* produk lama tanpa diskon: ambil promo contoh sekali — data lama tetap hidup */
const TANDA_DISKON = VERSI + "diskon-awal";
if (!localStorage.getItem(TANDA_DISKON)) {
  let berubah = false;
  db.produk.forEach((p) => {
    const c = contohProduk.find((x) => x.id === p.id) || {};
    if (c.diskon && !p.diskon) { p.diskon = c.diskon; berubah = true; }
  });
  if (berubah) simpan("produk");
  try { localStorage.setItem(TANDA_DISKON, "1"); } catch {}
}

/* rak lama: {grid, daftar} atau {grid, baris+kolom} → bungkus jadi lantai tunggal
   dengan model multi-lantai — kode rak tetap, jadi barang di dalamnya tidak berubah */
if (!Array.isArray(db.rak.lantai)) {
  const daftar = Array.isArray(db.rak.daftar) ? db.rak.daftar : susunAwal(db.rak.baris, db.rak.kolom);
  db.rak = { grid: db.rak.grid || 28, aktif: 0, lantai: [lantaiAwal(daftar)] };
  simpan("rak");
}

/* lengkapi lantai lama yang atributnya kurang (nama, luas, pintu) */
let rakMigrasi = false;
if (db.rak.aktif == null || !db.rak.lantai[db.rak.aktif]) { db.rak.aktif = 0; rakMigrasi = true; }
db.rak.lantai.forEach((l, i) => {
  const ujung = (f, d) => (d.length ? Math.max(...d.map(f)) : 0);
  l.daftar = Array.isArray(l.daftar) ? l.daftar : [];
  /* blok/halangan (kasir, lift, tembok, ...) — lantai lama belum punya */
  if (!Array.isArray(l.area)) { l.area = []; rakMigrasi = true; }
  if (!l.nama) { l.nama = "Lantai " + (i + 1); rakMigrasi = true; }
  /* luas minimal = luas yang menampung semua raknya */
  const lebarBaru = Math.max(ujung((r) => r.x + r.w, l.daftar), +l.lebar || 24);
  const tinggiBaru = Math.max(ujung((r) => r.y + r.h, l.daftar), +l.tinggi || 18);
  if (lebarBaru !== l.lebar || tinggiBaru !== l.tinggi) { l.lebar = lebarBaru; l.tinggi = tinggiBaru; rakMigrasi = true; }
  const pintu = l.pintu || {};
  if (!["atas", "bawah", "kiri", "kanan"].includes(pintu.sisi)) { pintu.sisi = "bawah"; rakMigrasi = true; }
  const maks = Math.max(0, (pintu.sisi === "kiri" || pintu.sisi === "kanan" ? l.tinggi : l.lebar) - 3);
  if (!Number.isInteger(pintu.pos) || pintu.pos < 0 || pintu.pos > maks) { pintu.pos = Math.min(maks, Math.floor(l.lebar / 3)); rakMigrasi = true; }
  if (l.pintu !== pintu) { l.pintu = pintu; rakMigrasi = true; }
});
if (rakMigrasi) simpan("rak");

/* ---------- keranjang ---------- */
/* { produk: id, jumlah }; harga dari db.produk */
const keranjang = baca("keranjang", []);
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const simpanKeranjang = () => {
  localStorage.setItem(VERSI + "keranjang", JSON.stringify(keranjang));
  const badge = el("jml");
  if (badge) badge.textContent = jmlKeranjang() || "";
};

/* ---------- sesi ---------- */
/* sesi: akun masuk = baris pengguna sesuai folder halaman (sortik2:sesi = id) */
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

/* badge pesanan Menunggu untuk menu staff/admin */
const nTunggu = () => db.pesanan.filter((o) => o.status === "Menunggu").length;

/* badge pesan grup yang belum dibaca (stempel waktu terakhir dibaca per peran) */
const nPesanBaru = () => {
  const terakhir = +baca("pesanBaca-" + peran, 0);
  return db.pesan.filter((m) => new Date(m.waktu).getTime() > terakhir && m.dari !== db.akun.nama).length;
};

/* ---------- sidebar ---------- */
/* [nama ikon Lucide, label desktop, href, ekstra, label mobile] */
const MENU = {
  pembeli: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["search", "Cari Produk & Rak", "cari.html", "", "Cari"],
    ["shopping-cart", "Keranjang", "checkout.html", `<b class="badge" id="jml">${jmlKeranjang() || ""}</b>`, "Keranjang"],
    ["clipboard-list", "Pesan & Booking", "pesan.html", "", "Pesan"],
    ["history", "Riwayat", "riwayat.html", "", "Riwayat"]
  ],
  staff: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
    ["message-square", "Pesan Grup", "pesan.html", `<b class="badge" id="badgePesan">${nPesanBaru() || ""}</b>`, "Pesan"],
    ["wallet", "Keuangan", "keuangan.html", "", "Uang"]
  ],
  admin: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    /* admin mewarisi menu staff; skrip bersama di assets/js/toko/ */
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
    ["message-square", "Pesan Grup", "pesan.html", `<b class="badge" id="badgePesan">${nPesanBaru() || ""}</b>`, "Pesan"],
    ["wallet", "Keuangan", "keuangan.html", "", "Uang"],
    ["users", "Kelola Pengguna", "pengguna.html", "", "Pengguna"],
    ["settings", "Pengaturan Toko", "pengaturan.html", "", "Toko"]
  ]
};

/* ---------- ikon: Lucide via CDN ---------- */
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
  /* profil semua peran jadi tautan ke halaman akun masing-masing folder */
const tautanProfil = (html) => `<a class="profil" href="akun.html" title="Akun saya">${html}</a>`;
isi("side", `<a class="logo" href="index.html">
  <img src="${db.toko.logo || "../assets/img/favicon.svg"}" alt="" width="34"><span class="namatoko"><b>${esc(db.toko.nama)}</b><i>with SORTIK</i></span>
</a>
<nav>${MENU[peran].map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}"><span class="ikon" data-lucide="${ikon}"></span><span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</nav>
<div class="me">${tautanProfil(`<div class="avatar">${avatarHTML(db.akun)}</div><div class="siapa"><b>${db.akun.nama}</b><span>${labelPeran(db.akun.role)}</span></div>`)}
<a class="keluar" href="../auth/login.html" title="Keluar"><span class="ikon" data-lucide="log-out"></span><span class="lengkap">Keluar</span></a></div>`);
/* badge pesan grup dihitung ulang saat sidebar digambar (mis. setelah membuka halaman pesan) */
const badgePesan = el("badgePesan");
if (badgePesan) badgePesan.textContent = nPesanBaru() || "";
}
gambarSidebar();
muatLucide();
