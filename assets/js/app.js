/* SORTIK — data & util bersama (halaman pembeli, staff, dan admin)
  Satu-satunya berkas yang tahu bentuk data. Saat pindah ke database, cukup
  diganti sekali di sini:
     Object.assign(db, await (await fetch("/api/db")).json());
   Nama field sengaja mengikuti kolom tabel yang dibutuhkan:
     kategori -> id, nama, ikon
     produk   -> id, nama, kategori, harga, stok, rak, ikon, deskripsi  (ikon nanti: gambar)
     rak      -> baris (A–F), kolom
     pesanan  -> id, produk (id produk), pembeli (nama pemesan), jumlah, status,
                 tanggal, cara ("ambil"|"antar"), bayar ("Transfer ke admin"|"Bayar di kasir"),
                 alamat, lunas (bool), staff (nama staff yang mengonfirmasi bayar)
     pengguna -> id, nama, email, role ("pembeli"|"staff"|"admin"), status ("aktif"|"nonaktif")
     toko     -> nama, alamat, jam, wa, ongkir, rekening (bank, nomor, atasNama)
     keranjang-> produk (id produk), jumlah  (di server + user_id dari sesi)
     akun     -> pengguna yang sedang masuk (dari sesi; lihat AKUN di bawah)
   Halaman pembeli, staff, dan admin hanya membaca `db` lewat util di bawah, jadi
   tidak perlu diubah saat data pindah ke DB. */

const db = {
  /* ---------- data toko ---------- */
  kategori: [
    { id: "handphone", nama: "Handphone", ikon: "📱" },
    { id: "laptop", nama: "Laptop", ikon: "💻" },
    { id: "washer", nama: "Washer", ikon: "🫧" },
    { id: "wearable", nama: "Wearable Tech", ikon: "⌚" },
    { id: "audio", nama: "Audio", ikon: "🎧" }
  ],

  /* toko & pembayaran — diubah admin di admin/pengaturan.html */
  toko: {
    nama: "Toko SORTIK",
    alamat: "Jl. Elektronik No. 21, Kota Bandung",
    jam: "Senin–Sabtu, 09.00–20.00 WIB",
    wa: "6281200001122",
    ongkir: 25000,
    rekening: [{ bank: "BCA", nomor: "1234567890", atasNama: "Admin SORTIK" }]
  },

  /* denah rak toko: baris A–F × 4 kolom (diatur staff di staff/rak.html) */
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

  /* pesanan merujuk ke produk (foreign key), bukan menyalin nama/harga.
     lunas & staff diisi staff toko di halaman kelola pesanan */
  pesanan: [
    { id: 1, produk: 1, pembeli: "Rina Kartika", jumlah: 1, status: "Menunggu", tanggal: "2026-09-01", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: false, staff: "" },
    { id: 2, produk: 10, pembeli: "Rina Kartika", jumlah: 1, status: "Diproses", tanggal: "2026-08-27", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Merdeka No. 8, Bandung", lunas: true, staff: "Bagas Prasetyo" },
    { id: 3, produk: 13, pembeli: "Rina Kartika", jumlah: 1, status: "Siap", tanggal: "2026-08-03", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" },
    { id: 4, produk: 12, pembeli: "Rina Kartika", jumlah: 1, status: "Selesai", tanggal: "2026-07-13", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" }
  ],

  /* akun pengguna — dikelola admin di admin/pengguna.html */
  pengguna: [
    { id: 1, nama: "Rina Kartika", email: "rina@mail.com", role: "pembeli", status: "aktif" },
    { id: 2, nama: "Bagas Prasetyo", email: "bagas@sortik.id", role: "staff", status: "aktif" },
    { id: 3, nama: "Dewi Lestari", email: "dewi@sortik.id", role: "admin", status: "aktif" },
    { id: 4, nama: "Andi Saputra", email: "andi@mail.com", role: "pembeli", status: "aktif" },
    { id: 5, nama: "Sari Melati", email: "sari@mail.com", role: "pembeli", status: "nonaktif" }
  ]
};

/* ---------- util bersama ---------- */
const el = (id) => document.getElementById(id);
const isi = (id, html) => { const x = el(id); if (x) x.innerHTML = html; };
const rp = (n) => "Rp " + n.toLocaleString("id-ID");

/* kategori dibaca ulang dari db setiap kali, jadi kategori baru langsung terpakai */
const kat = (p) => (db.kategori.find((k) => k.id === p.kategori) || {}).nama || p.kategori;

/* semua data yang merujuk produk lewat id, bukan salinan */
const produkById = (id) => db.produk.find((p) => p.id === id) || {};
const nilaiPesanan = (o) => (produkById(o.produk).harga || 0) * o.jumlah;

/* kode rak dari db.rak: A1 … F4 (dipakai cari, tata rak, kelola barang) */
const semuaRak = () => db.rak.baris.split("").flatMap((b) => Array.from({ length: db.rak.kolom }, (_, i) => `${b}${i + 1}`));

/* kode & tanggal pesanan (pesanan, staff, admin) */
const bln = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");
const tglID = (s) => { const [y, m, d] = s.split("-"); return `${d} ${bln[m - 1]} ${y}`; };
const kodePesanan = (o) => `BK-${o.tanggal.slice(0, 4)}-${String(o.id).padStart(3, "0")}`;

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
   Satu daftar koleksi yang bisa diubah lewat halaman, sekaligus endpoint
   tulisnya saat backend siap. Menambah koleksi baru = menambah satu baris. */
const ENDPOINT = {
  kategori: "/api/kategori",
  toko: "/api/toko",
  rak: "/api/rak",
  produk: "/api/produk",
  pesanan: "/api/pesanan",
  pengguna: "/api/pengguna"
};

/* Kunci diberi versi supaya data lama dari bentuk yang berbeda tidak terbaca
   (ganti VERSI = mulai lagi dari data contoh di atas). */
const VERSI = "sortik2:";
const baca = (k, d) => JSON.parse(localStorage.getItem(VERSI + k) || JSON.stringify(d));
const tulis = (k, v) => localStorage.setItem(VERSI + k, JSON.stringify(v));

/* satu-satunya cara menyimpan perubahan. Saat DB siap, isi fungsi ini:
   fetch(ENDPOINT[k], { method: "PUT", body: JSON.stringify(db[k]) }) */
const simpan = (k) => tulis(k, db[k]);

Object.keys(ENDPOINT).forEach((k) => (db[k] = baca(k, db[k])));

/* ---------- keranjang pembeli (sementara di browser) ----------
   GET/POST /api/keranjang -> tabel keranjang (user_id, produk_id, jumlah).
   Harga tidak ikut disimpan; selalu dihitung dari db.produk. */
const keranjang = baca("keranjang", []);
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const perbaruiBadge = () => isi("jml", jmlKeranjang() || "");
const simpanKeranjang = () => { tulis("keranjang", keranjang); perbaruiBadge(); };

/* ---------- akun yang sedang masuk ----------
   PERAN = label peran, AKUN = identitas demo tiap peran.
   Saat DB siap: GET /api/sesi -> { id, nama, role }, dan AKUN dihapus. */
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const AKUN = {
  pembeli: { nama: "Rina Kartika", inisial: "RK" },
  staff: { nama: "Bagas Prasetyo", inisial: "BP" },
  admin: { nama: "Dewi Lestari", inisial: "DL" }
};

/* peran -> folder halamannya. Peran halaman dibaca dari alamat yang dibuka,
   jadi tiga area (pembeli, staff, admin) memakai sidebar & util yang sama. */
const RUTE = { pembeli: "user", staff: "staff", admin: "admin" };
const folder = (location.pathname.match(/\/(user|staff|admin)\//) || [])[1] || "user";
const peran = Object.keys(RUTE).find((r) => RUTE[r] === folder) || "pembeli";
db.akun = { peran, role: PERAN[peran], ...AKUN[peran] };

/* pesanan milik pembeli yang sedang masuk (di server: WHERE pembeli = sesi) */
const pesananku = () => db.pesanan.filter((o) => o.pembeli === db.akun.nama);

/* ---------- sidebar ----------
   Satu markup untuk semua halaman; menunya mengikuti peran di atas, jadi
   menambah halaman cukup menambah satu baris di MENU. */
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
  ],
  admin: [
    ["🏠", "Beranda", "index.html"],
    ["👥", "Kelola Pengguna", "pengguna.html"],
    ["⚙️", "Pengaturan Toko", "pengaturan.html"]
  ]
};

{
  const berkas = location.pathname.split("/").pop() || "index.html";
  isi("side", `<a class="logo" href="../auth/login.html">
  <img src="../assets/img/SortikLogo.jpeg" alt="" width="34"><b>SORTIK</b>
</a>
<nav>${MENU[peran].map(([ikon, label, href, ekstra = ""]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}">${ikon} ${label} ${ekstra}</a>`).join("")}</nav>
<div class="me"><div class="avatar">${db.akun.inisial}</div><div><b>${db.akun.nama}</b><span>${db.akun.role}</span></div></div>`);
}

/* ---------- mesin "kelola": daftar + form tambah/ubah + hapus ----------
   Dipakai halaman kelola barang (staff), kelola pengguna & kategori (admin),
   jadi logika daftar, form, dan hapus hanya ditulis sekali.
     wadah : id elemen di HTML tempat kartu dirender
     kunci : nama koleksi di db — sekaligus endpoint (lihat ENDPOINT)
     nama  : sebutan satuannya untuk judul & pesan ("Tambah Barang")
     kolom : [field, label, jenis, opsi]  jenis: text | angka | pilih | area
             field = nama kolom database, jadi tidak perlu dipetakan lagi
     baris : html isi baris daftar, tanpa tombol Ubah/Hapus
     kode  : awalan nomor pada judul form, mis. "PRD" -> PRD-006
     cari/urut/baru/cek : opsional — lihat contoh di assets/js/staff/barang.js.
             `baru` mengembalikan baris baru, atau null untuk menolak menambah
   DB: POST /api/<kunci>, PUT /api/<kunci>/<id>, DELETE /api/<kunci>/<id> */
function kelola({ wadah, kunci, nama, kolom, baris, kode = "", petunjuk = "Cari...", cari, urut, baru, cek }) {
  el(wadah).innerHTML = `<div class="formblok" id="${wadah}-form" hidden>
  <h2 id="${wadah}-judul"></h2>
  <div class="form" id="${wadah}-isi"></div>
</div>
<div class="toolbar">
  <input type="search" id="${wadah}-q" class="grow" placeholder="${petunjuk}" autocomplete="off">
  <button class="btn" type="button" id="${wadah}-tambah">+ Tambah ${nama}</button>
</div>
<p class="hasil" id="${wadah}-hasil"></p>
<div id="${wadah}-list"></div>`;

  let tampil = [];  /* isi daftar yang sedang tampil (indeks baris = indeks di sini) */
  let idx = -1;     /* baris yang sedang diubah; -1 = mode tambah */

  /* satu medan form: label + kontrol, dibangun dari kolom */
  const medan = ([f, label, jenis, opsi = []]) => {
    const id = `${wadah}-${f}`;
    const kontrol = jenis === "pilih"
      ? `<select id="${id}" data-f="${f}">${opsi().map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`
      : jenis === "area" ? `<textarea id="${id}" data-f="${f}" rows="3"></textarea>`
        : `<input id="${id}" data-f="${f}" type="${jenis === "angka" ? "number" : "text"}">`;
    return `<div${jenis === "area" ? ' class="full"' : ""}><label class="lbl" for="${id}">${label}</label>${kontrol}</div>`;
  };

  /* tampilkan form: tanpa item = tambah, dengan item = ubah */
  function buka(x = {}, i = -1) {
    idx = i;
    isi(`${wadah}-judul`, i < 0 ? `Tambah ${nama}` : `Ubah ${nama} · ${kode}${String(x.id).padStart(3, "0")}`);
    isi(`${wadah}-isi`, kolom.map(medan).join("") +
      `<div class="btns full"><button class="primary" type="button" id="${wadah}-simpan">Simpan</button>
      <button class="btn" type="button" id="${wadah}-batal">Batal</button></div>`);
    kolom.forEach(([f]) => { const x2 = el(`${wadah}-${f}`); if (x2 && x[f] != null) x2.value = x[f]; });
    el(`${wadah}-form`).hidden = false;
    el(`${wadah}-form`).scrollIntoView();
    el(`${wadah}-${kolom[0][0]}`).focus();
  }

  function simpanBaris() {
    const data = {};
    el(`${wadah}-isi`).querySelectorAll("[data-f]").forEach((x) => {
      data[x.dataset.f] = x.type === "number" ? +x.value || 0 : x.value.trim();
    });
    const pertama = el(`${wadah}-${kolom[0][0]}`);
    if (!data[kolom[0][0]]) return pertama.focus();          /* kolom pertama wajib */
    if (idx < 0) {
      const x = baru ? baru(data) : { id: Math.max(0, ...db[kunci].map((y) => y.id)) + 1, ...data };
      if (!x || typeof x !== "object") return;              /* hook menolak (mis. id sudah dipakai) */
      db[kunci].push(x);
    } else Object.assign(tampil[idx], data);
    simpan(kunci);
    el(`${wadah}-form`).hidden = true;
    gambar();
  }

  function hapus(i) {
    const x = tampil[i];
    const salah = cek && cek(x);                            /* hook boleh menolak penghapusan */
    if (salah) return alert(salah);
    if (!confirm(`Hapus "${x[kolom[0][0]]}" dari daftar ${nama.toLowerCase()}?`)) return;
    db[kunci].splice(db[kunci].indexOf(x), 1);
    simpan(kunci);
    gambar();
  }

  function gambar() {
    const kata = el(`${wadah}-q`).value.trim().toLowerCase();
    tampil = db[kunci].filter((x) => String(cari ? cari(x) : Object.values(x).join(" ")).toLowerCase().includes(kata));
    if (urut) tampil.sort(urut);
    isi(`${wadah}-hasil`, `${tampil.length} dari ${db[kunci].length} ${nama.toLowerCase()}`);
    isi(`${wadah}-list`, tampil.length ? tampil.map((x, i) => `<div class="row">${baris(x, i)}
  <div class="btns">
    <button class="btn" type="button" data-ubah="${i}">Ubah</button>
    <button class="btn danger" type="button" data-hapus="${i}">Hapus</button>
  </div>
</div>`).join("") : `<p class="kosong">Belum ada ${nama.toLowerCase()} yang cocok — ubah kata kunci atau tambah baru.</p>`);
  }

  /* satu pendengar untuk seluruh kartu: tombol form, ubah, dan hapus */
  el(wadah).addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.ubah != null) return buka(tampil[+b.dataset.ubah], +b.dataset.ubah);
    if (b.dataset.hapus != null) return hapus(+b.dataset.hapus);
    if (b.id.endsWith("-tambah")) return buka();
    if (b.id.endsWith("-batal")) return (el(`${wadah}-form`).hidden = true);
    if (b.id.endsWith("-simpan")) return simpanBaris();
  });
  el(`${wadah}-q`).addEventListener("input", gambar);

  gambar();

  /* ?id=6 di alamat -> langsung buka form ubah (tautan dari beranda staff) */
  const awal = +new URLSearchParams(location.search).get("id");
  if (awal) { const i = tampil.findIndex((x) => x.id === awal); if (i > -1) buka(tampil[i], i); }
}

perbaruiBadge();
