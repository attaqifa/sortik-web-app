/* Beranda pembeli — etalase depan, pil kategori, dan pesanan milik akun. */

/* ---------- etalase depan: sapaan + nama toko + produk unggulan ---------- */
const adaStok = db.produk.filter((p) => p.stok > 0)
  .sort((a, b) => b.terjual - a.terjual || b.id - a.id);
/* satu sorotan tetap (bukan banner berputar): diskon terbesar, kalau tidak ada → terlaris;
   wajib punya foto. Produk diskon lain sudah tampil di etalase "Sedang Diskon". */
const sorotan = [...adaStok.filter((p) => p.diskon > 0).sort((a, b) => b.diskon - a.diskon), ...adaStok.filter((p) => !p.diskon)]
  .find((p) => galeriProduk(p)[0]);

isi("hero", `<div class="heroTeks">
  <span class="label">Selamat datang kembali 👋 <b>${esc(db.akun.nama)}</b></span>
  <h2>${esc(db.toko.nama)}</h2>
  <p>${esc(db.toko.jam || "Setiap hari buka")}. Belanja elektronik santai — lihat denah raknya, pesan, lalu ambil di tempat atau diantar ke alamat Anda.</p>
  <div class="aksi">
    <a class="btn putih" href="cari.html">Mulai belanja</a>
    <a class="btn putih garis" href="pesan.html">Pesanan saya</a>
  </div>
</div>
${sorotan ? `<a class="heroBanner" href="produk.html?id=${sorotan.id}" title="Lihat ${esc(sorotan.nama)}">
  <img src="${urlGambar(galeriProduk(sorotan)[0])}" alt="${esc(sorotan.nama)}">
  <div class="heroTag"><span>${sorotan.diskon ? `Diskon ${sorotan.diskon}%` : "Pilihan toko"}</span><b>${esc(sorotan.nama)}</b><em>${rp(hargaJual(sorotan))}${sorotan.diskon ? ` <s>${rp(sorotan.harga)}</s>` : ""}</em></div>
</a>` : ""}`);

/* ---------- etalase sedang diskon: paling besar diskon dulu ---------- */
const promo = db.produk.filter((p) => p.diskon > 0).sort((a, b) => b.diskon - a.diskon);
el("promoWrap").hidden = !promo.length;
isi("promo", promo.map(kartu).join(""));

/* ---------- ringkasan akun ---------- */
const punyaku = pesananku();
const jalan = punyaku.filter(aktif).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

isi("stats", [
  ["shopping-cart", "Pesanan aktif", jalan.length],
  ["clock", "Belum dibayar", jalan.filter((o) => !o.lunas).length],
  ["package", "Siap diambil", punyaku.filter((o) => o.status === "Siap").length]
].map(([ikon, label, nilai]) => `<div><span class="ikon" data-lucide="${ikon}"></span><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* pesanan selesai ada di Riwayat */
isi("pesanan", jalan.map((o) => {
  const p = produkById(o.items[0].produk);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${esc(p.nama || "-")}${o.items.length > 1 ? ` + ${o.items.length - 1} produk` : ""}</b><span>${jumlahItem(o)} unit · ${rp(o.total)}</span>${tagBayar(o)}</div>
    ${tagStatus(o.status)}
  </div>`;
}).join("") || pesanKosong("shopping-cart", "Belum ada pesanan berjalan.", ["cari.html", "Mulai belanja"]));

/* ---------- pil kategori: saring produk langsung di beranda ---------- */
let katPilih = "";
function gambarBaru() {
  const daftar = [...db.produk].reverse().filter((p) => !katPilih || p.kategori === katPilih).slice(0, 8);
  const k = db.kategori.find((x) => x.id === katPilih);
  isi("judulBaru", katPilih ? `Kategori: ${k ? esc(k.nama) : esc(katPilih)}` : "Produk Terbaru");
  isi("baru", daftar.map(kartu).join("")
    || pesanKosong("package", "Belum ada produk di kategori ini.", ["cari.html", "Buka pencarian"]));
}
chipSaring("pilKat", [["", "Semua"], ...db.kategori.map((k) => [k.id, `${ikonKategori(k)}<span>${esc(k.nama)}</span>`])],
  (nilai) => { katPilih = nilai; gambarBaru(); });
gambarBaru();

/* ---------- kategori (papan penuh, tautan ke pencarian) ---------- */
isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${encodeURIComponent(k.id)}">${ikonKategori(k)}<span>${esc(k.nama)}</span></a>`).join(""));
