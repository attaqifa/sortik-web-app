/* Kelola transaksi bersama untuk staff dan admin. */
let status = new URLSearchParams(location.search).get("status") || "";
const semua = () => transaksi(db.pesanan);
const jmlStatus = (s) => semua().filter((o) => s === "belum" ? !o.lunas : o.status === s).length;
const baris = (o) => {
  const items = itemPesanan(o);
  const kurang = !o.lunas && items.some((x) => {
    const p = produkById(x.produk);
    return !p.id || !Number.isInteger(p.stok) || p.stok < x.jumlah;
  });
  const rincian = items.map((x) => {
    const p = produkById(x.produk);
    return `<span>${esc(p.nama || "Produk tidak tersedia")} · ${x.jumlah} unit · ${rp(subtotalPesanan(x))}${p.rak ? ` · Rak ${esc(labelRak(p.rak))}` : ""}${!o.lunas ? ` · stok ${Number.isInteger(p.stok) ? p.stok : 0}` : ""}</span>`;
  }).join("");
  const tahap = ALUR.indexOf(o.status);
  return `<div class="row">
    <button class="thumb" type="button" data-foto="${o.id}" title="Perbesar foto barang">${fotoHTML(produkById(o.produk))}</button>
    <div><b>${kodePesanan(o)} · ${esc(o.pembeli || "-")}</b><span>${tglID(o.tanggal)} · ${rp(totalTransaksi(o))} · ${o.cara === "antar" ? "Antar ke " + esc(o.alamat || "-") : "Ambil di tempat"}</span>
      ${rincian}<div class="rowinfo">${tagStatus(o.status)}${tagBayar(o)}
      ${kurang ? '<span class="tag habis">Stok tidak cukup</span>' : ""}
      ${o.bukti ? `<button class="btn bukti" type="button" data-bukti="${o.id}">Lihat bukti transfer</button>` : !o.lunas && o.bayar === "Transfer ke admin" ? '<span class="tag belum">Belum ada bukti</span>' : ""}</div></div>
    <div class="btns">
      ${o.lunas ? "" : `<button class="btn" type="button" data-lunas="${o.id}"${kurang ? ' disabled title="Stok tidak cukup"' : ""}>${o.bayar === "Bayar di kasir" ? "Tandai Dibayar" : "Konfirmasi Transfer"}</button>`}
      <select class="statuspilih" data-status="${o.id}" aria-label="Ubah status pesanan">
        ${ALUR.map((s, i) => `<option value="${s}"${s === o.status ? " selected" : ""}${i !== tahap && (!o.lunas || i !== tahap + 1) ? " disabled" : ""}>${s}</option>`).join("")}
      </select></div></div>`;
};
function daftar() {
  const hasil = semua().filter((o) => !status || (status === "belum" ? !o.lunas : o.status === status))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const belum = hasil.filter((o) => !o.lunas).length;
  isi("hasil", `${hasil.length} pesanan${belum ? ` · ${belum} belum dibayar` : " · semua sudah dibayar"}`);
  isi("list", hasil.length ? hasil.map(baris).join("") : pesanKosong("receipt", "Belum ada pesanan dengan status ini."));
  segarChip();
}
function segarChip() {
  const label = [["", "Semua"], ...ALUR.map((s) => [s, s]), ["belum", "Belum dibayar"]];
  el("chips").querySelectorAll("button").forEach((b, i) => {
    const [nilai, teks] = label[i];
    const ikon = nilai === "belum" ? '<span class="ikon" data-lucide="credit-card"></span>' : nilai ? ikonStatus(nilai) : "";
    b.innerHTML = `${ikon}${teks} (${nilai ? jmlStatus(nilai) : semua().length})`;
  });
  gambarIkon();
}
chipSaring("chips", [["", "Semua"], ...ALUR.map((s) => [s, s]), ["belum", "Belum dibayar"]], (v) => { status = v; daftar(); }, status);
el("list").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const o = db.pesanan.find((x) => x.id === +(b.dataset.foto || b.dataset.bukti || b.dataset.lunas));
  if (!o) return;
  if (b.dataset.foto) { const p = produkById(o.produk), sumber = galeriProduk(p)[0]; if (sumber) lihatGambar(sumber, p.nama); else notif("Barang ini belum punya foto."); return; }
  if (b.dataset.bukti) { if (o.bukti) lihatGambar(o.bukti, `Bukti transfer ${kodePesanan(o)}`); return; }
  if (!b.dataset.lunas) return;
  const items = itemPesanan(o);
  if (items.some((x) => x.lunas)) return notif("Pesanan sudah dibayar atau memiliki status pembayaran tidak konsisten.");
  const kebutuhan = new Map();
  for (const x of items) kebutuhan.set(x.produk, (kebutuhan.get(x.produk) || 0) + x.jumlah);
  for (const [id, jumlah] of kebutuhan) {
    const p = produkById(id);
    if (!p.id || !Number.isInteger(jumlah) || jumlah < 1 || !Number.isInteger(p.stok) || p.stok < jumlah)
      return notif("Stok tidak cukup. Pembayaran belum dikonfirmasi.");
  }
  b.disabled = true;
  const sebelum = items.map((x) => ({ ...x }));
  const stokLama = [...kebutuhan].map(([id]) => [produkById(id), produkById(id).stok]);
  const sekarang = new Date();
  const kini = sekarang.toISOString();
  items.forEach((x) => { x.lunas = true; x.staff = db.akun.nama; x.dibayarPada = kini; x.tanggalDibayar = tanggalLokal(sekarang); if (x.status === "Menunggu") x.status = "Diproses"; });
  kebutuhan.forEach((jumlah, id) => { produkById(id).stok -= jumlah; });
  if (!await simpan("pesanan")) {
    items.forEach((x, i) => { Object.keys(x).forEach((k) => delete x[k]); Object.assign(x, sebelum[i]); });
    stokLama.forEach(([p, stok]) => { p.stok = stok; });
    b.disabled = false; return;
  }
  notif("Pembayaran dikonfirmasi dan stok diperbarui.");
  daftar();
});
el("list").addEventListener("change", async (e) => {
  const pilih = e.target.closest("select[data-status]");
  if (!pilih) return;
  const o = db.pesanan.find((x) => x.id === +pilih.dataset.status);
  if (!o || pilih.value === o.status) return;
  const items = itemPesanan(o), tahap = ALUR.indexOf(o.status);
  if (!items.every((x) => x.lunas && x.status === o.status) || tahap < 0 || ALUR.indexOf(pilih.value) !== tahap + 1) {
    pilih.value = o.status; return notif("Pesanan harus lunas dan diproses sesuai urutan status.");
  }
  const lama = o.status;
  const tujuan = pilih.value;
  pilih.disabled = true;
  items.forEach((x) => { x.status = tujuan; });
  if (!await simpan("pesanan")) { items.forEach((x) => { x.status = lama; }); pilih.value = lama; pilih.disabled = false; return; }
  notif(`${kodePesanan(o)} → ${tujuan}`); daftar();
});
daftar();
