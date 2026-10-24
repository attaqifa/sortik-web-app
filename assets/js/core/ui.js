/* SORTIK — util & komponen tampilan bersama.
   Semua fungsi murni/tampilan ada di sini: format, kartu produk, notifikasi,
   pratinjau gambar, denah rak, dan chip filter. Tidak menyentuh penyimpanan. */

/* ---------- util singkat ---------- */
const el = (id) => document.getElementById(id);
/* isi() = satu-satunya cara menaruh HTML ke halaman; sekalian menggambar ikon
   Lucide yang baru masuk, jadi halaman tidak perlu memanggil gambarIkon(). */
const isi = (id, html) => {
  const x = el(id);
  if (!x) return;
  x.innerHTML = html;
  gambarIkon();
};
const rp = (n) => "Rp " + (+n || 0).toLocaleString("id-ID");
const kat = (p) => (db.kategori.find((k) => k.id === p.kategori) || {}).nama || p.kategori || "-";
/* ikon kategori: ikon garis Lucide; emoji `ikon` tetap jadi cadangan bila belum ada */
const ikonKategori = (k) => (k && k.lucide)
  ? `<span class="ikon" data-lucide="${k.lucide}"></span>`
  : `<span class="emoji">${(k && k.ikon) || "📦"}</span>`;

/* Gambar setiap <span data-lucide="…"> menjadi ikon garis Lucide.
   Skripnya dimuat sekali oleh store.js; selama belum siap fungsi ini aman
   dipanggil (tidak melakukan apa-apa), dan isi() memanggilnya otomatis. */
function gambarIkon() {
  if (!window.lucide) return;
  window.lucide.createIcons();
  /* svg hasil Lucide masih membawa data-lucide — lepaskan agar tidak diproses ulang */
  document.querySelectorAll("svg[data-lucide]").forEach((s) => s.removeAttribute("data-lucide"));
}
const produkById = (id) => db.produk.find((p) => p.id === id) || {};
const nilaiPesanan = (o) => (produkById(o.produk).harga || 0) * o.jumlah;
const semuaRak = () => db.rak.baris.split("").flatMap((b) => Array.from({ length: db.rak.kolom }, (_, i) => `${b}${i + 1}`));

const bln = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");
const tglID = (s) => { const [y, m, d] = String(s).split("-"); return `${d} ${bln[m - 1]} ${y}`; };
const kodePesanan = (o) => `BK-${o.tanggal.slice(0, 4)}-${String(o.id).padStart(3, "0")}`;

/* kelas warna status pesanan: Menunggu → wait, dst. */
const STATUS = { Menunggu: "wait", Diproses: "proc", Siap: "ok", Selesai: "done" };
/* urutan status pesanan — dipakai halaman pembeli & staff/admin */
const ALUR = ["Menunggu", "Diproses", "Siap", "Selesai"];
const tagBayar = (o) => (o.lunas
  ? `<span class="tag lunas">Lunas${o.staff ? " · " + o.staff : ""}</span>`
  : `<span class="tag belum">Belum dibayar</span>`);

/* ---------- foto produk ---------- */
/* Semua foto produk: foto utama dulu, lalu foto detail. Foto bisa berupa
   tautan internet ataupun hasil unggahan (data URL). */
const galeriProduk = (p) => [p && p.foto, ...((p && p.galeri) || [])].filter(Boolean);

/* Ikon cadangan saat foto tidak ada/gagal dimuat — ikon garis kategori,
   bukan emoji, supaya tampilan tetap konsisten. */
const ikonCadangan = (p) => {
  const k = db.kategori.find((x) => x.id === (p && p.kategori));
  return `<span class="ikon foto-cadangan" data-lucide="${(k && k.lucide) || "package"}"></span>`;
};

/* Foto produk: ikon cadangan ditaruh di belakang gambar, jadi begitu gambar
   gagal dimuat (onerror) ikonnya otomatis terlihat. */
const fotoHTML = (p) => {
  const utama = galeriProduk(p)[0];
  const alt = String((p && p.nama) || "Foto produk").replace(/"/g, "&quot;");
  if (!utama) return ikonCadangan(p);
  return `${ikonCadangan(p)}<img src="${utama}" alt="${alt}" loading="lazy" onerror="this.remove()">`;
};

const kartu = (p) => `<a class="pcard" href="produk.html?id=${p.id}">
  <div class="pimg">${fotoHTML(p)}</div>
  <div class="pbody">
    <span class="pcat">${kat(p)}</span>
    <h3>${p.nama}</h3>
    <b>${rp(p.harga)}</b>
    <span class="pstok${p.stok ? "" : " habis"}">${p.stok ? `Stok ${p.stok} · Rak ${p.rak}` : "Stok habis"}</span>
  </div>
</a>`;

/* ---------- notifikasi singkat ---------- */
/* satu elemen dipakai ulang supaya tidak menumpuk */
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

/* ---------- baca & lihat gambar ---------- */
/* Baca berkas gambar → data URL yang sudah diperkecil.
   Disimpan di localStorage, jadi ukurannya harus ringan. */
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

/* pratinjau gambar layar penuh (bukti transfer, foto produk, dsb.) */
function lihatGambar(sumber, judul = "Bukti transfer") {
  let kotak = el("lightbox");
  if (!kotak) {
    kotak = document.createElement("div");
    kotak.id = "lightbox";
    kotak.className = "lightbox";
    kotak.hidden = true;
    kotak.innerHTML = `<figure>
  <figcaption><b></b><button type="button" aria-label="Tutup">✕</button></figcaption>
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

/* ---------- widget daftar ---------- */
/* denah rak A1… — `jumlah` = { kode: banyak barang }; sel jadi tombol bila `klik` */
function denahRak(wadah, jumlah = {}, { klik = true, aktif = "" } = {}) {
  const sel = klik ? "button" : "span";
  el(wadah).style.gridTemplateColumns = `auto repeat(${db.rak.kolom}, minmax(0, 1fr))`;
  isi(wadah, db.rak.baris.split("").map((b) =>
    `<span class="rlbl">Rak ${b}</span>` +
    Array.from({ length: db.rak.kolom }, (_, i) => {
      const kode = `${b}${i + 1}`, n = jumlah[kode] || 0;
      const label = n ? `${n} barang` : "kosong";
      return `<${sel} class="rcell${n ? " ada" : ""}${kode === aktif ? " on" : ""}" data-rak="${kode}" title="Rak ${kode} — ${label}"${klik ? ' type="button"' : ""}>`
        + `<b>${kode}</b><i>${n ? n + " unit" : "kosong"}</i></${sel}>`;
    }).join("")
  ).join(""));
}

/* chip filter — `opsi` = [[nilai, label]], nilai "" berarti Semua.
   `awal` = nilai yang langsung dipilih saat halaman dibuka. */
function chipSaring(wadah, opsi, terapkan, awal = "") {
  let pilih = awal;
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
