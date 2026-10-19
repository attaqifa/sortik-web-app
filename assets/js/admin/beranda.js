/* Beranda admin — ringkasan penjualan dan pengawasan data toko. */

isi("nama", db.akun.nama);

const lunas = db.pesanan.filter((o) => o.lunas);
const belum = db.pesanan.filter((o) => !o.lunas);
const nilaiSemua = db.pesanan.reduce((n, o) => n + nilaiPesanan(o), 0);
const pendapatan = lunas.reduce((n, o) => n + nilaiPesanan(o), 0);

isi("stats", [
  ["Pendapatan", rp(pendapatan), true],
  ["Belum dibayar", belum.length],
  ["Pengguna aktif", db.pengguna.filter((u) => u.status === "aktif").length],
  ["Barang terdaftar", db.produk.length]
].map(([label, nilai, kecil]) =>
  `<div><b${kecil ? ' class="kecil"' : ""}>${nilai}</b><span>${label}</span></div>`).join(""));

/* rak tersibuk pada satu bulan — info beban gudang */
function rakSibuk(b) {
  const hitung = {};
  db.pesanan.filter((o) => o.tanggal.startsWith(b)).forEach((o) => {
    const r = produkById(o.produk).rak;
    if (r) hitung[r] = (hitung[r] || 0) + o.jumlah;
  });
  return Object.entries(hitung).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
}

const bulan = {};
db.pesanan.forEach((o) => {
  const b = o.tanggal.slice(0, 7);
  bulan[b] = bulan[b] || { nilai: 0, unit: 0, pesanan: 0 };
  bulan[b].nilai += nilaiPesanan(o);
  bulan[b].unit += o.jumlah;
  bulan[b].pesanan += 1;
});

const nmBulan = "Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember".split(" ");
const rekap = Object.entries(bulan).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
const puncak = Math.max(1, ...rekap.map(([, v]) => v.nilai));

isi("total", `${db.pesanan.length} pesanan · ${rp(pendapatan)} sudah dibayar · ${rp(nilaiSemua - pendapatan)} belum`);
isi("lapor", rekap.length ? rekap.map(([b, v]) => `<div class="lapor">
  <div>
    <b>${nmBulan[+b.slice(5) - 1]} ${b.slice(0, 4)}</b>
    <span>${v.pesanan} pesanan · ${v.unit} unit · rak sibuk ${rakSibuk(b)}</span>
    <div class="bar"><i style="width:${Math.round((v.nilai / puncak) * 100)}%"></i></div>
  </div>
  <em>${rp(v.nilai)}</em>
</div>`).join("") : `<p class="kosong">Belum ada pesanan.</p>`);

const terjual = {};
db.pesanan.forEach((o) => (terjual[o.produk] = (terjual[o.produk] || 0) + o.jumlah));

isi("laris", Object.entries(terjual).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, unit]) => {
  const p = produkById(+id);
  return `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kat(p)} · rak ${p.rak || "-"} · ${rp((p.harga || 0) * unit)}</span></div>
    <em class="proc">${unit} unit</em>
  </div>`;
}).join("") || `<p class="kosong">Belum ada penjualan.</p>`);

isi("belum", belum.length ? [...belum].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((o) => {
  const p = produkById(o.produk);
  return `<a class="row" href="pesanan.html">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.pembeli || "-"} · ${o.bayar}</span></div>
    <em class="wait">${rp(nilaiPesanan(o))}</em>
  </a>`;
}).join("") : `<p class="kosong">Semua pesanan sudah dibayar.</p>`);
