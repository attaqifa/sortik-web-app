/* SORTIK — data & util bersama (halaman pembeli dan staff)
  sumber data mock. Saat pindah ke database, isi ulang:
     Object.assign(db, await (await fetch("/api/db")).json());
   Nama field sengaja mengikuti kolom tabel yang dibutuhkan:
     kategori -> id, nama, ikon
     produk   -> id, nama, kategori, harga, stok, rak, ikon, deskripsi   (ikon nanti: gambar)
     rak      -> baris (A–F), kolom
     pesanan  -> id, produk (id produk), pembeli (nama pemesan), jumlah, status,
                 tanggal, cara ("ambil"|"antar"), bayar ("Transfer ke admin"|"Bayar di kasir"),
                 alamat, lunas (bool), staff (nama staff yang menandai lunas)
     toko     -> nama, alamat, jam, wa, ongkir, rekening (bank, nomor, atasNama)
     keranjang-> produk (id produk), jumlah   (di server + user_id dari sesi)
     user     -> pembeli yang sedang masuk, staff -> petugas toko
   Semua skrip di folder assets/js (termasuk assets/js/staff) hanya membaca `db`
   lewat util di bawah jadi tidak perlu diubah saat data pindah ke DB. */

const db = {
  user: { nama: "Rina Kartika", role: "Pembeli", inisial: "RK" },
  staff: { nama: "Bagas Prasetyo", role: "Staff Toko", inisial: "BP" },

  kategori: [
    { id: "handphone", nama: "Handphone", ikon: "📱" },
    { id: "laptop", nama: "Laptop", ikon: "💻" },
    { id: "washer", nama: "Washer", ikon: "🫧" },
    { id: "wearable", nama: "Wearable Tech", ikon: "⌚" },
    { id: "audio", nama: "Audio", ikon: "🎧" }
  ],

  /* toko & pembayaran — isi dengan data toko asli saat database siap */
  toko: {
    nama: "Toko SORTIK",
    alamat: "Jl. Elektronik No. 21, Kota Bandung",
    jam: "Senin–Sabtu, 09.00–20.00 WIB",
    wa: "6281200001122",
    ongkir: 25000,
    rekening: [{ bank: "BCA", nomor: "1234567890", atasNama: "Admin SORTIK" }]
  },

  /* denah rak toko: baris A–F × 4 kolom */
  rak: { baris: "ABCDEF", kolom: 4 },

  produk: [
    { id: 1, nama: "Samsung Galaxy A26 5G 8GB/256GB", kategori: "handphone", harga: 4999000, stok: 12, rak: "A1", ikon: "📱", deskripsi: "Ponsel 5G layar Super AMOLED 6,7 inci, RAM 8 GB, memori 256 GB, dan baterai 5.000 mAh." },
    { id: 2, nama: "Vivo Y500 4G 8GB/256GB", kategori: "handphone", harga: 5499000, stok: 8, rak: "A2", ikon: "📱", deskripsi: "Ponsel 4G dengan baterai jumbo 6.500 mAh, pengisian cepat 90W, dan layar 120 Hz." },
    { id: 3, nama: "Apple iPhone 17 Pro Max", kategori: "handphone", harga: 24499000, stok: 4, rak: "A3", ikon: "📱", deskripsi: "Flagship Apple dengan chip A19 Pro, kamera utama 48 MP, dan bodi titanium." },
    { id: 4, nama: "Xiaomi Redmi Note 14 5G", kategori: "handphone", harga: 3199000, stok: 15, rak: "A4", ikon: "📱", deskripsi: "Ponsel 5G kelas menengah: layar AMOLED 120 Hz dan kamera 50 MP dengan OIS." },
    { id: 5, nama: "Asus Vivobook 14 (i3/5)", kategori: "laptop", harga: 6700000, stok: 6, rak: "B1", ikon: "💻", deskripsi: "Laptop 14 inci untuk kerja harian dengan Intel Core i3, RAM 8 GB, dan SSD 512 GB." },
    { id: 6, nama: "Acer Lite AL14 (Intel N100)", kategori: "laptop", harga: 8050000, stok: 3, rak: "B2", ikon: "💻", deskripsi: "Laptop ringan 14 inci dengan Intel N100 — hemat daya, cocok untuk sekolah dan kerja ringan." },
    { id: 7, nama: "Samsung Galaxy Book4", kategori: "laptop", harga: 9999000, stok: 5, rak: "B3", ikon: "💻", deskripsi: "Laptop tipis 15,6 inci dengan Intel Core 5, layar anti-glare, dan baterai tahan seharian." },
    { id: 8, nama: "Bosch Mesin Cuci Front Loading 8 KG", kategori: "washer", harga: 7909000, stok: 4, rak: "C1", ikon: "🫧", deskripsi: "Mesin cuci front loading 8 kg dengan 15 program dan motor inverter yang senyap serta hemat listrik." },
    { id: 9, nama: "Aqua Mesin Cuci 2 Tabung 8 Kg", kategori: "washer", harga: 2299000, stok: 7, rak: "C2", ikon: "🫧", deskripsi: "Mesin cuci 2 tabung 8 kg dengan pengering 6 kg, tangguh untuk pemakaian harian." },
    { id: 10, nama: "JBL Live Free 2 TWS", kategori: "audio", harga: 1649500, stok: 10, rak: "D1", ikon: "🎧", deskripsi: "TWS JBL dengan hybrid noise cancelling, suara JBL Signature, dan daya tahan hingga 35 jam." },
    { id: 11, nama: "Sony Personal Earphone TWS WF-C710N", kategori: "audio", harga: 1509000, stok: 9, rak: "D2", ikon: "🎧", deskripsi: "Earphone TWS ringan dengan noise cancelling dan koneksi multipoint dua perangkat sekaligus." },
    { id: 12, nama: "Roadmaster Speaker Aktif Partyflash28", kategori: "audio", harga: 3278000, stok: 5, rak: "D3", ikon: "🔊", deskripsi: "Speaker aktif 28 inci dengan lampu LED, bluetooth, USB, dan mikrofon nirkabel untuk acara." },
    { id: 13, nama: "KJB Passive Speaker 081-PA", kategori: "audio", harga: 1429000, stok: 6, rak: "D4", ikon: "🔊", deskripsi: "Speaker pasif 8 inci 150 watt untuk panggung dan ruang serbaguna." },
    { id: 14, nama: "Roadmaster Speaker Aktif KD-Pro12USBST", kategori: "audio", harga: 2021000, stok: 3, rak: "E1", ikon: "🔊", deskripsi: "Speaker aktif 12 inci serba bisa: bluetooth, USB/SD, dan dua input mikrofon." },
    { id: 15, nama: "Polytron Speaker Aktif PAS8BF22", kategori: "audio", harga: 2265000, stok: 4, rak: "E2", ikon: "🔊", deskripsi: "Speaker aktif 8 inci dengan fitur karaoke, bluetooth, dan remote control." },
    { id: 16, nama: "Apple Watch SE (GPS 40mm)", kategori: "wearable", harga: 3499000, stok: 6, rak: "F1", ikon: "⌚", deskripsi: "Smartwatch GPS 40 mm dengan deteksi detak jantung, pemantau tidur, dan tahan air 50 m." },
    { id: 17, nama: "Xiaomi Redmi Watch 5", kategori: "wearable", harga: 899000, stok: 11, rak: "F2", ikon: "⌚", deskripsi: "Smartwatch layar AMOLED 2,07 inci, baterai hingga 20 hari, dan 150+ mode olahraga." }
  ],

  statistik: [
    { label: "Booking Aktif", nilai: 2 },
    { label: "Pesanan Diproses", nilai: 1 },
    { label: "Siap Diambil", nilai: 1 }
  ],

  /* pesanan merujuk ke produk (foreign key), bukan menyalin nama/harga.
     lunas & staff diisi staff toko di halaman kelola pesanan */
  pesanan: [
    { id: 1, produk: 1, pembeli: "Rina Kartika", jumlah: 1, status: "Menunggu", tanggal: "2026-09-01", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: false, staff: "" },
    { id: 2, produk: 10, pembeli: "Rina Kartika", jumlah: 1, status: "Diproses", tanggal: "2026-08-27", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Merdeka No. 8, Bandung", lunas: true, staff: "Bagas Prasetyo" },
    { id: 3, produk: 13, pembeli: "Rina Kartika", jumlah: 1, status: "Siap", tanggal: "2026-08-03", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" },
    { id: 4, produk: 12, pembeli: "Rina Kartika", jumlah: 1, status: "Selesai", tanggal: "2026-07-13", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" }
  ]
};

/* ---------- util bersama ---------- */
const el = (id) => document.getElementById(id);
const isi = (id, html) => { const x = el(id); if (x) x.innerHTML = html; };
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const produkById = (id) => db.produk.find((p) => p.id === id) || {};

/* nama kategori dari id-nya (kartu, deskripsi, halaman staff) */
const namaKat = Object.fromEntries(db.kategori.map((k) => [k.id, k.nama]));
const kat = (p) => namaKat[p.kategori] || p.kategori;

/* daftar kode rak dari db.rak: A1 … F4 (dipakai cari, tata rak, kelola barang) */
const semuaRak = () => db.rak.baris.split("").flatMap((b) => Array.from({ length: db.rak.kolom }, (_, i) => `${b}${i + 1}`));

/* kode & tanggal pesanan (dipakai halaman pembeli maupun staff) */
const bln = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");
const tglID = (s) => { const [y, m, d] = s.split("-"); return `${d} ${bln[m - 1]} ${y}`; };
const kodePesanan = (o) => `BK-2026-${String(o.id).padStart(3, "0")}`;

/* satu kartu produk (cari.js + produk.js). Klik = buka deskripsi produk. */
const kartu = (p) => `<a class="pcard" href="produk.html?id=${p.id}">
  <div class="pimg">${p.ikon || "📦"}</div>
  <div>
    <h3>${p.nama}</h3>
    <span class="pcat">${kat(p)}</span>
    <b>${rp(p.harga)}</b>
    <span class="pstok">Stok: ${p.stok} unit · Rak ${p.rak}</span>
  </div>
</a>`;

/* status pesanan -> kelas badge, status bayar -> kelas tag */
const warna = { Menunggu: "wait", Diproses: "proc", Siap: "ok", Selesai: "done" };
const tagBayar = (o) => (o.lunas
  ? `<span class="tag lunas">Lunas${o.staff ? " · " + o.staff : ""}</span>`
  : `<span class="tag belum">Belum dibayar</span>`);

/* ---------- penyimpanan sementara di browser ----------
   */
const baca = (k, d = []) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const tulis = (k, v) => localStorage.setItem(k, JSON.stringify(v));

db.rak = baca("rak", db.rak);
db.produk = baca("produk", db.produk);
db.pesanan = baca("pesanan", db.pesanan);

/* ---------- keranjang pembeli (sementara di browser) ----------
   GET/POST /api/keranjang -> tabel keranjang (user_id, produk_id, jumlah).
   Harga tidak ikut disimpan; selalu dihitung dari db.produk. */
const keranjang = baca("keranjang");
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const perbaruiBadge = () => isi("jml", jmlKeranjang() || "");
const simpanKeranjang = () => { tulis("keranjang", keranjang); perbaruiBadge(); };

/* ---------- sidebar ----------
   Satu markup untuk semua halaman; menu dipilih otomatis dari folder yang
   sedang dibuka (/staff/ -> menu staff, sisanya -> menu pembeli). */
const MENU = {
  pembeli: [
    ["🏠", "Beranda", "index.html"],
    ["🔍", "Cari Produk & Rak", "cari.html"],
    ["🛒", "Keranjang", "checkout.html", '<b class="badge" id="jml"></b>'],
    ["📋", "Pesan & Booking", "pesan.html"],
    ["🕘", "Riwayat", "riwayat.html"]
  ],
  staff: [
    ["🏠", "Beranda", "index.html"],
    ["🧱", "Tata Rak", "rak.html"],
    ["📦", "Kelola Barang", "produk.html"],
    ["📋", "Kelola Pesanan", "pesanan.html"]
  ]
};

function side(peran) {
  const s = peran === "staff" ? db.staff : db.user;
  const file = location.pathname.split("/").pop() || "index.html";
  isi("side", `<a class="logo" href="../auth/login.html">
  <img src="../assets/img/SortikLogo.jpeg" alt="" width="34"><b>SORTIK</b>
</a>
<nav>${MENU[peran].map(([ikon, label, href, extra = ""]) =>
    `<a${href === file ? ' class="on"' : ""} href="${href}">${ikon} ${label} ${extra}</a>`).join("")}</nav>
<div class="me"><div class="avatar">${s.inisial}</div><div><b>${s.nama}</b><span>${s.role}</span></div></div>`);
}

side(location.pathname.includes("/staff/") ? "staff" : "pembeli");
perbaruiBadge();
