/* SORTIK — pemuatan data dari server (/api) dan sidebar.
   Tidak ada penyimpanan di browser: objek `db` hanya cache tampilan yang diisi
   ulang dari server setiap halaman dibuka. */
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const TUJUAN_PERAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";

/* Muat katalog dan sesi. Galat jaringan/server dilempar sebagai Error berisi pesan siap tampil. */
async function muatData() {
  const [toko, kategori, produk, rak, saya] = await Promise.all([
    api.get("/toko"), api.get("/kategori"), api.get("/produk"), api.get("/rak"), api.get("/saya"),
  ]);
  const gagal = [toko, kategori, produk, rak].find((r) => r.error);
  if (gagal) throw new Error(gagal.error);

  db.toko = toko.data;
  db.kategori = kategori.data;
  db.produk = produk.data;
  db.rak = { grid: 28, aktif: 0, lantai: rak.data.lantai };

  if (saya.status === 401) {
    if (peran !== "pembeli") {
      location.replace("../auth/login.html");
      throw new Error("Silakan masuk dulu.");
    }
    /* katalog terbuka untuk pengunjung tanpa akun */
    db.akun = { id: null, nama: "Pengunjung", role: peran, email: "", telepon: "", alamat: "", avatar: "" };
    db.pesanan = []; db.keranjang = [];
    return;
  }
  if (saya.error) throw new Error(saya.error);
  const profil = saya.data.user;
  if (profil.role !== peran) {
    location.replace(TUJUAN_PERAN[profil.role] || TUJUAN_PERAN.pembeli);
    throw new Error("Peran akun tidak sesuai halaman.");
  }
  db.akun = { ...profil, peran };
  const [pesanan, keranjang, pengguna, keluar] = await Promise.all([
    api.get("/pesanan"), profil.role === "pembeli" ? api.get("/keranjang") : { data: [] },
    profil.role === "admin" ? api.get("/pengguna") : { data: [] },
    profil.role !== "pembeli" ? api.get("/pengeluaran") : { data: [] },
  ]);
  const salah = [pesanan, keranjang, pengguna, keluar].find((r) => r.error);
  if (salah) throw new Error(salah.error);
  db.pengguna = pengguna.data;
  db.keuangan = { pengeluaran: keluar.data };
  db.pesanan = pesanan.data;
  db.keranjang = keranjang.data;
}

/* Keranjang tersimpan di server. Tiap perubahan dikirim lebih dulu; db.keranjang hanya
   diganti dengan jawaban server. Mengembalikan { error } bila gagal. */
const perluMasuk = () => ({ error: "Masuk dulu untuk berbelanja.", masuk: true });
async function keranjangTambah(id, n = 1) {
  if (db.akun.id == null) return perluMasuk();
  const r = await api.post("/keranjang", { produk: id, tambah: n });
  if (!r.error) db.keranjang = r.data;
  return r;
}
async function keranjangAtur(id, jumlah) {
  if (db.akun.id == null) return perluMasuk();
  const r = await api.put("/keranjang/" + id, { jumlah });
  if (!r.error) db.keranjang = r.data;
  return r;
}
const nKeranjang = () => db.keranjang.reduce((n, i) => n + i.jumlah, 0);

const labelPeran = (r) => PERAN[r] || r;
const inisial = (nama) => String(nama || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
/* avatar hanya dari foto; tanpa foto tampil inisial nama */
const avatarHTML = (u) => (u.avatar ? `<img src="${urlGambar(u.avatar)}" alt="">` : esc(inisial(u.nama)));
const pesananku = () => db.pesanan.filter((o) => o.pembeliId === db.akun.id);
const nTunggu = () => db.pesanan.filter((o) => o.status === "Menunggu").length;
const badgeAntrean = '<b class="badge" id="jmlAntrean"></b>';
let antreanPesanan = null;

/* menu sidebar per peran, dikelompokkan menurut fungsinya */
const MENU = {
  pembeli: [
    ["Belanja", [
      ["house", "Beranda", "index.html", "", "Beranda"],
      ["search", "Cari Produk & Rak", "cari.html", "", "Cari"],
      ["shopping-cart", "Keranjang", "checkout.html", `<b class="badge" id="jmlKeranjang"></b>`, "Keranjang"]
    ]],
    ["Pesanan", [
      ["clipboard-list", "Pesanan Saya", "pesan.html", `<b class="badge" id="jmlPesan"></b>`, "Pesanan"],
      ["history", "Riwayat", "riwayat.html", "", "Riwayat"]
    ]]
  ],
  staff: [
    ["Operasional", [
      ["house", "Beranda", "index.html", "", "Beranda"],
      ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
      ["package", "Kelola Barang", "produk.html", "", "Barang"]
    ]],
    ["Penjualan", [
      ["clipboard-check", "Kelola Pesanan", "pesanan.html", badgeAntrean, "Pesanan"],
      ["wallet", "Keuangan", "keuangan.html", "", "Keuangan"]
    ]]
  ],
  admin: [
    ["Operasional", [
      ["house", "Beranda", "index.html", "", "Beranda"],
      ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
      ["package", "Kelola Barang", "produk.html", "", "Barang"]
    ]],
    ["Penjualan", [
      ["clipboard-check", "Kelola Pesanan", "pesanan.html", badgeAntrean, "Pesanan"],
      ["wallet", "Keuangan", "keuangan.html", "", "Keuangan"]
    ]],
    ["Administrasi", [
      ["users", "Kelola Pengguna", "pengguna.html", "", "Pengguna"],
      ["settings", "Pengaturan Toko", "pengaturan.html", "", "Pengaturan"]
    ]]
  ]
};
/* bar bawah HP hanya muat 5 tab: menu di luar daftar ini masuk lembar "Lainnya".
   Staff cukup 5 menu, jadi semuanya tampil langsung tanpa "Lainnya". */
const MENU_UTAMA = {
  admin: ["index.html", "pesanan.html", "produk.html", "rak.html"]
};

const LUCIDE = "../assets/vendor/lucide.min.js";
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
  const akun = db.akun || { nama: "Memuat…", role: peran };
  const tautanProfil = (html) => `<a class="profil" href="akun.html" title="Akun saya">${html}</a>`;
  const utama = MENU_UTAMA[peran];
  const lain = utama ? MENU[peran].flatMap(([, item]) => item).filter(([, , href]) => !utama.includes(href)) : [];
  /* peran di <body>: pembeli mendapat bar atas bergaya toko di layar lebar */
  document.body.dataset.peran = peran;
  /* kotak cari cepat di bar atas pembeli (halaman Cari sudah punya kolomnya sendiri) */
  const cariCepat = peran === "pembeli" && berkas !== "cari.html"
    ? `<form class="caribar" action="cari.html" method="get" role="search"><span class="ikon" data-lucide="search"></span><input type="search" name="q" placeholder="Cari produk atau kode rak…" aria-label="Cari produk"></form>`
    : "";
  isi("side", `<a class="logo" href="index.html">
  <img src="${db.toko.logo ? urlGambar(db.toko.logo) : "../assets/img/SortikLogo.jpeg"}" alt="Logo toko" width="34"><span class="namatoko"><b>${esc(db.toko.nama || "SORTIK")}</b><i>with SORTIK</i></span>
</a>
<nav>${MENU[peran].map(([grup, item]) => `<div class="navgrup"><span class="navjudul">${grup}</span>${item.map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a class="${[href === berkas && "on", utama && !utama.includes(href) && "sekunder"].filter(Boolean).join(" ")}" href="${href}"${href === berkas ? ' aria-current="page"' : ""}><span class="ikon" data-lucide="${ikon}"></span><span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</div>`).join("")}
${lain.length ? `<button type="button" class="lainnya${lain.some(([, , href]) => href === berkas) ? " on" : ""}" id="tombolLainnya" aria-expanded="false" aria-controls="lembarLainnya"><span class="ikon" data-lucide="layout-grid"></span><span class="pendek">Lainnya</span></button>
<div class="lembar" id="lembarLainnya" hidden><span class="navjudul">Menu lainnya</span>${lain.map(([ikon, label, href]) =>
    `<a${href === berkas ? ' class="on" aria-current="page"' : ""} href="${href}"><span class="ikon" data-lucide="${ikon}"></span><span>${label}</span></a>`).join("")}</div>` : ""}</nav>
${cariCepat}
<div class="me">${tautanProfil(`<div class="avatar">${avatarHTML(akun)}</div><div class="siapa"><b>${esc(akun.nama)}</b><span>${labelPeran(akun.role)}</span></div>`)}
<a class="keluar" href="../auth/login.html" title="Keluar"><span class="ikon" data-lucide="log-out"></span><span class="lengkap">Keluar</span></a></div>`);
  pasangLainnya();
  /* badge pesanan aktif milik akun ini (menu pembeli) */
  const jmlPesan = el("jmlPesan");
  const jmlKeranjang = el("jmlKeranjang");
  if (jmlKeranjang) jmlKeranjang.textContent = (db.keranjang && nKeranjang()) || "";
  if (jmlPesan) jmlPesan.textContent = pesananku().filter(aktif).length || "";
  gambarBadgeAntrean();
}

function gambarBadgeAntrean() {
  const badge = el("jmlAntrean");
  if (badge) badge.textContent = (antreanPesanan?.size ?? nTunggu()) || "";
}

function pantauPesananMasuk() {
  antreanPesanan = new Set(db.pesanan.filter((o) => o.status === "Menunggu").map((o) => o.id));
  const belumDibuka = new Set();
  const wadah = document.createElement("div");
  wadah.className = "notifikasi-pesanan";
  wadah.innerHTML = `
    <div class="sr-only" role="status"></div>
    <aside class="bubble-pesanan" aria-label="Notifikasi pesanan masuk" hidden>
      <span class="ikon" data-lucide="bell-ring" aria-hidden="true"></span>
      <div><b></b><a href="pesanan.html?status=Menunggu">Lihat antrean pesanan</a></div>
      <button type="button" aria-label="Tutup notifikasi pesanan"><span class="ikon" data-lucide="x"></span></button>
    </aside>`;
  document.body.append(wadah);
  gambarIkon();

  const bubble = wadah.querySelector("aside");
  const judul = bubble.querySelector("b");
  const pengumuman = wadah.querySelector('[role="status"]');
  function gambarBubble() {
    const teks = belumDibuka.size ? `${belumDibuka.size} pesanan baru masuk` : "";
    if (judul.textContent !== teks) {
      judul.textContent = teks;
      pengumuman.textContent = teks;
    }
    bubble.hidden = !teks;
  }
  bubble.querySelector("button").onclick = () => {
    belumDibuka.clear();
    gambarBubble();
    el("jmlAntrean")?.closest("a").focus();
  };

  let memeriksa = false;
  async function periksaAntrean() {
    if (document.hidden || memeriksa) return;
    memeriksa = true;
    try {
      const { data, error } = await api.get("/pesanan/antrean");
      if (error) return;
      const terbaru = new Set(data);
      for (const id of terbaru) if (!antreanPesanan.has(id)) belumDibuka.add(id);
      for (const id of belumDibuka) if (!terbaru.has(id)) belumDibuka.delete(id);
      antreanPesanan = terbaru;
      gambarBadgeAntrean();
      gambarBubble();
    } finally {
      memeriksa = false;
    }
  }
  setInterval(periksaAntrean, 15_000);
  document.addEventListener("visibilitychange", periksaAntrean);
}

/* lembar "Lainnya" di bar bawah HP: buka/tutup, Esc & ketuk di luar menutup */
let tutupLainnya = null;
function pasangLainnya() {
  const tombol = el("tombolLainnya"), lembar = el("lembarLainnya");
  if (tutupLainnya) document.removeEventListener("click", tutupLainnya), document.removeEventListener("keydown", tutupLainnya);
  if (!tombol || !lembar) return;
  const atur = (buka) => { lembar.hidden = !buka; tombol.setAttribute("aria-expanded", String(buka)); };
  tombol.addEventListener("click", (e) => { e.stopPropagation(); atur(lembar.hidden); if (!lembar.hidden) lembar.querySelector("a")?.focus(); });
  tutupLainnya = (e) => {
    if (lembar.hidden) return;
    if (e.type === "keydown" ? e.key === "Escape" : !lembar.contains(e.target)) { atur(false); if (e.type === "keydown") tombol.focus(); }
  };
  document.addEventListener("click", tutupLainnya);
  document.addEventListener("keydown", tutupLainnya);
}

async function mulaiAplikasi(mulai) {
  gambarSidebar();
  muatLucide();
  try {
    await muatData();
    gambarSidebar();
    if (peran === "admin" || peran === "staff") pantauPesananMasuk();
    mulai();
  } catch (error) {
    console.error("Gagal memuat data:", error);
    document.querySelector("main")?.replaceChildren(Object.assign(document.createElement("p"), {
      className: "kosong",
      textContent: error.message || "Data gagal dimuat. Muat ulang halaman."
    }));
  }
}
