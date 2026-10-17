/* SORTIK — pesan & booking, dipakai pesan.html DAN riwayat.html
   Hanya menampilkan pesanan milik pembeli yang sedang masuk (pesananku()). */

const alur = ["Menunggu", "Diproses", "Siap", "Selesai"]; /* urutan alur pesanan */
const ambil = { ambil: "Ambil di Tempat", antar: "Antar ke Alamat" }; /* cara pengambilan dari checkout */

/* riwayat.html = mode "Selesai"; pesan.html = yang masih berjalan */
const mode = document.body.dataset.status || "";
const state = { status: "" };
const tampil = (o) => (mode === "Selesai" ? o.status === "Selesai" : o.status !== "Selesai");

/* terbaru dulu — saat pakai database, urutan ini bisa jadi ORDER BY tanggal DESC */
const pesanan = () => [...pesananku()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

/* satu baris pesanan — kelas .row sama dengan beranda */
const baris = (o) => {
  const p = produkById(o.produk);
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.jumlah} item · ${rp(nilaiPesanan(o))}${o.lunas ? "" : " · belum dibayar"}</span></div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </button>`;
};

/* detail satu pesanan: alur status, produk, dan rincian pembayaran */
const rincian = (o) => {
  const p = produkById(o.produk);
  const n = alur.indexOf(o.status);
  return `<a class="back" href="#">← Kembali ke daftar</a>
  <ol class="steps">${alur.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>
  <div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${o.jumlah} unit · Rak ${p.rak || "-"}</span></div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </div>
  <div class="sum"><span>Subtotal</span><b>${rp(nilaiPesanan(o))}</b></div>
  <div class="sum"><span>Pengambilan</span><b>${ambil[o.cara] || ambil.ambil}${o.alamat ? " — " + o.alamat : ""}</b></div>
  <div class="sum"><span>Pembayaran</span><b>${o.bayar || "Transfer ke admin"}</b></div>
  <div class="sum"><span>Status bayar</span><b>${tagBayar(o)}</b></div>
  <p class="note">Pembayaran dan status pesanan dikonfirmasi oleh staff ${db.toko.nama}. Hubungi
    <a href="https://wa.me/${db.toko.wa}" target="_blank" rel="noopener">+${db.toko.wa}</a> bila ada pertanyaan.</p>`;
};

function daftar() {
  const hasil = pesanan().filter((o) => tampil(o) && (!state.status || o.status === state.status));
  isi("list", hasil.length ? hasil.map(baris).join("") : `<p class="kosong">Belum ada pesanan di sini.</p>`);
  document.querySelectorAll("#chips button").forEach((b) => b.classList.toggle("on", b.dataset.status === state.status));
}

function buka(id) {
  const o = pesanan().find((x) => x.id === id);
  el("daftar").hidden = true;
  el("detail").hidden = false;
  isi("detail", rincian(o));
  el("detail").scrollIntoView(); /* detail langsung terlihat, tanpa scroll manual */
}

/* chip status — hanya halaman pesan.html yang punya; isinya diambil dari data */
if (el("chips")) {
  const ada = [...new Set(pesananku().filter(tampil).map((o) => o.status))].sort((a, b) => alur.indexOf(a) - alur.indexOf(b));
  isi("chips", ["", ...ada].map((s) => `<button type="button" data-status="${s}">${s || "Semua"}</button>`).join(""));
  el("chips").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) { state.status = state.status === b.dataset.status ? "" : b.dataset.status; daftar(); }
  });
}

el("list").addEventListener("click", (e) => {
  const b = e.target.closest(".row");
  if (b) buka(+b.dataset.id);
});
el("detail").addEventListener("click", (e) => {
  if (e.target.closest(".back")) { e.preventDefault(); el("detail").hidden = true; el("daftar").hidden = false; }
});

daftar();
