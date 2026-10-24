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
  bulan[b] = bulan[b] || { nilai: 0, lunas: 0, belum: 0, unit: 0, pesanan: 0 };
  const v = nilaiPesanan(o);
  bulan[b].nilai += v;
  bulan[b][o.lunas ? "lunas" : "belum"] += v;
  bulan[b].unit += o.jumlah;
  bulan[b].pesanan += 1;
});

const nmBulan = "Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember".split(" ");
const rekap = Object.entries(bulan).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
const puncak = Math.max(1, ...rekap.map(([, v]) => v.nilai));

/* ---------- grafik penghasilan ----------
   Batang bertumpuk per bulan: bagian gelap = sudah dibayar,
   bagian kuning = belum dibayar. Dibuat murni dengan SVG. */
const rpRingkas = (n) => {
  n = +n || 0;
  if (n >= 1e9) return "Rp " + (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M";
  if (n >= 1e6) return "Rp " + (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  if (n >= 1e3) return "Rp " + Math.round(n / 1e3).toLocaleString("id-ID") + " rb";
  return rp(n);
};

function grafikPenghasilan(jumlah) {
  const kini = new Date();
  const deret = Array.from({ length: jumlah }, (_, i) => {
    const d = new Date(kini.getFullYear(), kini.getMonth() - (jumlah - 1 - i), 1);
    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { kunci, singkat: bln[d.getMonth()], tahun: d.getFullYear(), ...(bulan[kunci] || { nilai: 0, lunas: 0, belum: 0 }) };
  });

  const L = 760, T = 280, kiri = 66, kanan = 14, atas = 20, bawah = 46;
  const lw = L - kiri - kanan, lh = T - atas - bawah;
  const slot = lw / deret.length;
  const lebar = Math.min(46, slot * 0.56);
  const maks = Math.max(1, ...deret.map((d) => d.lunas + d.belum));
  const y = (v) => atas + lh * (1 - v / maks);

  const kisi = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const yy = atas + lh * (1 - f);
    return `<line class="grid" x1="${kiri}" x2="${L - kanan}" y1="${yy}" y2="${yy}"></line>
      <text class="sumbu" x="${kiri - 10}" y="${yy + 4}" text-anchor="end">${rpRingkas(maks * f)}</text>`;
  }).join("");

  const batang = deret.map((d, i) => {
    const cx = kiri + slot * i + slot / 2;
    const x = cx - lebar / 2;
    const tinggiLunas = (d.lunas / maks) * lh;
    const tinggiBelum = (d.belum / maks) * lh;
    const yLunas = y(d.lunas);
    const yTotal = y(d.lunas + d.belum);
    return `<g>
      <title>${d.singkat} ${d.tahun} — ${rp(d.nilai)} (${rp(d.lunas)} dibayar, ${rp(d.belum)} belum)</title>
      <rect class="b-lunas" x="${x}" y="${yLunas}" width="${lebar}" height="${tinggiLunas}" rx="5"></rect>
      <rect class="b-belum" x="${x}" y="${yTotal}" width="${lebar}" height="${tinggiBelum}" rx="5"></rect>
      <text class="sumbu" x="${cx}" y="${T - bawah + 20}" text-anchor="middle">${d.singkat}</text>
      <text class="sumbu kecil" x="${cx}" y="${T - bawah + 34}" text-anchor="middle">${d.tahun}</text>
    </g>`;
  }).join("");

  const total = deret.reduce((n, d) => n + d.nilai, 0);
  const totalLunas = deret.reduce((n, d) => n + d.lunas, 0);
  const sekarang = bulan[`${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}`] || { lunas: 0 };
  isi("grafikInfo", `${jumlah} bulan terakhir · total ${rp(total)} · sudah dibayar ${rp(totalLunas)} · bulan ini ${rp(sekarang.lunas)}`);
  return `<svg viewBox="0 0 ${L} ${T}" role="img" aria-label="Grafik penghasilan ${jumlah} bulan terakhir">
    <line class="dasar" x1="${kiri}" x2="${L - kanan}" y1="${atas + lh}" y2="${atas + lh}"></line>
    ${kisi}${batang}
  </svg>`;
}

let rentangBulan = 6;
const gambarGrafik = () => isi("grafik", grafikPenghasilan(rentangBulan));
el("rentang").onchange = () => { rentangBulan = +el("rentang").value || 6; gambarGrafik(); };
gambarGrafik();

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
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kat(p)} · rak ${p.rak || "-"} · ${rp((p.harga || 0) * unit)}</span></div>
    <em class="proc">${unit} unit</em>
  </div>`;
}).join("") || `<p class="kosong">Belum ada penjualan.</p>`);

isi("belum", belum.length ? [...belum].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((o) => {
  const p = produkById(o.produk);
  return `<a class="row" href="pesanan.html">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.pembeli || "-"} · ${o.bayar}</span></div>
    <em class="wait">${rp(nilaiPesanan(o))}</em>
  </a>`;
}).join("") : `<p class="kosong">Semua pesanan sudah dibayar.</p>`);
