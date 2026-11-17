/* Beranda pembeli — etalase depan, pesanan berjalan, kategori, diskon, dan produk baru. */

/* ---------- etalase depan: sapaan + nama toko + produk unggulan ---------- */
const adaStok = db.produk.filter((p) => p.stok > 0)
  .sort((a, b) => b.terjual - a.terjual || b.id - a.id);
/* satu sorotan tetap (bukan banner berputar): diskon terbesar, kalau tidak ada → terlaris;
   wajib punya foto. Produk diskon lain sudah tampil di etalase "Sedang diskon". */
const sorotan = [...adaStok.filter((p) => p.diskon > 0).sort((a, b) => b.diskon - a.diskon), ...adaStok.filter((p) => !p.diskon)]
  .find((p) => galeriProduk(p)[0]);

const tamu = db.akun.id == null;
const jmlRak = semuaRak().length;
const jmlLantai = db.rak.lantai.length;

isi("hero", `<div class="heroTeks">
  <span class="label">${tamu ? "Selamat datang" : `Halo, <b>${esc(db.akun.nama.split(" ")[0])}</b>`}</span>
  <h2>${esc(db.toko.nama)}</h2>
  <p>Cari barang elektronik, lihat di rak mana letaknya, pesan dari sini, lalu ambil di toko atau minta diantar.</p>
  <div class="aksi">
    <a class="btn putih" href="cari.html"><span class="ikon" data-lucide="map"></span>Cari di denah toko</a>
    ${tamu ? `<a class="btn putih garis" href="../auth/login.html">Masuk untuk memesan</a>` : `<a class="btn putih garis" href="pesan.html">Pesanan saya</a>`}
  </div>
  <div class="herofakta">
    <span><span class="ikon" data-lucide="clock"></span>${esc(db.toko.jam || "Buka setiap hari")}</span>
    <span><span class="ikon" data-lucide="layout-grid"></span>${jmlRak} rak${jmlLantai > 1 ? ` · ${jmlLantai} lantai` : ""}</span>
    <span><span class="ikon" data-lucide="package"></span>${adaStok.length} produk tersedia</span>
  </div>
</div>
${sorotan ? `<a class="heroBanner" href="produk.html?id=${sorotan.id}" title="Lihat ${esc(sorotan.nama)}">
  <img src="${urlGambar(galeriProduk(sorotan)[0])}" alt="${esc(sorotan.nama)}">
  <div class="heroTag"><span>${sorotan.diskon ? `Diskon ${sorotan.diskon}%` : "Pilihan toko"}</span><b>${esc(sorotan.nama)}</b><em>${rp(hargaJual(sorotan))}${sorotan.diskon ? ` <s>${rp(sorotan.harga)}</s>` : ""}</em></div>
</a>` : ""}`);

/* ---------- pesanan berjalan: strip ringkas, hanya bila ada ---------- */
const jalan = pesananku().filter(aktif).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
el("berjalanWrap").hidden = !jalan.length;
isi("pesanan", jalan.slice(0, 4).map((o) => {
  const p = produkById(o.items[0].produk);
  return `<a href="pesan.html?id=${o.id}">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${esc(p.nama || "-")}${o.items.length > 1 ? ` + ${o.items.length - 1}` : ""}</b>
      <span class="meta"><em class="${STATUS[o.status] || ""}">${ikonStatus(o.status)}${esc(o.status)}</em>${o.lunas ? rp(o.total) : `<em class="wait">Belum dibayar</em>`}</span></div>
  </a>`;
}).join(""));

/* ---------- kategori: satu tempat saja, tautan ke Cari ---------- */
isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${encodeURIComponent(k.id)}">${ikonKategori(k)}<span>${esc(k.nama)}</span></a>`).join(""));

/* ---------- etalase sedang diskon: paling besar diskon dulu ---------- */
const promo = db.produk.filter((p) => p.diskon > 0).sort((a, b) => b.diskon - a.diskon);
el("promoWrap").hidden = !promo.length;
isi("promo", promo.slice(0, 8).map(kartu).join(""));

/* ---------- produk terbaru ---------- */
isi("baru", [...db.produk].reverse().slice(0, 8).map(kartu).join("")
  || pesanKosong("package", "Belum ada produk di rak.", ["cari.html", "Buka pencarian"]));
