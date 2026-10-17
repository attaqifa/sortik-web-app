/* SORTIK — beranda pembeli (render dari `db` di app.js) */

el("nama").textContent = db.akun.nama;

/* statistik & daftar dihitung dari pesanan pembeli yang sedang masuk —
   bukan angka tetap, jadi tidak pernah basi. Di server: WHERE pembeli = sesi */
const punyaku = pesananku();
const jalan = punyaku.filter((o) => o.status !== "Selesai");

isi("stats", [
  ["Pesanan aktif", jalan.length],
  ["Belum dibayar", jalan.filter((o) => !o.lunas).length],
  ["Siap diambil", punyaku.filter((o) => o.status === "Siap").length]
].map(([label, nilai]) => `<div><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* yang sudah selesai tidak ditampilkan di beranda — ada di halaman Riwayat */
isi("pesanan", jalan.map((o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${o.jumlah} item · ${rp(nilaiPesanan(o))}</span>${tagBayar(o)}</div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </div>`;
}).join("") || `<p class="kosong">Belum ada pesanan berjalan. <a href="cari.html">Mulai belanja</a>.</p>`);

isi("kategori", db.kategori.map((k) => `<div>${k.ikon}<span>${k.nama}</span></div>`).join(""));
