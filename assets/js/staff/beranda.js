/* Beranda staff — ringkasan operasional toko. */

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

const jalan = db.pesanan.filter((o) => o.status !== "Selesai");
const belumBayar = jalan.filter((o) => !o.lunas);
const tipis = db.produk.filter((p) => p.stok <= 5);
const terbaru = (daftar) => [...daftar].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);

isi("stats", [
  ["package", "Barang terdaftar", db.produk.length],
  ["triangle-alert", "Stok menipis", tipis.length],
  ["receipt", "Pesanan berjalan", jalan.length],
  ["clock", "Belum dibayar", belumBayar.length]
].map(([ikon, label, nilai]) => `<div><span class="ikon" data-lucide="${ikon}"></span><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* Perlu Tindakan: pintasan sesuai jumlah */
const itemTindakan = [
  ["clipboard-check", "Pesanan menunggu dikonfirmasi", jalan.filter((o) => o.status === "Menunggu").length, "pesanan.html?status=Menunggu"],
  ["credit-card", "Pesanan belum dibayar", belumBayar.length, "pesanan.html?status=belum"],
  ["triangle-alert", "Stok habis — lengkapi di Kelola Barang", db.produk.filter((p) => p.stok < 1).length, "produk.html"]
];
const darurat = itemTindakan.filter(([, , n]) => n > 0);
isi("tindakan", darurat.length
  ? darurat.map(([ikon, label, n, href]) =>
    `<a class="tindakanitem" href="${href}"><span class="ikon" data-lucide="${ikon}"></span><b>${n}</b><span>${label}</span><i>›</i></a>`).join("")
  : `<p class="kosong"><span class="ikon" data-lucide="clipboard-check"></span>Semua beres — tidak ada yang perlu ditindak.</p>`);

const kartuPesanan = (o) => {
  const p = produkById(o.produk);
  return `<a class="row" href="pesanan.html">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${o.pembeli || "-"} · ${o.bayar}</span>${tagBayar(o)}</div>
    <em class="${STATUS[o.status] || ""}">${o.status}</em>
  </a>`;
};
isi("tindak", jalan.length ? terbaru(jalan).map(kartuPesanan).join("") : pesanKosong("receipt", "Tidak ada pesanan yang menunggu ditindak."));

isi("tipis", tipis.length ? tipis.map((p) => `<a class="row" href="produk.html?id=${p.id}">
  <div class="thumb">${fotoHTML(p)}</div>
  <div><b>${p.nama}</b><span>${kat(p)} · Rak ${labelRak(p.rak)} · ${rp(p.harga)}</span></div>
  <em class="${p.stok ? "wait" : "done"}">stok ${p.stok}</em>
</a>`).join("") : pesanKosong("package", "Semua stok di atas 5 unit."));

const hitung = {};
db.produk.forEach((p) => {
  /* { n, kategori } → warna rak mengikuti kategori barangnya */
  const h = hitung[p.rak] = hitung[p.rak] || { n: 0, kategori: p.kategori };
  h.n++;
});
isi("rakInfo", `${Object.keys(hitung).length} dari ${semuaRak().length} rak terisi (rak kosong ditandai samar).`);
denahToko("denah", hitung, { klik: false, piksel: 20, tab: true });
