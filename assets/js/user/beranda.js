/* Beranda pembeli, etalase depan, pil kategori, dan pesanan milik akun. */

/* etalase depan: foto toko sebagai latar, identitas diambil dari data tokonya */
if (db.toko.foto) el("hero").style.backgroundImage = `url("${db.toko.foto}")`;

isi("hero", `<div class="heroTeks">
  <span class="label">Selamat datang kembali, ${esc(db.akun.nama)}</span>
  <h2>${esc(db.toko.nama)}</h2>
  <p>${esc(db.toko.alamat || "Alamat toko belum diisi")}</p>
  <div class="aksi">
    <a class="btn putih" href="cari.html">Cari barang di rak</a>
    <a class="btn putih garis" href="pesan.html">Pesananku</a>
    <a class="btn putih garis" href="jelajah.html">Pilih toko lain</a>
  </div>
</div>
<div class="heroPapan">
  <span><span class="ikon" data-lucide="clock"></span>${esc(db.toko.jam || "Jam belum diisi")}</span>
  <span><span class="ikon" data-lucide="truck"></span>Ongkir ${rp(db.toko.ongkir)}</span>
</div>`);

/* etalase sedang diskon: paling besar diskon dulu */
const promo = db.produk.filter((p) => p.diskon > 0).sort((a, b) => b.diskon - a.diskon);
el("promoWrap").hidden = !promo.length;
isi("promo", promo.map(kartu).join(""));

/* ringkasan akun, pesannya dari semua toko */
const punyaku = pesananku();
const jalan = punyaku.filter(pesananJalan).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

isi("stats", [
  ["shopping-cart", "Pesanan aktif", jalan.length],
  ["clock", "Belum dibayar", jalan.filter((o) => !o.lunas).length],
  ["package", "Siap diambil", punyaku.filter((o) => o.status === "Siap").length]
].map(([ikon, label, nilai]) => `<div><span class="ikon" data-lucide="${ikon}"></span><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* pesanan selesai & yang dibatalkan ada di Riwayat */
isi("pesanan", jalan.map((o) => {
  const p = produkPesanan(o);
  const dari = o.toko === db.aktifToko ? "" : " · " + esc(labelToko(o.toko));
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${o.jumlah} item · ${rp(nilaiPesanan(o))}${dari}</span>${tagBayar(o)}</div>
    ${tagStatus(o.status)}
  </div>`;
}).join("") || pesanKosong("shopping-cart", "Belum ada pesanan berjalan.", ["cari.html", "Mulai belanja"]));

/* pil kategori: saring produk langsung di beranda */
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

/* kategori (papan penuh, tautan ke pencarian) */
isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${k.id}">${ikonKategori(k)}<span>${k.nama}</span></a>`).join(""));
