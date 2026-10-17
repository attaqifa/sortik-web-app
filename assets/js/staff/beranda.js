/* SORTIK — beranda staff: ringkasan operasional + pintasan kerja
   Semua angka dihitung dari db (produk, rak, pesanan). Saat data pindah ke
   database tidak ada yang perlu diubah di sini — cukup isi `db` dari API. */

isi("nama", db.akun.nama);

const jalan = db.pesanan.filter((o) => o.status !== "Selesai");
const belumBayar = jalan.filter((o) => !o.lunas);
const tipis = db.produk.filter((p) => p.stok <= 5);
const terbaru = (daftar) => [...daftar].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);

isi("stats", [
  ["Barang terdaftar", db.produk.length],
  ["Stok menipis", tipis.length],
  ["Pesanan berjalan", jalan.length],
  ["Belum dibayar", belumBayar.length]
].map(([label, nilai]) => `<div><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* pesanan yang masih perlu ditindak — klik untuk membuka kelola pesanan */
const kartuPesanan = (o) => {
  const p = produkById(o.produk);
  return `<a class="row" href="pesanan.html">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${o.pembeli || "-"} · ${o.bayar}</span>${tagBayar(o)}</div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </a>`;
};
isi("tindak", jalan.length ? terbaru(jalan).map(kartuPesanan).join("") : `<p class="kosong">Tidak ada pesanan yang menunggu ditindak.</p>`);

/* barang yang stoknya menipis — klik untuk langsung membuka form ubahnya */
isi("tipis", tipis.length ? tipis.map((p) => `<a class="row" href="produk.html?id=${p.id}">
  <div class="thumb">${p.ikon || "📦"}</div>
  <div><b>${p.nama}</b><span>${kat(p)} · Rak ${p.rak} · ${rp(p.harga)}</span></div>
  <em class="${p.stok ? "wait" : "done"}">stok ${p.stok}</em>
</a>`).join("") : `<p class="kosong">Semua stok di atas 5 unit.</p>`);

/* kondisi rak: sel berisi angka jumlah barang, jadi kepadatan rak terlihat sekilas */
const hitung = {};
db.produk.forEach((p) => (hitung[p.rak] = (hitung[p.rak] || 0) + 1));
isi("rakInfo", `${Object.keys(hitung).length} dari ${semuaRak().length} rak terisi (rak kosong ditandai samar).`);
el("denah").style.gridTemplateColumns = `auto repeat(${db.rak.kolom}, minmax(0, 1fr))`;
isi("denah", db.rak.baris.split("").map((b) =>
  `<span class="rlbl">${b}</span>` +
  Array.from({ length: db.rak.kolom }, (_, i) => {
    const kode = `${b}${i + 1}`, n = hitung[kode] || 0;
    return `<span class="rcell${n ? " ada" : ""}">${n || ""}</span>`;
  }).join("")
).join(""));
