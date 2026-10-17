/* SORTIK — staff: kelola pesanan
   Dua tugas: menandai pesanan yang sudah dibayar pembeli (lunas + siapa staff
   yang mengonfirmasi) dan memajukan statusnya. Semua perubahan disimpan lewat
   tulis("pesanan"). Saat database siap:
     GET   /api/pesanan            -> isi db.pesanan
     PATCH /api/pesanan/<id>       -> { status, lunas, staff }                   */

const alur = ["Menunggu", "Diproses", "Siap", "Selesai"];
const berikut = { Menunggu: "Diproses", Diproses: "Siap", Siap: "Selesai" }; /* status lanjutan */
const state = { status: "" };

const baris = (o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div>
      <b>${p.nama || "-"}</b>
      <span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.pembeli || "-"} · ${o.jumlah} unit · ${rp(nilaiPesanan(o))}</span>
      <span>${o.bayar} · ${o.cara === "antar" ? "antar ke " + o.alamat : "ambil di tempat"}</span>
      <em class="${warna[o.status] || ""}">${o.status}</em> ${tagBayar(o)}
    </div>
    <div class="btns">
      ${o.lunas ? "" : `<button class="btn" type="button" data-lunas="${o.id}">${o.bayar === "Bayar di kasir" ? "Tandai Dibayar" : "Konfirmasi Transfer"}</button>`}
      ${berikut[o.status] ? `<button class="btn" type="button" data-maju="${o.id}">${berikut[o.status]} →</button>` : ""}
    </div>
  </div>`;
};

function daftar() {
  const hasil = [...db.pesanan]
    .filter((o) => !state.status || o.status === state.status)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const belum = hasil.filter((o) => !o.lunas).length;
  isi("hasil", `${hasil.length} pesanan${belum ? ` · ${belum} belum dibayar` : " · semua sudah dibayar"}`);
  isi("list", hasil.length ? hasil.map(baris).join("") : `<p class="kosong">Belum ada pesanan dengan status ini.</p>`);
  document.querySelectorAll("#chips button").forEach((b) => b.classList.toggle("on", b.dataset.status === state.status));
}

/* filter status: chip dibuat dari data supaya ikut menyesuaikan */
isi("chips", ["", ...alur].map((s) => `<button type="button" data-status="${s}">${s || "Semua"}</button>`).join(""));
el("chips").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) { state.status = state.status === b.dataset.status ? "" : b.dataset.status; daftar(); }
});

/* tandai lunas / majukan status */
el("list").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const o = db.pesanan.find((x) => x.id === +(b.dataset.lunas || b.dataset.maju));
  if (b.dataset.lunas) {
    o.lunas = true;
    o.staff = db.akun.nama;               /* siapa yang mengonfirmasi pembayaran */
    if (o.status === "Menunggu") o.status = "Diproses"; /* pembayaran OK -> langsung diproses */
  } else {
    o.status = berikut[o.status];
  }
  tulis("pesanan", db.pesanan); /* DB: PATCH /api/pesanan/<id> */
  daftar();
});

daftar();
