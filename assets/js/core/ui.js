/* SORTIK, util & komponen tampilan bersama. */

/* util singkat */
const el = (id) => document.getElementById(id);

/* isi(): isi HTML + gambar ikon yang baru */
const isi = (id, html) => {
  const x = el(id);
  if (!x) return;
  x.innerHTML = html;
  gambarIkon();
};
const rp = (n) => "Rp " + (+n || 0).toLocaleString("id-ID");
const kat = (p) => (db.kategori.find((k) => k.id === p.kategori) || {}).nama || p.kategori || "-";
/* ikon kategori Lucide; cadangan package bila nama ikon belum diatur */
const ikonKategori = (k) => (k && k.lucide)
  ? `<span class="ikon" data-lucide="${k.lucide}"></span>`
  : `<span class="ikon" data-lucide="${(k && k.ikon) || "package"}"></span>`;

/* ubah <span data-lucide> jadi ikon; aman dipanggil kapan pun */
function gambarIkon() {
  if (!window.lucide) return;
  window.lucide.createIcons();
  /* hapus penanda agar tidak diproses ulang */
  document.querySelectorAll("svg[data-lucide]").forEach((s) => s.removeAttribute("data-lucide"));
}
/* produk disimpan per toko dan id produk bisa sama di toko lain, jadi
   pencarian produk butuh id tokonya; tanpa id, pakai toko aktif */
const produkDi = (tokoId, id) => {
  const t = tokoId && tokoId !== db.aktifToko ? semuaToko.find((x) => x.id === tokoId) : null;
  return (((t || db).produk) || []).find((p) => p.id === id) || {};
};
const produkById = (id) => produkDi(db.aktifToko, id);
const produkPesanan = (o) => produkDi(o.toko || db.aktifToko, o.produk);
/* harga jual = harga − diskon% (0–100, dibulatkan ke ratusan agar rapi) */
const hargaJual = (p) => {
  const diskon = Math.max(0, Math.min(100, (p && p.diskon) || 0));
  return Math.round(((p && p.harga) || 0) * (1 - diskon / 100) / 100) * 100;
};
/* nilaiBarang = harga × jumlah; harga dikunci saat pesanan dibuat jadi ubah
   diskon belakangan tidak mengubah riwayat. nilaiPesanan menambah ongkir. */
const nilaiBarang = (o) => (o.harga != null ? o.harga : hargaJual(produkPesanan(o))) * o.jumlah;
/* Ongkir satu pembelian dicatat sekali saja (baris pertama): tiap baris = satu barang,
   bukan satu pesanan, jadi ongkir tidak boleh dikalikan jumlah baris.
   shortcut: benar-benar rapi kalau satu pesanan bisa banyak barang (audit-002 nomor 01). */
const nilaiPesanan = (o) => nilaiBarang(o) + (o.ongkir || 0);
/* total unit terjual satu produk (dari seluruh pesanan), untuk badge/urutan Terlaris */
const jmlTerjual = (id) => db.pesanan.reduce((n, o) => n + (bukanBatal(o) && o.produk === id ? o.jumlah : 0), 0);
/* lantai & rak */
/* denah kini bisa beberapa lantai: db.rak.lantai = [{ nama, lebar, tinggi,
   pintu: { sisi, pos }, daftar: [rak] }]; db.rak.aktif = lantai yang tampil */
const lantaiIni = () => db.rak.lantai[Math.min(db.rak.aktif || 0, db.rak.lantai.length - 1)]
  || { nama: "Lantai 1", lebar: 24, tinggi: 18, pintu: { sisi: "bawah", pos: 7 }, daftar: [] };
const daftarRak = () => lantaiIni().daftar || [];
/* semua kode rak dari seluruh lantai (kode unik antar lantai) */
const semuaRak = () => db.rak.lantai.flatMap((l) => (l.daftar || []).map((r) => r.kode)).sort();
/* label rak + lantainya, mis. "A1 · Lantai 2"; disingkat bila cuma satu lantai */
const labelRak = (kode) => {
  const i = lantaiDari(kode);
  return i >= 0 && db.rak.lantai.length > 1 ? `${kode} · ${db.rak.lantai[i].nama}` : String(kode);
};
/* nomor lantai tempat rak berkode itu (−1 bila tidak ketemu) */
const lantaiDari = (kode) => db.rak.lantai.findIndex((l) => (l.daftar || []).some((r) => r.kode === kode));

/* loloskan HTML: nama lantai/kode rak ketikan pengguna jadi aman */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const bln = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");
const tglID = (s) => { const [y, m, d] = String(s).split("-"); return `${d} ${bln[m - 1]} ${y}`; };
const kodePesanan = (o) => `BK-${o.tanggal.slice(0, 4)}-${String(o.id).padStart(3, "0")}`;

/* kelas warna status pesanan: Menunggu → wait, dst. */
const STATUS = { Menunggu: "wait", Diproses: "proc", Siap: "ok", Selesai: "done", Dibatalkan: "batal" };
/* urutan status pesanan */
const ALUR = ["Menunggu", "Diproses", "Siap", "Selesai"];
/* status akhir: pesanan dibatalkan tidak dihapus, barisnya tetap jadi catatan */
const BATAL = "Dibatalkan";
const bukanBatal = (o) => o.status !== BATAL;
/* pesanan yang masih perlu dipantau pembeli maupun staff */
const pesananJalan = (o) => o.status !== "Selesai" && bukanBatal(o);
/* ikon Lucide per status, penanda visual di daftar & chip */
const IKON_STATUS = { Menunggu: "clock", Diproses: "loader", Siap: "package-check", Selesai: "circle-check", Dibatalkan: "ban" };
const ikonStatus = (s) => `<span class="ikon" data-lucide="${IKON_STATUS[s] || "circle"}"></span>`;
const tagStatus = (s) => `<em class="${STATUS[s] || ""}">${ikonStatus(s)}${s}</em>`;
const tagBayar = (o) => (o.lunas
  ? `<span class="tag lunas">Lunas${o.staff ? " · " + o.staff : ""}</span>`
  : `<span class="tag belum">Belum dibayar</span>`);

/* pindah status; stok hanya bergerak pada pesanan yang sudah lunas, jadi
   pembatalan mengembalikan barang dan pengaktifan lagi mengambilnya kembali.
   Hanya untuk toko aktif (pakai db.produk); mengembalikan true bila stok berubah. */
function ubahStatus(o, baru) {
  const dulu = o.status;
  if (dulu === baru) return false;
  o.status = baru;
  const p = produkById(o.produk);
  if (!p.id || !o.lunas) return false;
  if (baru === BATAL) { p.stok += o.jumlah; return true; }
  if (dulu === BATAL) { p.stok = Math.max(0, p.stok - o.jumlah); return true; }
  return false;
}

/* periksa uang & status pesanan; hanya berbunyi kalau logikanya berubah */
function ujiAlur() {
  const contoh = { harga: 1000, jumlah: 2, ongkir: 500, status: "Menunggu" };
  console.assert(nilaiBarang(contoh) === 2000 && nilaiPesanan(contoh) === 2500, "uang pesanan salah");
  console.assert(!bukanBatal({ status: BATAL }) && !pesananJalan({ status: "Selesai" }) && pesananJalan(contoh), "status pesanan salah");
}

/* papan kosong; tombol = [href, label] */
const pesanKosong = (ikon, teks, tombol) =>
  `<p class="kosong"><span class="ikon" data-lucide="${ikon}"></span>${teks}${tombol ? `<a class="btn" href="${tombol[0]}">${tombol[1]}</a>` : ""}</p>`;

/* foto produk */
/* foto produk: utama dulu, lalu detail; bisa tautan atau unggahan */
const galeriProduk = (p) => [p && p.foto, ...((p && p.galeri) || [])].filter(Boolean);

/* ikon cadangan saat foto kosong/gagal */
const ikonCadangan = (p) => {
  const k = db.kategori.find((x) => x.id === (p && p.kategori));
  return `<span class="ikon foto-cadangan" data-lucide="${(k && k.lucide) || "package"}"></span>`;
};

/* ikon cadangan di belakang gambar, tampil bila onerror */
const fotoHTML = (p) => {
  const utama = galeriProduk(p)[0];
  const alt = String((p && p.nama) || "Foto produk").replace(/"/g, "&quot;");
  if (!utama) return ikonCadangan(p);
  return `${ikonCadangan(p)}<img src="${utama}" alt="${alt}" loading="lazy" onerror="this.remove()">`;
};

/* kartu produk: satu tautan menutup seluruh kartu, tombol keranjang jadi
   <button> di atasnya (tautan tidak boleh memuat kontrol interaktif) */
const kartu = (p) => `<div class="pcard${p.stok ? "" : " habis"}">
  <div class="pimg">${jmlTerjual(p.id) ? `<span class="ptanda laris">Terlaris</span>` : ""}${p.diskon ? `<span class="ptanda diskon">−${p.diskon}%</span>` : ""}${fotoHTML(p)}${p.stok ? `<button class="belicepat" type="button" data-beli="${p.id}" aria-label="Tambah ${esc(p.nama)} ke keranjang"><span class="ikon" data-lucide="shopping-cart"></span></button>` : ""}</div>
  <div class="pbody">
    <span class="pcat">${kat(p)}</span>
    <h3>${esc(p.nama)}</h3>
    <b>${rp(hargaJual(p))}${p.diskon ? `<s class="hargalama">${rp(p.harga)}</s>` : ""}</b>
    <span class="pstok${p.stok ? "" : " habis"}">${p.stok ? `Stok ${p.stok} · <span class="koderak">${esc(labelRak(p.rak))}</span>` : "Stok habis"}</span>
  </div>
  <a class="plink" href="produk.html?id=${p.id}"><span class="sr">Lihat ${esc(p.nama)}</span></a>
</div>`;

/* tombol cepat "+ keranjang" di kartu, delegasi global agar berlaku di
   semua halaman yang memakai kartu (beranda, cari, produk serupa) */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-beli]");
  if (!b) return;
  e.preventDefault();
  const p = produkById(+b.dataset.beli);
  if (!p || !p.stok) return;
  const item = keranjang.find((i) => i.produk === p.id);
  if (item) item.jumlah = Math.min(p.stok, item.jumlah + 1);
  else keranjang.push({ produk: p.id, jumlah: 1 });
  simpanKeranjang();
  notif(`${p.nama} masuk keranjang`, { href: "checkout.html", label: "Lihat Keranjang" });
});

/* notifikasi */
/* satu elemen dipakai ulang */
function notif(teks, aksi) {
  let t = el("notif");
  if (!t) {
    t = document.createElement("div");
    t.id = "notif";
    /* bisa ditutup dengan klik */
    t.onclick = () => { clearTimeout(notif.waktu); t.classList.remove("tampil"); };
    document.body.appendChild(t);
  }
  /* aksi opsional: { href, label }, tautan di dalam notif, mis. ke keranjang */
  t.innerHTML = esc(String(teks)) + (aksi ? ` <a href="${aksi.href}">${esc(aksi.label)}</a>` : "");
  t.classList.add("tampil");
  clearTimeout(notif.waktu);
  notif.waktu = setTimeout(() => t.classList.remove("tampil"), 2600);
}

/* dialog konfirmasi (pengganti confirm) */
/* dipakai: if (!await konfirmasi(...)) return; */
function konfirmasi(judul, teks, labelYa = "Ya, Hapus") {
  return new Promise((jawab) => {
    const kotak = document.createElement("div");
    kotak.className = "konfirmasi";
    kotak.innerHTML = `<div class="kotak" role="dialog" aria-modal="true">
    <h3>${judul}</h3><p>${teks}</p>
    <div class="btns">
      <button class="primary garis" type="button" data-tidak>Batal</button>
      <button class="primary bahaya" type="button" data-ya>${labelYa}</button>
    </div></div>`;
    const tutup = (ok) => { kotak.remove(); document.removeEventListener("keydown", esc); jawab(ok); };
    const esc = (e) => { if (e.key === "Escape") tutup(false); };
    kotak.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) tutup(b.dataset.ya != null);
      else if (e.target === kotak) tutup(false);
    });
    document.addEventListener("keydown", esc);
    document.body.append(kotak);
    kotak.querySelector("[data-ya]").focus();
  });
}

/* baca & lihat gambar */
/* berkas gambar → data URL yang diperkecil (untuk localStorage) */
function bacaGambar(berkas, maks = 800) {
  return new Promise((selesai, gagal) => {
    if (!berkas || !berkas.type.startsWith("image/")) return gagal(new Error("Bukan gambar"));
    const pembaca = new FileReader();
    pembaca.onerror = () => gagal(new Error("Gagal membaca berkas"));
    pembaca.onload = () => {
      const gambar = new Image();
      gambar.onerror = () => gagal(new Error("Gambar tidak valid"));
      gambar.onload = () => {
        const skala = Math.min(1, maks / Math.max(gambar.width, gambar.height));
        const kanvas = document.createElement("canvas");
        kanvas.width = Math.max(1, Math.round(gambar.width * skala));
        kanvas.height = Math.max(1, Math.round(gambar.height * skala));
        const konteks = kanvas.getContext("2d");
        konteks.fillStyle = "#fff";
        konteks.fillRect(0, 0, kanvas.width, kanvas.height);
        konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
        selesai(kanvas.toDataURL("image/jpeg", 0.82));
      };
      gambar.src = pembaca.result;
    };
    pembaca.readAsDataURL(berkas);
  });
}

/* pratinjau gambar layar penuh */
function lihatGambar(sumber, judul = "Bukti transfer") {
  let kotak = el("lightbox");
  if (!kotak) {
    kotak = document.createElement("div");
    kotak.id = "lightbox";
    kotak.className = "lightbox";
    kotak.hidden = true;
    kotak.innerHTML = `<figure>
  <figcaption><b></b><button type="button" aria-label="Tutup">×</button></figcaption>
  <img alt="">
</figure>`;
    kotak.addEventListener("click", (e) => {
      if (e.target === kotak || e.target.closest("button")) kotak.hidden = true;
    });
    document.body.appendChild(kotak);
  }
  kotak.querySelector("figcaption b").textContent = judul;
  const gambar = kotak.querySelector("img");
  gambar.src = sumber;
  gambar.alt = judul;
  kotak.hidden = false;
}

/* widget daftar */
/* denah toko: kotak grid jadi alas, tiap rak digambar sesuai posisi & ukurannya.
   jumlah = { kode: n } untuk rak yang berisi barang; aktif = kode rak tersorot;
   piksel = ukuran satu kotak grid (kecilkan untuk denah mini);
   sunting = true menambahkan titik ubah ukuran (dipakai halaman Tata Rak). */
function denahToko(wadah, jumlah = {}, { klik = true, aktif = "", aktifArea = "", piksel = db.rak.grid, sunting = false, tab = false } = {}) {
  const g = Math.max(8, Math.round(+piksel || db.rak.grid));
  const L = lantaiIni();
  const daftar = L.daftar || [];
  /* papan = luas lantai (lebar×tinggi kotak grid), bukan lagi ujung rak terjauh */
  const lebar = Math.max(8, +L.lebar || 24) * g;
  const tinggi = Math.max(6, +L.tinggi || 18) * g;
  const sel = klik ? "button" : "span";
  /* pintu masuk: garis tebal di tepi lantai sesuai sisi & posisinya */
  const { gaya, sisi } = gayaPintu(L, g);
  const pintu = `<span class="ppintu${sunting ? " bisa" : ""}" data-pintu style="${gaya}"
    title="Pintu masuk sisi ${sisi}${sunting ? ", tarik untuk memindah" : ""}"></span>`;
  /* tab pilih lantai untuk halaman lihat (beranda & cari) */
  const tabs = tab && db.rak.lantai.length > 1
    ? `<div class="pilihlantai">${db.rak.lantai.map((l, i) =>
      `<button type="button" data-lantai="${i}" class="${i === db.rak.aktif ? "on" : ""}">${esc(l.nama)}</button>`).join("")}</div>`
    : "";
  /* jumlah boleh angka (model lama) atau { n, kategori }, kategori menentukan warna rak */
  const infoRak = (kode) => {
    const v = jumlah[kode];
    return typeof v === "object" && v ? { n: v.n || 0, kategori: v.kategori || "" } : { n: +v || 0, kategori: "" };
  };
  isi(wadah, `${tabs}<div class="papan${sunting ? " sunting" : ""}" style="width:${lebar}px;height:${tinggi}px;--g:${g}px">
    ${pintu}${(L.area || []).map((a) => `
    <${sel} class="parea${a.id === aktifArea ? " on" : ""}" data-area="${a.id}"
      style="left:${a.x * g}px;top:${a.y * g}px;width:${a.w * g}px;height:${a.h * g}px"
      title="Blok ${esc(a.nama) || "(tanpa nama)"}, rak tidak boleh di sini"${klik ? ' type="button"' : ""}>
      ${a.nama ? `<b>${esc(a.nama)}</b>` : ""}${sunting ? `<span class="ukur" data-ukur="${a.id}" title="Tarik untuk mengubah ukuran"></span>` : ""}</${sel}>`).join("")}${daftar.map((r) => {
    const { n, kategori } = infoRak(r.kode);
    const iKat = kategori ? db.kategori.findIndex((k) => k.id === kategori) : -1;
    const warna = n && iKat >= 0 ? " kat" + (iKat % 8) : "";
    const label = n ? `${n} unit` : "kosong";
    return `<${sel} class="prak${n ? " ada" : ""}${warna}${r.kode === aktif ? " on" : ""}" data-rak="${r.kode}"
      style="left:${r.x * g}px;top:${r.y * g}px;width:${r.w * g}px;height:${r.h * g}px"
      title="Rak ${r.kode}, ${label}"${klik ? ' type="button"' : ""}>
      <b>${r.kode}</b><i>${label}</i>${sunting ? `<span class="ukur" data-ukur="${r.kode}" title="Tarik untuk mengubah ukuran"></span>` : ""}</${sel}>`;
  }).join("")}${sunting ? `<span class="ukur-lantai" title="Tarik untuk memperluas / mempersempit lantai"></span>` : ""}</div>`);
  /* klik tab = pindah lantai lalu gambar ulang denah ini */
  if (tabs) el(wadah).querySelector(".pilihlantai").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-lantai]");
    if (!b || +b.dataset.lantai === db.rak.aktif) return;
    db.rak.aktif = +b.dataset.lantai;   /* pindah tampilan lantai, bukan perubahan data */
    denahToko(wadah, jumlah, { klik, aktif, piksel, sunting, tab });
  });
}

/* gaya (style) elemen pintu masuk: dipakai denahToko & editor saat pintu digeser */
function gayaPintu(L, g) {
  const pt = L.pintu || { sisi: "bawah", pos: 2 };
  const sisi = ["atas", "bawah", "kiri", "kanan"].includes(pt.sisi) ? pt.sisi : "bawah";
  const maks = Math.max(0, (sisi === "kiri" || sisi === "kanan" ? +L.tinggi || 18 : +L.lebar || 24) - 3);
  const pos = Math.max(0, Math.min(+pt.pos || 0, maks));
  const t = g * 0.55; /* tebal garis pintu */
  const p = 3 * g;    /* panjang pintu = 3 kotak */
  const lebar = Math.max(8, +L.lebar || 24) * g;
  const tinggi = Math.max(6, +L.tinggi || 18) * g;
  const gaya = sisi === "bawah" ? `left:${pos * g}px;top:${tinggi - t}px;width:${p}px;height:${t}px`
    : sisi === "atas" ? `left:${pos * g}px;top:0;width:${p}px;height:${t}px`
      : sisi === "kiri" ? `left:0;top:${pos * g}px;width:${t}px;height:${p}px`
        : `left:${lebar - t}px;top:${pos * g}px;width:${t}px;height:${p}px`;
  return { gaya, sisi, pos };
}

/* chip filter, opsi = [[nilai, label]]; awal = nilai terpilih */
function chipSaring(wadah, opsi, terapkan, awal = "") {
  let pilih = awal;
  isi(wadah, opsi.map(([nilai, label]) => `<button type="button" data-nilai="${esc(nilai)}">${label}</button>`).join(""));
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
