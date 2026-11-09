/* SORTIK, sesi lokal, data permanen (localStorage), dan sidebar. */
const VERSI = "sortik2:";
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const TUJUAN_PERAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";
/* semua toko (untuk jelajah pembeli); db.toko tetap toko yang sedang aktif */
let semuaToko = [];
let versiData = null;
let alasanMutasiStok = "";

/* Simpan seluruh db ke localStorage; toko aktif dikembalikan ke koleksi asli dulu. */
const simpan = (k) => tulis();

/* tulis db ke penyimpanan; perbaikan(asli) boleh mengubah toko lain lebih dulu */
function tulis(perbaikan) {
  if (versiData !== localStorage.getItem(KUNCI_DB)) {
    alert("Data telah berubah di tab lain. Perubahan ini belum disimpan. Muat ulang halaman sebelum melanjutkan.");
    throw new Error("Data berubah di tab lain; penyimpanan dibatalkan.");
  }
  const asli = muatDB();
  asli.pengguna = db.pengguna;
  if (db.aktifToko != null) {
    const i = asli.toko.findIndex((t) => t.id === db.aktifToko);
    if (i >= 0) {
      const lama = asli.toko[i].produk || [];
      const perubahan = db.produk.flatMap((p) => {
        const sebelum = lama.find((x) => x.id === p.id);
        if (!sebelum || sebelum.stok === p.stok) return [];
        return [{ produk: p.id, nama: p.nama, sebelum: sebelum.stok, sesudah: p.stok, waktu: new Date().toISOString(), pelaku: db.akun.nama, alasan: alasanMutasiStok || "Perubahan dari transaksi" }];
      });
      db.toko.mutasiStok = [...(asli.toko[i].mutasiStok || []), ...perubahan];
    }
    if (i >= 0) asli.toko[i] = {
      ...asli.toko[i], ...db.toko,
      kategori: db.kategori, rak: db.rak, produk: db.produk,
      pesanan: db.pesanan, pesan: db.pesan, keuangan: db.keuangan
    };
  }
  if (perbaikan) perbaikan(asli);
  const g = simpanDB({ ...asli, akun: undefined, aktifToko: undefined });
  if (g) {
    alert("Gagal menyimpan: " + g.message + " Perubahan belum tersimpan.");
    throw new Error("Penyimpanan gagal: " + g.message);
  }
  versiData = localStorage.getItem(KUNCI_DB);
  alasanMutasiStok = "";
  return Promise.resolve(true);
}

/* Simpan pesanan milik toko yang sedang tidak aktif. */
const simpanPesanan = (o) => tulis((asli) => {
  const t = asli.toko.find((x) => x.id === (o.toko || db.aktifToko));
  const i = t && (t.pesanan || []).findIndex((x) => x.id === o.id);
  if (i >= 0) t.pesanan[i] = o;
});
/* localStorage juga memuat keranjang belanja (status sementara per browser). */

/* Toko aktif: admin pemilik, staff terkunci, pembeli pilih sendiri. */
function tokoAktif(profil, data) {
  if (profil.role === "admin") {
    const punya = data.toko.filter((t) => t.pemilik === profil.id);
    const pilih = tokoDari(data, bacaToko());
    return (pilih && punya.includes(pilih) && pilih) || punya[0] || null;
  }
  if (profil.role === "staff") return tokoDari(data, profil.toko);
  return tokoDari(data, bacaToko());
}

async function muatData() {
  const data = muatDB();
  versiData = localStorage.getItem(KUNCI_DB);
  semuaToko = data.toko;
  db.pengguna = data.pengguna || [];

  const profil = db.pengguna.find((u) => u.id === bacaSesi());
  if (!profil) {
    simpanSesi(null);
    if (peran !== "pembeli") {
      location.replace("../auth/login.html");
      return false;
    }
    db.akun = { id: null, nama: "Pengunjung", role: peran, email: "", telepon: "", alamat: "", avatar: "" };
  } else if (profil.status !== "aktif") {
    simpanSesi(null);
    location.replace("../auth/login.html");
    return false;
  } else if (profil.role !== peran) {
    location.replace(TUJUAN_PERAN[profil.role] || TUJUAN_PERAN.pembeli);
    return false;
  } else {
    db.akun = { ...profil, peran };
  }

  /* Tanpa toko: pembeli ke Jelajah, staff ke Pilih Toko, admin ke Kelola Toko. */
  const toko = tokoAktif(db.akun, data);
  if (!toko) {
    const halaman = location.pathname.split("/").pop();
    const tuju = { pembeli: "jelajah.html", staff: "toko.html", admin: "toko.html" }[peran];
    if (tuju && halaman !== tuju) {
      location.replace(tuju);
      return false;
    }
    db.aktifToko = null;
    db.toko = { id: "", nama: "SORTIK", alamat: "", jam: "", wa: "", ongkir: 0, rekening: [], logo: "", foto: "" };
    db.kategori = []; db.rak = { grid: 28, aktif: 0, lantai: [] };
    db.produk = []; db.pesanan = []; db.pesan = []; db.keuangan = { pengeluaran: [] };
    return;
  }
  db.aktifToko = toko.id;
  db.toko = toko;
  db.kategori = toko.kategori || [];
  db.rak = toko.rak || { grid: 28, aktif: 0, lantai: [] };
  db.produk = toko.produk || [];
  db.pesanan = toko.pesanan || [];
  db.pesan = toko.pesan || [];
  db.keuangan = toko.keuangan || { pengeluaran: [] };
}

/* Keranjang sementara per toko, bukan sumber data bisnis. */
const kunciKeranjang = (id) => VERSI + "keranjang" + (id ? ":" + id : "") + (db.akun && db.akun.id ? ":akun:" + db.akun.id : "");
const keranjang = [];
const bacaKeranjang = (tokoId) => {
  try { return JSON.parse(localStorage.getItem(kunciKeranjang(tokoId))) || []; } catch { return []; }
};
function muatKeranjang() {
  keranjang.length = 0;
  if (db.aktifToko) keranjang.push(...bacaKeranjang(db.aktifToko));
}
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const jmlKeranjangToko = (tokoId) => bacaKeranjang(tokoId).reduce((n, i) => n + (+i.jumlah || 0), 0);
const badgeKeranjang = () => { const b = el("jml"); if (b) b.textContent = jmlKeranjang() || ""; };
const simpanKeranjang = () => {
  try { localStorage.setItem(kunciKeranjang(db.aktifToko), JSON.stringify(keranjang)); } catch {}
  badgeKeranjang();
};

/* taruh barang di keranjang toko lain, dipakai "Beli Lagi" dari pesanan lintas toko */
function tambahKeranjangToko(tokoId, produkId, jumlah) {
  const daftar = bacaKeranjang(tokoId);
  const i = daftar.find((x) => x.produk === produkId);
  if (i) i.jumlah += jumlah; else daftar.push({ produk: produkId, jumlah });
  try { localStorage.setItem(kunciKeranjang(tokoId), JSON.stringify(daftar)); } catch {}
}

const labelPeran = (r) => PERAN[r] || r;
const inisial = (nama) => String(nama || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
/* avatar hanya dari foto; tanpa foto tampil inisial nama */
const avatarHTML = (u) => (u.avatar ? `<img src="${u.avatar}" alt="">` : inisial(u.nama));
const tokoById = (id) => semuaToko.find((t) => t.id === id) || {};
const labelToko = (id) => tokoById(id).nama || "toko";
/* satu akun bisa belanja di banyak toko: daftar pesannya gabungan semua toko */
const pesananku = () => semuaToko.flatMap((t) => (t.pesanan || []).filter((o) => o.pembeli_id === db.akun.id));
const nTunggu = () => db.pesanan.filter((o) => o.status === "Menunggu").length;
const nPesanBaru = () => 0;

/* menu sidebar per peran, dikelompokkan menurut fungsinya */
const MENU = {
  pembeli: [
    ["Toko", [
      ["store", "Jelajah Toko", "jelajah.html", "", "Toko"],
      ["house", "Beranda", "index.html", "", "Beranda"]
    ]],
    ["Belanja", [
      ["search", "Cari Produk & Rak", "cari.html", "", "Cari"],
      ["shopping-cart", "Keranjang", "checkout.html", `<b class="badge" id="jml">${jmlKeranjang() || ""}</b>`, "Keranjang"]
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
      ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
      ["message-square", "Pesan Grup", "pesan.html", "", "Pesan"],
      ["wallet", "Keuangan", "keuangan.html", "", "Uang"]
    ]]
  ],
  admin: [
    ["Operasional", [
      ["house", "Beranda", "index.html", "", "Beranda"],
      ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
      ["package", "Kelola Barang", "produk.html", "", "Barang"]
    ]],
    ["Penjualan", [
      ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
      ["message-square", "Pesan Grup", "pesan.html", "", "Pesan"],
      ["wallet", "Keuangan", "keuangan.html", "", "Uang"]
    ]],
    ["Administrasi", [
      ["store", "Kelola Toko", "toko.html", "", "Kelola"],
      ["users", "Tim Staff", "pengguna.html", "", "Staff"],
      ["settings", "Pengaturan Toko", "pengaturan.html", "", "Toko"]
    ]]
  ]
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
  const logo = db.toko.logo || "../assets/img/SortikLogo.jpeg";
  const namaToko = `<span class="namatoko"${peran === "pembeli" ? ' title="Ganti toko lewat menu Jelajah Toko"' : ""}><b>${esc(db.toko.nama || "SORTIK")}</b></span>`;
  isi("side", `<a class="logo" href="index.html">
  <img src="${logo}" alt="Logo toko" width="34">${namaToko}
</a>
<nav>${MENU[peran].map(([grup, item]) => `<div class="navgrup"><span class="navjudul">${grup}</span>${item.map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}"><span class="ikon" data-lucide="${ikon}"></span><span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</div>`).join("")}</nav>
<div class="me">${tautanProfil(`<div class="avatar">${avatarHTML(akun)}</div><div class="siapa"><b>${esc(akun.nama)}</b><span>${labelPeran(akun.role)}</span></div>`)}
<a class="keluar" href="../auth/login.html" title="Keluar"><span class="ikon" data-lucide="log-out"></span><span class="lengkap">Keluar</span></a></div>`);
  /* badge keranjang & pesanan dimuat ulang: MENU dibuat sekali, sebelum keranjang terisi */
  badgeKeranjang();
  const jmlPesan = el("jmlPesan");
  if (jmlPesan) jmlPesan.textContent = pesananku().filter(pesananJalan).length || "";
}

async function mulaiAplikasi(mulai) {
  gambarSidebar();
  muatLucide();
  ujiAlur();
  try {
    if (await muatData() === false) return;
    muatKeranjang();
    gambarSidebar();
    mulai();
  } catch (error) {
    console.error("Gagal memuat data lokal:", error);
    document.querySelector("main")?.replaceChildren(Object.assign(document.createElement("p"), {
      className: "kosong",
      textContent: "Data gagal dimuat. Coba muat ulang halaman. Jika masalah berlanjut, hubungi pengelola aplikasi sebelum menghapus data browser."
    }));
  }
}
