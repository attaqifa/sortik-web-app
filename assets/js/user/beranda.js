/* Beranda pembeli — ringkasan pesanan milik akun yang sedang masuk. */

el("nama").textContent = db.akun.nama;

const punyaku = pesananku();
const jalan = punyaku.filter((o) => o.status !== "Selesai").sort((a, b) => b.tanggal.localeCompare(a.tanggal));

isi("stats", [
  ["Pesanan aktif", jalan.length],
  ["Belum dibayar", jalan.filter((o) => !o.lunas).length],
  ["Siap diambil", punyaku.filter((o) => o.status === "Siap").length]
].map(([label, nilai]) => `<div><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* pesanan selesai tidak ditampilkan di sini — ada di halaman Riwayat */
isi("pesanan", jalan.map((o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${o.jumlah} item · ${rp(nilaiPesanan(o))}</span>${tagBayar(o)}</div>
    <em class="${STATUS[o.status] || ""}">${o.status}</em>
  </div>`;
}).join("") || `<p class="kosong">Belum ada pesanan berjalan. <a href="cari.html">Mulai belanja</a>.</p>`);

isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${k.id}">${ikonKategori(k)}<span>${k.nama}</span></a>`).join(""));
