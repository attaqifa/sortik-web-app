/* Beranda pembeli — ringkasan pesanan milik akun yang sedang masuk. */

el("nama").textContent = db.akun.nama;

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

isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${k.id}">${ikonKategori(k)}<span>${k.nama}</span></a>`).join(""));

/* 4 produk terbaru */
isi("baru", db.produk.slice(-4).reverse().map(kartu).join("")
  || pesanKosong("package", "Belum ada produk.", ["cari.html", "Buka pencarian"]));
