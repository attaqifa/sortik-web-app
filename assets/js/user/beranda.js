/* Beranda pembeli — etalase depan, pil kategori, dan pesanan milik akun. */

/* ---------- etalase depan: sapaan + nama toko + produk unggulan ---------- */
const terjual = {};
db.pesanan.forEach((o) => (terjual[o.produk] = (terjual[o.produk] || 0) + o.jumlah));
const adaStok = db.produk.filter((p) => p.stok > 0);
/* unggulan = terlaris yang punya foto; cadangan: terbaru; tanpa produk → hero tanpa foto */
const unggulan = adaStok
  .sort((a, b) => (terjual[b.id] || 0) - (terjual[a.id] || 0) || b.id - a.id)
  .find((p) => galeriProduk(p)[0]) || adaStok[0] || null;

isi("hero", `<div class="heroTeks">
  <span class="label">Selamat datang kembali 👋 <b>${esc(db.akun.nama)}</b></span>
  <h2>${esc(db.toko.nama)}</h2>
  <p>${esc(db.toko.jam || "Setiap hari buka")}. Belanja elektronik santai — lihat denah raknya, pesan, lalu ambil di tempat atau diantar ke alamat Anda.</p>
  <div class="aksi">
    <a class="btn putih" href="cari.html">Mulai belanja</a>
    <a class="btn putih garis" href="pesan.html">Pesanan saya</a>
  </div>
</div>
${unggulan ? `<a class="heroFoto" href="produk.html?id=${unggulan.id}" title="Lihat ${esc(unggulan.nama)}">
  ${fotoHTML(unggulan)}
  <div class="heroTag"><span>Produk unggulan</span><b>${esc(unggulan.nama)}</b><em>${rp(hargaJual(unggulan))}${unggulan.diskon ? ` <s>${rp(unggulan.harga)}</s>` : ""}</em></div>
</a>` : ""}`);

/* ---------- ringkasan akun ---------- */
const punyaku = pesananku();
const jalan = punyaku.filter((o) => o.status !== "Selesai").sort((a, b) => b.tanggal.localeCompare(a.tanggal));

isi("stats", [
  ["shopping-cart", "Pesanan aktif", jalan.length],
  ["clock", "Belum dibayar", jalan.filter((o) => !o.lunas).length],
  ["package", "Siap diambil", punyaku.filter((o) => o.status === "Siap").length]
].map(([ikon, label, nilai]) => `<div><span class="ikon" data-lucide="${ikon}"></span><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* pesanan selesai ada di Riwayat */
isi("pesanan", jalan.map((o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${o.jumlah} item · ${rp(nilaiPesanan(o))}</span>${tagBayar(o)}</div>
    <em class="${STATUS[o.status] || ""}">${o.status}</em>
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
isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${k.id}">${ikonKategori(k)}<span>${k.nama}</span></a>`).join(""));
