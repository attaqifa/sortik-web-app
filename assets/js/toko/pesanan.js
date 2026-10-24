/* Kelola pesanan — tandai pembayaran diterima, lihat bukti transfer, dan
   ubah status lewat daftar pilihan.
   Skrip bersama: dipakai staff/pesanan.html dan admin/pesanan.html. */

let status = "";

const baris = (o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <button class="thumb" type="button" data-foto="${o.id}" title="Perbesar foto barang">${fotoHTML(p)}</button>
    <div>
      <b>${p.nama || "-"}</b>
      <span>${kodePesanan(o)} · ${o.pembeli || "-"} · ${tglID(o.tanggal)}</span>
      <span>${o.jumlah} unit · ${rp(nilaiPesanan(o))} · Rak ${p.rak || "-"} · ${o.cara === "antar" ? "Antar ke " + (o.alamat || "-") : "Ambil di tempat"}</span>
      <div class="rowinfo">
        <em class="${STATUS[o.status] || ""}">${o.status}</em>
        ${tagBayar(o)}
        ${o.bukti
          ? `<button class="btn bukti" type="button" data-bukti="${o.id}"><span class="ikon" data-lucide="receipt"></span>Lihat bukti transfer</button>`
          : !o.lunas && o.bayar === "Transfer ke admin" ? `<span class="tag belum">Belum ada bukti</span>` : ""}
      </div>
    </div>
    <div class="btns">
      ${o.lunas ? "" : `<button class="btn" type="button" data-lunas="${o.id}">${o.bayar === "Bayar di kasir" ? "Tandai Dibayar" : "Konfirmasi Transfer"}</button>`}
      <select class="statuspilih" data-status="${o.id}" title="Ubah status pesanan" aria-label="Ubah status pesanan">
        ${ALUR.map((s) => `<option value="${s}"${s === o.status ? " selected" : ""}>${s}</option>`).join("")}
      </select>
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

chipSaring("chips", [["", "Semua"], ...ALUR.map((s) => [s, s])], (v) => { status = v; daftar(); });

el("list").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.foto) {
    const o = db.pesanan.find((x) => x.id === +b.dataset.foto);
    const p = o ? produkById(o.produk) : {};
    const sumber = galeriProduk(p)[0];
    if (sumber) lihatGambar(sumber, p.nama);
    else notif("Barang ini belum punya foto.");
    return;
  }
  if (b.dataset.bukti) {
    const o = db.pesanan.find((x) => x.id === +b.dataset.bukti);
    if (o && o.bukti) lihatGambar(o.bukti, `Bukti transfer ${kodePesanan(o)}`);
    return;
  }
  if (!b.dataset.lunas) return;
  const o = db.pesanan.find((x) => x.id === +b.dataset.lunas);
  if (!o) return;
  o.lunas = true;
  o.staff = db.akun.nama;
  if (o.status === "Menunggu") o.status = "Diproses";
  simpan("pesanan");
  notif("Pembayaran dikonfirmasi");
  daftar();
});

/* status pesanan diubah lewat daftar pilihan, bukan tombol maju satu langkah */
el("list").addEventListener("change", (e) => {
  const pilih = e.target.closest("select[data-status]");
  if (!pilih) return;
  const o = db.pesanan.find((x) => x.id === +pilih.dataset.status);
  if (!o) return;
  o.status = pilih.value;
  simpan("pesanan");
  notif(`${kodePesanan(o)} → ${o.status}`);
  daftar();
});

daftar();
