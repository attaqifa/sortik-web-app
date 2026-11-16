/* Kelola transaksi bersama untuk staff dan admin.
   Daftar ini antrean kerja: yang perlu ditindak paling atas, satu tombol
   "langkah berikutnya" per pesanan. */
const param = new URLSearchParams(location.search).get("status") || "";
/* ?status=belum (dari beranda) = saring pembayaran, bukan status */
let status = param === "belum" ? "" : param || "aktif";
let bayar = param === "belum" ? "belum" : "";
let cari = "";

const semua = () => db.pesanan;
const cocokStatus = (o, s) => !s || (s === "aktif" ? aktif(o) : o.status === s);
const cocokBayar = (o) => !bayar || (bayar === "belum" ? !o.lunas && !batal(o) : o.lunas);
const cocokCari = (o) => {
  if (!cari) return true;
  const teks = [kodePesanan(o), o.pembeli, ...o.items.map((x) => produkById(x.produk).nama)].join(" ").toLowerCase();
  return teks.includes(cari);
};
const STATUS_FILTER = [["aktif", "Aktif"], ...[...ALUR, "Dibatalkan"].map((s) => [s, s]), ["", "Semua"]];

/* urutan kerja: bukti transfer masuk → diproses → siap → menunggu bayar → selesai → batal */
const prioritas = (o) => {
  if (batal(o)) return 5;
  if (o.status === "Selesai") return 4;
  if (!o.lunas) return o.bukti ? 0 : 3;
  return o.status === "Siap" ? 2 : 1;
};
const urut = (a, b) => prioritas(a) - prioritas(b)
  /* yang aktif: terlama dulu (antre); yang selesai/batal: terbaru dulu */
  || (prioritas(a) >= 4 ? b.dibuat.localeCompare(a.dibuat) : a.dibuat.localeCompare(b.dibuat))
  || a.id - b.id;

/* status berikutnya yang boleh dipilih staff, atau null */
const lanjutan = (o) => {
  const tahap = ALUR.indexOf(o.status);
  return o.lunas && tahap >= 0 && tahap < ALUR.length - 1 ? ALUR[tahap + 1] : null;
};

const baris = (o) => {
  /* stok sudah dicadangkan saat checkout, jadi konfirmasi bayar tidak lagi bergantung pada stok */
  const kurang = false;
  const rincian = o.items.map((x) => {
    const p = produkById(x.produk);
    return `<span>${esc(p.nama || "Produk tidak tersedia")} · ${x.jumlah} unit · ${rp(x.harga * x.jumlah)}${p.rak ? " " + tagRak(p.rak) : ""}</span>`;
  }).join("");
  const tujuan = lanjutan(o);
  const aksi = batal(o) ? ""
    : !o.lunas ? `<button class="btn utama" type="button" data-lunas="${o.id}"${kurang ? ' disabled title="Stok tidak cukup"' : ""}><span class="ikon" data-lucide="credit-card"></span>${o.bayar === "Bayar di kasir" ? "Tandai Dibayar" : "Konfirmasi Transfer"}</button>`
    : tujuan ? `<button class="btn utama" type="button" data-lanjut="${o.id}" data-tujuan="${tujuan}"><span class="ikon" data-lucide="arrow-right"></span>Tandai ${tujuan}</button>`
    : "";
  return `<div class="row">
    <button class="thumb" type="button" data-foto="${o.id}" title="Perbesar foto barang">${fotoHTML(produkById(o.items[0].produk))}</button>
    <div><b>${kodePesanan(o)} · ${esc(o.pembeli || "-")}</b><span>${tglID(o.tanggal)} · ${rp(o.total)} · ${o.cara === "antar" ? "Antar ke " + esc(o.alamat || "-") : "Ambil di tempat"}</span>
      ${rincian}<div class="rowinfo">${tagStatus(o.status)}${tagBayar(o)}
      ${kurang ? '<span class="tag habis">Stok tidak cukup</span>' : ""}
      ${o.bukti ? `<button class="btn bukti" type="button" data-bukti="${o.id}">Lihat bukti transfer</button>` : !o.lunas && !batal(o) && o.bayar === "Transfer ke admin" ? '<span class="tag belum">Belum ada bukti</span>' : ""}</div></div>
    <div class="btns">${aksi}</div></div>`;
};

function daftar() {
  const hasil = semua().filter((o) => cocokStatus(o, status) && cocokBayar(o) && cocokCari(o)).sort(urut);
  const belum = hasil.filter((o) => !o.lunas && !batal(o)).length;
  isi("hasil", `${hasil.length} pesanan${belum ? ` · ${belum} belum dibayar` : ""}`);
  isi("list", hasil.length ? hasil.map(baris).join("")
    : pesanKosong("receipt", cari ? "Tidak ada pesanan yang cocok dengan pencarian." : status === "aktif" ? "Semua pesanan sudah ditangani." : "Belum ada pesanan dengan status ini."));
  segarChip();
}
function segarChip() {
  el("chips").querySelectorAll("button").forEach((b, i) => {
    const [nilai, teks] = STATUS_FILTER[i];
    const ikon = nilai && nilai !== "aktif" ? ikonStatus(nilai) : "";
    b.innerHTML = `${ikon}${teks} (${semua().filter((o) => cocokStatus(o, nilai)).length})`;
  });
  gambarIkon();
}
chipSaring("chips", STATUS_FILTER, (v) => { status = v; daftar(); }, status);
el("bayar").value = bayar;
el("bayar").addEventListener("change", () => { bayar = el("bayar").value; daftar(); });
el("cari").addEventListener("input", () => { cari = el("cari").value.trim().toLowerCase(); daftar(); });

el("list").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const o = db.pesanan.find((x) => x.id === +(b.dataset.foto || b.dataset.bukti || b.dataset.lunas || b.dataset.lanjut));
  if (!o) return;
  if (b.dataset.foto) { const p = produkById(o.items[0].produk), sumber = galeriProduk(p)[0]; if (sumber) lihatGambar(sumber, p.nama); else notif("Barang ini belum punya foto."); return; }
  if (b.dataset.bukti) { if (o.bukti) lihatGambar(o.bukti, `Bukti transfer ${kodePesanan(o)}`); return; }
  if (b.dataset.lanjut) return lanjutkan(o, b);
  if (!b.dataset.lunas) return;
  b.disabled = true;
  const r = await api.post(`/pesanan/${o.id}/bayar`, {});
  if (r.error) { notif(r.error); b.disabled = false; return; }
  perbarui(r.data);
  notif("Pembayaran dikonfirmasi.");
  daftar();
});

/* ganti pesanan di cache db dengan versi terbaru dari server */
function perbarui(baru) {
  const i = db.pesanan.findIndex((x) => x.id === baru.id);
  if (i >= 0) db.pesanan[i] = baru;
  gambarSidebar();
}

/* majukan status satu langkah (Diproses → Siap → Selesai); urutan dijaga server */
async function lanjutkan(o, b) {
  b.disabled = true;
  const r = await api.post(`/pesanan/${o.id}/status`, { status: b.dataset.tujuan });
  if (r.error) { notif(r.error); b.disabled = false; return; }
  perbarui(r.data);
  notif(`${kodePesanan(r.data)} → ${r.data.status}`);
  daftar();
}
daftar();
