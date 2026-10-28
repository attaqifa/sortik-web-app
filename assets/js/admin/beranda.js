/* Beranda admin — ringkasan penjualan dan pengawasan data toko. */

isi("nama", db.akun.nama);
el("sapa").innerHTML = avatarHTML(db.akun);

/* sambutan bisa ditutup dengan × — disembunyikan sampai besok */
const sapa = document.querySelector(".hello");
const hariSapa = new Date().toISOString().slice(0, 10);
if (localStorage.getItem(VERSI + "sapa") === hariSapa) sapa.hidden = true;
el("sapTutup").onclick = () => {
  sapa.hidden = true;
  try { localStorage.setItem(VERSI + "sapa", hariSapa); } catch {}
};

const lunas = db.pesanan.filter((o) => o.lunas);
const belum = db.pesanan.filter((o) => !o.lunas);
const nilaiSemua = db.pesanan.reduce((n, o) => n + nilaiPesanan(o), 0);
const pendapatan = lunas.reduce((n, o) => n + nilaiPesanan(o), 0);
const menipis = (p) => p.stok > 0 && p.stok <= 3;

/* kartu angka kunci: bulan ini, yang menunggu, dan yang perlu perhatian */
const kunciBulan = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
const pendapatanBulanIni = lunas.filter((o) => o.tanggal.startsWith(kunciBulan)).reduce((n, o) => n + nilaiPesanan(o), 0);

isi("stats", [
  ["trending-up", "Pendapatan bulan ini", rp(pendapatanBulanIni), true],
  ["clipboard-check", "Pesanan menunggu", nTunggu()],
  ["triangle-alert", "Stok menipis (≤ 3)", db.produk.filter(menipis).length],
  ["message-square", "Pesan grup belum dibaca", nPesanBaru()],
  ["user-round", "Pengguna aktif", db.pengguna.filter((u) => u.status === "aktif").length],
  ["package", "Barang terdaftar", db.produk.length]
].map(([ikon, label, nilai, kecil]) =>
  `<div><span class="ikon" data-lucide="${ikon}"></span><b${kecil ? ' class="kecil"' : ""}>${nilai}</b><span>${label}</span></div>`).join(""));

/* Perlu Tindakan: pintasan sesuai jumlah */
const itemTindakan = [
  ["clipboard-check", "Pesanan menunggu dikonfirmasi", db.pesanan.filter((o) => o.status === "Menunggu").length, "pesanan.html?status=Menunggu"],
  ["credit-card", "Pesanan belum dibayar", belum.length, "pesanan.html?status=belum"],
  ["triangle-alert", "Stok menipis (≤ 3) — lengkapi di Kelola Barang", db.produk.filter(menipis).length, "produk.html"],
  ["triangle-alert", "Stok habis — lengkapi di Kelola Barang", db.produk.filter((p) => p.stok < 1).length, "produk.html"]
];
const darurat = itemTindakan.filter(([, , n]) => n > 0);
isi("tindakan", darurat.length
  ? darurat.map(([ikon, label, n, href]) =>
    `<a class="tindakanitem" href="${href}"><span class="ikon" data-lucide="${ikon}"></span><b>${n}</b><span>${label}</span><i>›</i></a>`).join("")
  : `<p class="kosong"><span class="ikon" data-lucide="clipboard-check"></span>Semua beres — tidak ada yang perlu ditindak.</p>`);

/* rak tersibuk satu bulan */
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

/* 6 bulan terakhir selalu lengkap (bulan kosong = 0) — grafik & laporan satuan sumber */
const rekap = [...Array(6)].map((_, i) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 5 + i);
  const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return { kunci, label: nmBulan[d.getMonth()], ...(bulan[kunci] || { nilai: 0, lunas: 0, belum: 0, unit: 0, pesanan: 0 }) };
});
const puncak = Math.max(1, ...rekap.map((v) => v.nilai));

/* ---------- grafik batang (komponen sama dengan halaman Keuangan) ----------
   biru = sudah dibayar, kuning = belum dibayar */
(function gambarGrafik() {
  const maks = Math.max(1, ...rekap.map((v) => v.lunas + v.belum));
  isi("grafik", rekap.map((v) => `<div class="kolom">
    <div class="batang" title="${v.label}: ${rp(v.nilai)} (${rp(v.lunas)} dibayar, ${rp(v.belum)} belum)">
      <i class="p" style="height:${Math.max(2, Math.round((v.lunas / maks) * 100))}%"></i>
      <i class="b" style="height:${Math.max(2, Math.round((v.belum / maks) * 100))}%"></i>
    </div><label>${v.label.slice(0, 3)}</label></div>`).join(""));

  const lunas = rekap.reduce((n, v) => n + v.lunas, 0);
  isi("total", `${db.pesanan.length} pesanan · ${rp(lunas)} sudah dibayar · ${rp(nilaiSemua - lunas)} belum`);
})();

/* laporan: hanya bulan yang benar-benar ada pesanan, terbaru dulu */
isi("lapor", (() => {
  const ada = [...rekap].reverse().filter((v) => v.pesanan > 0);
  return ada.length ? ada.map((v) => `<div class="lapor">
  <div>
    <b>${v.label} ${v.kunci.slice(0, 4)}</b>
    <span>${v.pesanan} pesanan · ${v.unit} unit · rak sibuk ${rakSibuk(v.kunci)}</span>
    <div class="bar"><i style="width:${Math.round((v.nilai / puncak) * 100)}%"></i></div>
  </div>
  <em>${rp(v.nilai)}</em>
</div>`).join("") : pesanKosong("receipt", "Belum ada pesanan bulan ini.");
})());

const terjual = {};
db.pesanan.forEach((o) => (terjual[o.produk] = (terjual[o.produk] || 0) + o.jumlah));

isi("laris", Object.entries(terjual).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, unit]) => {
  const p = produkById(+id);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kat(p)} · rak ${p.rak || "-"} · ${rp(hargaJual(p) * unit)}</span></div>
    <em class="proc">${unit} unit</em>
  </div>`;
}).join("") || pesanKosong("wallet", "Belum ada penjualan."));

isi("belum", belum.length ? [...belum].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((o) => {
  const p = produkById(o.produk);
  return `<a class="row" href="pesanan.html">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.pembeli || "-"} · ${o.bayar}</span></div>
    <em class="wait">${rp(nilaiPesanan(o))}</em>
  </a>`;
}).join("") : pesanKosong("clock", "Semua pesanan sudah dibayar."));
