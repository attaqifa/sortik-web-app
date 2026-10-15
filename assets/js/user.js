/* SORTIK — beranda pembeli (render dari `db` di app.js) */

el("nama").textContent = db.user.nama;

isi("stats", db.statistik.map((s) => `<div><b>${s.nilai}</b><span>${s.label}</span></div>`).join(""));

/* yang sudah selesai tidak ditampilkan di beranda — ada di halaman Riwayat */
isi("pesanan", db.pesanan.filter((o) => o.status !== "Selesai").map((o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${o.jumlah} item · ${rp(p.harga || 0)}</span></div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </div>`;
}).join(""));

isi("kategori", db.kategori.map((k) => `<div>${k.ikon}<span>${k.nama}</span></div>`).join(""));
