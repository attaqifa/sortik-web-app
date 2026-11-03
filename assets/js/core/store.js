/* SORTIK — sesi lokal, data permanen (localStorage), dan sidebar. */
const VERSI = "sortik2:";
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const TUJUAN_PERAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";

/* ---------- penyimpanan: seluruh db ditulis ke localStorage ----------
   Halaman tetap memakai pola lama: ubah db[k] di memori, lalu simpan(k). */
const simpan = (k) => {
  const g = simpanDB({ ...db, akun: undefined });
  if (g) { notif("Gagal menyimpan — " + g.message); return Promise.resolve(false); }
  return Promise.resolve(true);
};
/* localStorage juga memuat keranjang belanja (status sementara per browser). */
const baca = (k, nilaiKosong = []) => {
  if (k !== "keranjang") return nilaiKosong;
  try { return JSON.parse(localStorage.getItem(VERSI + k)) ?? nilaiKosong; } catch { return nilaiKosong; }
};

async function muatData() {
  const data = muatDB();
  db.kategori = data.kategori || [];
  /* toko disimpan satu objek — cadangan untuk data lama bentuk array */
  db.toko = (Array.isArray(data.toko) ? data.toko[0] : data.toko)
    || { id: 1, nama: "", alamat: "", jam: "", wa: "", ongkir: 0, rekening: [], logo: "" };
  db.rak = data.rak || { grid: 28, aktif: 0, lantai: [] };
  db.produk = (data.produk || []).map((p) => ({ ...p, kategori: p.kategori || "", galeri: Array.isArray(p.galeri) ? p.galeri : [] }));
  db.pesanan = data.pesanan || [];
  db.pengguna = data.pengguna || [];
  db.pesan = data.pesan || [];
  db.keuangan = data.keuangan || { pengeluaran: [] };

  const profil = db.pengguna.find((u) => u.id === bacaSesi());
  if (!profil) {
    simpanSesi(null);
    if (peran !== "pembeli") {
      location.replace("../auth/login.html");
      return;
    }
    db.akun = { id: null, nama: "Pengunjung", role: peran, email: "", telepon: "", alamat: "", avatar: "", ikon: "🧑" };
    return;
  }
  if (profil.status !== "aktif") {
    simpanSesi(null);
    location.replace("../auth/login.html");
    throw new Error("Akun dinonaktifkan.");
  }
  if (profil.role !== peran) {
    location.replace(TUJUAN_PERAN[profil.role] || TUJUAN_PERAN.pembeli);
    throw new Error("Peran akun tidak sesuai halaman.");
  }
  db.akun = { ...profil, peran };
}

/* { produk: id, jumlah } hanya keranjang sementara, bukan sumber data bisnis. */
const keranjang = baca("keranjang", []);
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const simpanKeranjang = () => {
  try { localStorage.setItem(VERSI + "keranjang", JSON.stringify(keranjang)); } catch {}
  const badge = el("jml");
  if (badge) badge.textContent = jmlKeranjang() || "";
};

const labelPeran = (r) => PERAN[r] || r;
const inisial = (nama) => String(nama || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const avatarHTML = (u) => (u.avatar ? `<img src="${u.avatar}" alt="">` : (u.ikon || inisial(u.nama)));
const pesananku = () => db.pesanan.filter((o) => o.pembeli_id === db.akun.id);
const nTunggu = () => db.pesanan.filter((o) => o.status === "Menunggu").length;
const nPesanBaru = () => 0;

const MENU = {
  pembeli: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["search", "Cari Produk & Rak", "cari.html", "", "Cari"],
    ["shopping-cart", "Keranjang", "checkout.html", `<b class="badge" id="jml">${jmlKeranjang() || ""}</b>`, "Keranjang"],
    ["clipboard-list", "Pesan & Booking", "pesan.html", `<b class="badge" id="jmlPesan"></b>`, "Pesan"],
    ["history", "Riwayat", "riwayat.html", "", "Riwayat"]
  ],
  staff: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
    ["message-square", "Pesan Grup", "pesan.html", "", "Pesan"],
    ["wallet", "Keuangan", "keuangan.html", "", "Uang"]
  ],
  admin: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
    ["message-square", "Pesan Grup", "pesan.html", "", "Pesan"],
    ["wallet", "Keuangan", "keuangan.html", "", "Uang"],
    ["users", "Kelola Pengguna", "pengguna.html", "", "Pengguna"],
    ["settings", "Pengaturan Toko", "pengaturan.html", "", "Toko"]
  ]
};

const LUCIDE = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
function muatLucide() {
  if (window.lucide) return gambarIkon();
  const s = document.createElement("script");
  s.src = LUCIDE;
  s.onload = gambarIkon;
  document.head.append(s);
}
function gambarSidebar() {
  const side = el("side");
  if (!side) return;
  const berkas = location.pathname.split("/").pop() || "index.html";
  const akun = db.akun || { nama: "Memuat…", role: peran, ikon: "🧑" };
  const tautanProfil = (html) => `<a class="profil" href="akun.html" title="Akun saya">${html}</a>`;
  isi("side", `<a class="logo" href="index.html">
  <img src="${db.toko.logo || "../assets/img/SortikLogo.jpeg"}" alt="Logo toko" width="34"><span class="namatoko"><b>${esc(db.toko.nama || "SORTIK")}</b><i>with SORTIK</i></span>
</a>
<nav>${MENU[peran].map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}"><span class="ikon" data-lucide="${ikon}"></span><span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</nav>
<div class="me">${tautanProfil(`<div class="avatar">${avatarHTML(akun)}</div><div class="siapa"><b>${esc(akun.nama)}</b><span>${labelPeran(akun.role)}</span></div>`)}
<a class="keluar" href="../auth/login.html" title="Keluar"><span class="ikon" data-lucide="log-out"></span><span class="lengkap">Keluar</span></a></div>`);
  /* badge pesanan aktif milik akun ini (menu pembeli) */
  const jmlPesan = el("jmlPesan");
  if (jmlPesan) jmlPesan.textContent = pesananku().filter((o) => o.status !== "Selesai").length || "";
}

async function mulaiAplikasi(mulai) {
  gambarSidebar();
  muatLucide();
  try {
    await muatData();
    gambarSidebar();
    mulai();
  } catch (error) {
    console.error("Gagal memuat data lokal:", error);
    document.querySelector("main")?.replaceChildren(Object.assign(document.createElement("p"), {
      className: "kosong",
      textContent: "Data gagal dimuat. Jalankan localStorage.removeItem(\"sortik-db\") di Console untuk reset, lalu muat ulang halaman."
    }));
  }
}
