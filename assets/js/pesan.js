/* SORTIK — pesan & booking, dipakai pesan.html DAN riwayat.html
   riwayat.html hanyalah halaman ini dengan filter "Selesai" (data-status di <body>).
   Semua render dari db.pesanan (app.js) — saat data pindah ke database, logika di
   bawah tidak perlu diubah. Kode pesanan dibentuk dari id (BK-2026-001 dst.). */

const alur = ["Menunggu", "Diproses", "Siap", "Selesai"]; /* urutan alur pesanan */
const aksi = { Menunggu: "Konfirmasi Pembayaran", Siap: "Konfirmasi Pengambilan" };

/* riwayat.html = mode "Selesai"; pesan.html = yang masih berjalan */
const mode = document.body.dataset.status || "";
const state = { status: "" };
const tampil = (o) => (mode === "Selesai" ? o.status === "Selesai" : o.status !== "Selesai");

/* terbaru dulu — saat pakai database, urutan ini bisa jadi ORDER BY tanggal DESC */
const pesanan = () => [...db.pesanan].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
const kode = (o) => `BK-2026-${String(o.id).padStart(3, "0")}`;
const bln = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");
const tgl = (s) => { const [y, m, d] = s.split("-"); return `${d} ${bln[m - 1]} ${y}`; };

/* satu baris pesanan — kelas .row sama dengan beranda */
const baris = (o) => {
  const p = produkById(o.produk);
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kode(o)} · ${tgl(o.tanggal)} · ${o.jumlah} item · ${rp((p.harga || 0) * o.jumlah)}</span></div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </button>`;
};

/* detail satu pesanan: alur status, produk, subtotal, dan aksinya */
const rincian = (o) => {
  const p = produkById(o.produk);
  const n = alur.indexOf(o.status);
  return `<a class="back" href="#">← Kembali ke daftar</a>
  <ol class="steps">${alur.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>
  <div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama || "-"}</b><span>${kode(o)} · ${o.jumlah} unit · Rak ${p.rak || "-"}</span></div>
    <em class="${warna[o.status] || ""}">${o.status}</em>
  </div>
  <div class="sum"><span>Subtotal</span><b>${rp((p.harga || 0) * o.jumlah)}</b></div>
  ${aksi[o.status] ? `<button class="primary" id="aksi" type="button">${aksi[o.status]}</button>` : ""}`;
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
  /* tombol aksi memajukan status — sementara di client, nanti panggil API */
  const maju = alur[alur.indexOf(o.status) + 1];
  if (el("aksi")) el("aksi").onclick = () => { o.status = maju; daftar(); buka(id); };
}

/* chip status — hanya halaman pesan.html yang punya; isinya diambil dari data */
if (el("chips")) {
  const ada = [...new Set(db.pesanan.filter(tampil).map((o) => o.status))].sort((a, b) => alur.indexOf(a) - alur.indexOf(b));
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
