/* Pesan & booking — dipakai pesan.html dan riwayat.html (body[data-status]). */

const alur = ["Menunggu", "Diproses", "Siap", "Selesai"];
const AMBIL = { ambil: "Ambil di Tempat", antar: "Antar ke Alamat" };
const mode = document.body.dataset.status || "";
let status = "";

const tampil = (o) => (mode === "Selesai" ? o.status === "Selesai" : o.status !== "Selesai");
const pesanan = () => [...pesananku()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

const baris = (o) => {
  const p = produkById(o.produk);
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.jumlah} item · ${rp(nilaiPesanan(o))}${o.lunas ? "" : " · belum dibayar"}</span></div>
    <em class="${STATUS[o.status] || ""}">${o.status}</em>
  </button>`;
};

const rincian = (o) => {
  const p = produkById(o.produk);
  const n = alur.indexOf(o.status);
  return `<a class="back" href="#">← Kembali ke daftar</a>
  <ol class="steps">${alur.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>
  <div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${o.jumlah} unit · Rak ${p.rak || "-"}</span></div>
    <em class="${STATUS[o.status] || ""}">${o.status}</em>
  </div>
  <div class="sum"><span>Subtotal</span><b>${rp(nilaiPesanan(o))}</b></div>
  <div class="sum"><span>Pengambilan</span><b>${AMBIL[o.cara] || AMBIL.ambil}${o.alamat ? " — " + o.alamat : ""}</b></div>
  <div class="sum"><span>Pembayaran</span><b>${o.bayar || "Transfer ke admin"}</b></div>
  <div class="sum"><span>Status bayar</span><b>${tagBayar(o)}</b></div>
  <p class="note">Pembayaran dan status pesanan dikonfirmasi oleh staff ${db.toko.nama}. Hubungi
    <a href="https://wa.me/${db.toko.wa}" target="_blank" rel="noopener">+${db.toko.wa}</a> bila ada pertanyaan.</p>`;
};

function daftar() {
  const hasil = pesanan().filter((o) => tampil(o) && (!status || o.status === status));
  isi("list", hasil.length ? hasil.map(baris).join("") : `<p class="kosong">Belum ada pesanan di sini.</p>`);
}

function buka(id) {
  const o = pesanan().find((x) => x.id === id);
  if (!o) return;
  el("daftar").hidden = true;
  el("detail").hidden = false;
  isi("detail", rincian(o));
  el("detail").scrollIntoView();
}

if (el("chips")) {
  const ada = [...new Set(pesananku().filter(tampil).map((o) => o.status))].sort((a, b) => alur.indexOf(a) - alur.indexOf(b));
  chipSaring("chips", [["", "Semua"], ...ada.map((s) => [s, s])], (v) => { status = v; daftar(); });
}

el("list").addEventListener("click", (e) => {
  const b = e.target.closest(".row");
  if (b) buka(+b.dataset.id);
});
el("detail").addEventListener("click", (e) => {
  if (e.target.closest(".back")) {
    e.preventDefault();
    el("detail").hidden = true;
    el("daftar").hidden = false;
  }
});

daftar();
