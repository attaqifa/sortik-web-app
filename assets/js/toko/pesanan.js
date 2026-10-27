/* Kelola pesanan — konfirmasi bayar, lihat bukti transfer, ubah status.
   Bersama: dipakai staff/pesanan.html dan admin/pesanan.html. */

/* ?status= preset filter (dipakai kartu Perlu Tindakan) */
let status = new URLSearchParams(location.search).get("status") || "";

const jmlStatus = (s) => db.pesanan.filter((o) => (s === "belum" ? !o.lunas : o.status === s)).length;

const baris = (o) => {
  const p = produkById(o.produk);
  /* cek stok: kurang dari jumlah dipesan = merah (jangan dipromes) */
  const kurang = p.stok != null && p.stok < o.jumlah;
  return `<div class="row">
    <button class="thumb" type="button" data-foto="${o.id}" title="Perbesar foto barang">${fotoHTML(p)}</button>
    <div>
      <b>${p.nama || "-"}</b>
      <span>${kodePesanan(o)} · ${o.pembeli || "-"} · ${tglID(o.tanggal)}</span>
      <span>${o.jumlah} unit · ${rp(nilaiPesanan(o))} · ${o.cara === "antar" ? "Antar ke " + (o.alamat || "-") : "Ambil di tempat"}</span>
      <div class="rowinfo">
        <em class="${STATUS[o.status] || ""}">${o.status}</em>
        ${p.rak ? `<span class="tag ikonnya biru" title="Lokasi rak barang ini"><span class="ikon" data-lucide="warehouse"></span>Rak ${esc(labelRak(p.rak))}</span>` : ""}
        ${p.stok != null ? `<span class="tag ikonnya ${kurang ? "habis" : "abu"}" title="${kurang ? "Stok tidak cukup — jangan dipromes dulu" : "Sisa stok barang ini"}"><span class="ikon" data-lucide="boxes"></span>Stok ${p.stok}${kurang ? ` — kurang dari ${o.jumlah} dipesan` : " tersisa"}</span>` : ""}
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
    .filter((o) => !status || (status === "belum" ? !o.lunas : o.status === status))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const belum = hasil.filter((o) => !o.lunas).length;
  isi("hasil", `${hasil.length} pesanan${belum ? ` · ${belum} belum dibayar` : " · semua sudah dibayar"}`);
  isi("list", hasil.length ? hasil.map(baris).join("")
    : pesanKosong(status === "belum" ? "credit-card" : "receipt",
      status === "belum" ? "Semua pesanan sudah dibayar." : "Belum ada pesanan dengan status ini."));
  segarChip();
}

/* label chip menyertakan hitungan */
function segarChip() {
  const label = ["Semua", ...ALUR, "Belum dibayar"];
  el("chips").querySelectorAll("button").forEach((b, i) => {
    const s = i === 0 ? "" : i === label.length - 1 ? "belum" : label[i];
    b.textContent = `${label[i]} (${i ? jmlStatus(s) : db.pesanan.length})`;
  });
}

chipSaring("chips", [["", "Semua"], ...ALUR.map((s) => [s, s]), ["belum", "Belum dibayar"]],
  (v) => { status = v; daftar(); }, status);

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

/* status diubah lewat pilihan */
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
