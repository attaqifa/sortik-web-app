/* Kelola pesanan — tandai pembayaran diterima dan majukan status. */

const alur = ["Menunggu", "Diproses", "Siap", "Selesai"];
const berikut = { Menunggu: "Diproses", Diproses: "Siap", Siap: "Selesai" };
let status = "";

const baris = (o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div>
      <b>${p.nama || "-"}</b>
      <span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.pembeli || "-"} · ${o.jumlah} unit · ${rp(nilaiPesanan(o))}</span>
      <span>${o.bayar} · ${o.cara === "antar" ? "antar ke " + o.alamat : "ambil di tempat"}</span>
      <em class="${STATUS[o.status] || ""}">${o.status}</em> ${tagBayar(o)}
    </div>
    <div class="btns">
      ${o.lunas ? "" : `<button class="btn" type="button" data-lunas="${o.id}">${o.bayar === "Bayar di kasir" ? "Tandai Dibayar" : "Konfirmasi Transfer"}</button>`}
      ${berikut[o.status] ? `<button class="btn" type="button" data-maju="${o.id}">${berikut[o.status]} →</button>` : ""}
    </div>
  </div>`;
};

function daftar() {
  const hasil = db.pesanan
    .filter((o) => !status || o.status === status)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const belum = hasil.filter((o) => !o.lunas).length;
  isi("hasil", `${hasil.length} pesanan${belum ? ` · ${belum} belum dibayar` : " · semua sudah dibayar"}`);
  isi("list", hasil.length ? hasil.map(baris).join("") : `<p class="kosong">Belum ada pesanan dengan status ini.</p>`);
}

chipSaring("chips", [["", "Semua"], ...alur.map((s) => [s, s])], (v) => { status = v; daftar(); });

el("list").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const o = db.pesanan.find((x) => x.id === +(b.dataset.lunas || b.dataset.maju));
  if (!o) return;
  if (b.dataset.lunas) {
    o.lunas = true;
    o.staff = db.akun.nama;
    if (o.status === "Menunggu") o.status = "Diproses";
  } else {
    o.status = berikut[o.status];
  }
  simpan("pesanan");
  notif(b.dataset.lunas ? "Pembayaran dikonfirmasi" : `Status → ${o.status}`);
  daftar();
});

daftar();
