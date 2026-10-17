/* SORTIK — inti bersama: data contoh, util, sesi, sidebar, dan mesin kelola.
   Halaman lain hanya membaca `db` lewat util di sini, jadi saat backend siap
   cukup ganti isi `db` dengan hasil GET /api/db dan isi `simpan()`. */

const db = {
  kategori: [
    { id: "handphone", nama: "Handphone", ikon: "📱" },
    { id: "laptop", nama: "Laptop", ikon: "💻" },
    { id: "washer", nama: "Washer", ikon: "🫧" },
    { id: "wearable", nama: "Wearable Tech", ikon: "⌚" },
    { id: "audio", nama: "Audio", ikon: "🎧" }
  ],

  toko: {
    nama: "Toko SORTIK",
    alamat: "Jl. Elektronik No. 21, Kota Bandung",
    jam: "Senin–Sabtu, 09.00–20.00 WIB",
    wa: "6281200001122",
    ongkir: 25000,
    rekening: [{ bank: "BCA", nomor: "1234567890", atasNama: "Admin SORTIK" }]
  },

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

  /* pesanan merujuk produk lewat id, bukan salinan nama/harga */
  pesanan: [
    { id: 1, produk: 1, pembeli: "Rina Kartika", jumlah: 1, status: "Menunggu", tanggal: "2026-09-01", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: false, staff: "" },
    { id: 2, produk: 10, pembeli: "Rina Kartika", jumlah: 1, status: "Diproses", tanggal: "2026-08-27", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Merdeka No. 8, Bandung", lunas: true, staff: "Bagas Prasetyo" },
    { id: 3, produk: 13, pembeli: "Rina Kartika", jumlah: 1, status: "Siap", tanggal: "2026-08-03", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" },
    { id: 4, produk: 12, pembeli: "Rina Kartika", jumlah: 1, status: "Selesai", tanggal: "2026-07-13", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" }
  ],

  pengguna: [
    { id: 1, nama: "Rina Kartika", email: "rina@mail.com", role: "pembeli", status: "aktif" },
    { id: 2, nama: "Bagas Prasetyo", email: "bagas@sortik.id", role: "staff", status: "aktif" },
    { id: 3, nama: "Dewi Lestari", email: "dewi@sortik.id", role: "admin", status: "aktif" },
    { id: 4, nama: "Andi Saputra", email: "andi@mail.com", role: "pembeli", status: "aktif" },
    { id: 5, nama: "Sari Melati", email: "sari@mail.com", role: "pembeli", status: "nonaktif" }
  ]
};

/* ---------- util ---------- */
const el = (id) => document.getElementById(id);
const isi = (id, html) => { const x = el(id); if (x) x.innerHTML = html; };
const rp = (n) => "Rp " + (+n || 0).toLocaleString("id-ID");
const kat = (p) => (db.kategori.find((k) => k.id === p.kategori) || {}).nama || p.kategori || "-";
const produkById = (id) => db.produk.find((p) => p.id === id) || {};
const nilaiPesanan = (o) => (produkById(o.produk).harga || 0) * o.jumlah;
const semuaRak = () => db.rak.baris.split("").flatMap((b) => Array.from({ length: db.rak.kolom }, (_, i) => `${b}${i + 1}`));

const bln = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");
const tglID = (s) => { const [y, m, d] = s.split("-"); return `${d} ${bln[m - 1]} ${y}`; };
const kodePesanan = (o) => `BK-${o.tanggal.slice(0, 4)}-${String(o.id).padStart(3, "0")}`;

const STATUS = { Menunggu: "wait", Diproses: "proc", Siap: "ok", Selesai: "done" };
const tagBayar = (o) => (o.lunas
  ? `<span class="tag lunas">Lunas${o.staff ? " · " + o.staff : ""}</span>`
  : `<span class="tag belum">Belum dibayar</span>`);

const kartu = (p) => `<a class="pcard" href="produk.html?id=${p.id}">
  <div class="pimg">${p.ikon || "📦"}</div>
  <div>
    <h3>${p.nama}</h3>
    <span class="pcat">${kat(p)}</span>
    <b>${rp(p.harga)}</b>
    <span class="pstok${p.stok ? "" : " habis"}">${p.stok ? `Stok: ${p.stok} unit · Rak ${p.rak}` : "Stok habis"}</span>
  </div>
</a>`;

/* notifikasi singkat; satu elemen dipakai ulang supaya tidak menumpuk */
function notif(teks) {
  let t = el("notif");
  if (!t) {
    t = document.createElement("div");
    t.id = "notif";
    document.body.appendChild(t);
  }
  t.textContent = teks;
  t.classList.add("tampil");
  clearTimeout(notif.waktu);
  notif.waktu = setTimeout(() => t.classList.remove("tampil"), 2200);
}

/* denah rak A1… — `jumlah` = { kode: banyak barang }; sel jadi tombol bila `klik` */
function denahRak(wadah, jumlah = {}, { klik = true, aktif = "" } = {}) {
  const sel = klik ? "button" : "span";
  el(wadah).style.gridTemplateColumns = `auto repeat(${db.rak.kolom}, minmax(0, 1fr))`;
  isi(wadah, db.rak.baris.split("").map((b) =>
    `<span class="rlbl">Rak ${b}</span>` +
    Array.from({ length: db.rak.kolom }, (_, i) => {
      const kode = `${b}${i + 1}`, n = jumlah[kode] || 0;
      return `<${sel} class="rcell${n ? " ada" : ""}${kode === aktif ? " on" : ""}" data-rak="${kode}"${klik ? ' type="button"' : ""}>`
        + (klik ? `${kode}<i>${n || ""}</i>` : n || "") + `</${sel}>`;
    }).join("")
  ).join(""));
}

/* chip filter — `opsi` = [[nilai, label]], nilai "" berarti Semua */
function chipSaring(wadah, opsi, terapkan) {
  let pilih = "";
  isi(wadah, opsi.map(([nilai, label]) => `<button type="button" data-nilai="${nilai}">${label}</button>`).join(""));
  const tandai = () => el(wadah).querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.nilai === pilih));
  el(wadah).addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    pilih = pilih === b.dataset.nilai ? "" : b.dataset.nilai;
    tandai();
    terapkan(pilih);
  });
  tandai();
}

/* ---------- penyimpanan browser ----------
   Satu koleksi = satu endpoint: /api/<koleksi>, /api/<koleksi>/<id>. */
const VERSI = "sortik2:";
const KOLEKSI = ["kategori", "toko", "rak", "produk", "pesanan", "pengguna"];
const baca = (k, d) => { try { return JSON.parse(localStorage.getItem(VERSI + k)) ?? d; } catch { return d; } };
const simpan = (k) => localStorage.setItem(VERSI + k, JSON.stringify(db[k]));
KOLEKSI.forEach((k) => (db[k] = baca(k, db[k])));

/* keranjang: { produk: id, jumlah } — harga selalu dihitung dari db.produk */
const keranjang = baca("keranjang", []);
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const simpanKeranjang = () => {
  localStorage.setItem(VERSI + "keranjang", JSON.stringify(keranjang));
  const badge = el("jml");
  if (badge) badge.textContent = jmlKeranjang() || "";
};

/* ---------- sesi & sidebar ----------
   Peran dibaca dari folder halaman; dengan backend: GET /api/sesi. */
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const NAMA = { pembeli: "Rina Kartika", staff: "Bagas Prasetyo", admin: "Dewi Lestari" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";
db.akun = {
  peran,
  role: PERAN[peran],
  nama: NAMA[peran],
  inisial: NAMA[peran].split(" ").map((w) => w[0]).join("").slice(0, 2)
};

const pesananku = () => db.pesanan.filter((o) => o.pembeli === db.akun.nama);

/* [ikon, label desktop, href, ekstra, label mobile] */
const MENU = {
  pembeli: [
    ["🏠", "Beranda", "index.html", "", "Beranda"],
    ["🔍", "Cari Produk & Rak", "cari.html", "", "Cari"],
    ["🛒", "Keranjang", "checkout.html", `<b class="badge" id="jml">${jmlKeranjang() || ""}</b>`, "Keranjang"],
    ["📋", "Pesan & Booking", "pesan.html", "", "Pesan"],
    ["🕘", "Riwayat", "riwayat.html", "", "Riwayat"]
  ],
  staff: [
    ["🏠", "Beranda", "index.html", "", "Beranda"],
    ["🧱", "Tata Rak", "rak.html", "", "Rak"],
    ["📦", "Kelola Barang", "produk.html", "", "Barang"],
    ["📋", "Kelola Pesanan", "pesanan.html", "", "Pesanan"]
  ],
  admin: [
    ["🏠", "Beranda", "index.html", "", "Beranda"],
    ["👥", "Kelola Pengguna", "pengguna.html", "", "Pengguna"],
    ["⚙️", "Pengaturan Toko", "pengaturan.html", "", "Toko"]
  ]
};

{
  const berkas = location.pathname.split("/").pop() || "index.html";
  isi("side", `<a class="logo" href="index.html">
  <img src="../assets/img/SortikLogo.jpeg" alt="" width="34"><b>SORTIK</b>
</a>
<nav>${MENU[peran].map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}"><span class="ikon">${ikon}</span> <span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</nav>
<div class="me"><div class="avatar">${db.akun.inisial}</div><div><b>${db.akun.nama}</b><span>${db.akun.role}</span></div>
<a class="keluar" href="../auth/login.html">Keluar</a></div>`);
}

/* ---------- mesin kelola: daftar + form tambah/ubah + hapus ----------
   Dipakai Kelola Barang (staff), Kelola Pengguna & Kategori (admin).
   `kolom` = [[field, label, jenis, opsi]]; jenis: text | angka | email | pilih | area.
   `baru(data)` boleh mengembalikan null untuk menolak; `cek(item)` mengembalikan
   pesan alasan barang tidak boleh dihapus. */
function kelola({ wadah, kunci, nama, kolom, baris, kode = "", petunjuk = "Cari...", cari, urut, baru, cek }) {
  el(wadah).innerHTML = `<div class="formblok" id="${wadah}-blok" hidden>
  <h2 id="${wadah}-judul"></h2>
  <form class="form" id="${wadah}-form"></form>
</div>
<div class="toolbar">
  <input type="search" id="${wadah}-q" class="grow" placeholder="${petunjuk}" autocomplete="off">
  <button class="btn" type="button" data-tambah>+ Tambah ${nama}</button>
</div>
<p class="hasil" id="${wadah}-hasil"></p>
<div id="${wadah}-list"></div>`;

  let tampil = [];
  let ubah = null; /* baris yang sedang diubah; null = mode tambah */

  const TIPE = { angka: "number", email: "email" };
  const medan = ([f, label, jenis, opsi = []]) => {
    const id = `${wadah}-${f}`;
    const pilihan = typeof opsi === "function" ? opsi() : opsi;
    const kontrol = jenis === "pilih"
      ? `<select id="${id}" data-f="${f}">${pilihan.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`
      : jenis === "area" ? `<textarea id="${id}" data-f="${f}" rows="3"></textarea>`
        : `<input id="${id}" data-f="${f}" type="${TIPE[jenis] || "text"}">`;
    return `<div${jenis === "area" ? ' class="full"' : ""}><label class="lbl" for="${id}">${label}</label>${kontrol}</div>`;
  };

  function buka(x = null) {
    ubah = x;
    isi(`${wadah}-judul`, x ? `Ubah ${nama} · ${kode}${String(x.id).padStart(3, "0")}` : `Tambah ${nama}`);
    isi(`${wadah}-form`, kolom.map(medan).join("") +
      `<div class="btns full"><button class="primary" type="submit">Simpan</button>
      <button class="btn" type="button" data-batal>Batal</button></div>`);
    kolom.forEach(([f]) => { const x2 = el(`${wadah}-${f}`); if (x2 && x && x[f] != null) x2.value = x[f]; });
    el(`${wadah}-blok`).hidden = false;
    el(`${wadah}-blok`).scrollIntoView();
    el(`${wadah}-${kolom[0][0]}`).focus();
  }

  function simpanBaris() {
    const data = {};
    el(`${wadah}-form`).querySelectorAll("[data-f]").forEach((x) => {
      data[x.dataset.f] = x.type === "number" ? +x.value || 0 : x.value.trim();
    });
    const pertama = el(`${wadah}-${kolom[0][0]}`);
    if (!data[kolom[0][0]]) return pertama.focus();
    if (ubah) Object.assign(ubah, data);
    else {
      const x = baru ? baru(data) : { id: Math.max(0, ...db[kunci].map((y) => y.id)) + 1, ...data };
      if (!x) return;
      db[kunci].push(x);
    }
    simpan(kunci);
    notif(`${nama} ${ubah ? "diperbarui" : "ditambahkan"}`);
    el(`${wadah}-blok`).hidden = true;
    gambar();
  }

  function hapus(i) {
    const x = tampil[i];
    const salah = cek && cek(x);
    if (salah) return alert(salah);
    if (!confirm(`Hapus "${x[kolom[0][0]]}" dari daftar ${nama.toLowerCase()}?`)) return;
    if (x === ubah) el(`${wadah}-blok`).hidden = true;
    db[kunci].splice(db[kunci].indexOf(x), 1);
    simpan(kunci);
    notif(`${nama} dihapus`);
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

  el(wadah).addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.ubah != null) return buka(tampil[+b.dataset.ubah]);
    if (b.dataset.hapus != null) return hapus(+b.dataset.hapus);
    if (b.dataset.tambah != null) return buka();
    if (b.dataset.batal != null) el(`${wadah}-blok`).hidden = true;
  });
  el(`${wadah}-form`).addEventListener("submit", (e) => { e.preventDefault(); simpanBaris(); });
  el(`${wadah}-q`).addEventListener("input", gambar);

  gambar();

  const awal = +new URLSearchParams(location.search).get("id");
  if (awal) { const x = tampil.find((y) => y.id === awal); if (x) buka(x); }
}

/* Esc menutup form kelola atau detail pesanan yang sedang terbuka */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".formblok:not([hidden])").forEach((x) => (x.hidden = true));
  const detail = el("detail");
  if (detail && !detail.hidden) {
    detail.hidden = true;
    const daftar = el("daftar");
    if (daftar) daftar.hidden = false;
  }
});
