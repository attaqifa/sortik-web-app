/* Keuangan — ringkasan uang toko:
   pendapatan dihitung dari pesanan yang sudah lunas, piutang dari yang belum,
   dan pengeluaran dicatat manual oleh admin. Dipakai bersama
   staff/keuangan.html (hanya lihat) dan admin/keuangan.html (bisa mencatat). */

const pengeluaran = () => db.keuangan.pengeluaran || [];
const totalKeluar = () => pengeluaran().reduce((n, x) => n + (+x.jumlah || 0), 0);
const kategoriKeluar = () => [...new Set(pengeluaran().map((x) => x.kategori).filter(Boolean))];

const hariIni = () => tanggalLokal(new Date());

/* nama barang pesanan: item pertama, plus "+N lainnya" bila lebih dari satu */
const ringkasItem = (o) => {
  const n = (o.items || []).length;
  return n ? `${produkById(o.items[0].produk).nama || "barang"}${n > 1 ? ` +${n - 1} lainnya` : ""}` : "barang";
};

/* ---------- ringkasan (kartu statistik) ---------- */
function gambarStats() {
  const keluar = totalKeluar();
  const laba = totalPendapatan() - keluar;
  isi("stats", `
    <div><span class="ikon" data-lucide="trending-up"></span><b class="hijau">${rp(totalPendapatan())}</b><span>Pendapatan (pesanan lunas)</span></div>
    <div><span class="ikon" data-lucide="clock"></span><b>${rp(totalPiutang())}</b><span>Piutang (belum lunas)</span></div>
    <div><span class="ikon" data-lucide="trending-down"></span><b>${rp(keluar)}</b><span>Pengeluaran tercatat</span></div>
    <div><span class="ikon" data-lucide="wallet"></span><b class="${laba < 0 ? "merah" : "hijau"}">${rp(laba)}</b><span>Laba bersih</span></div>`);
}

/* ---------- grafik batang 6 bulan terakhir ---------- */
function ringkasanBulanan() {
  const kini = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(kini.getFullYear(), kini.getMonth() - 5 + i, 1);
    const kunci = tanggalLokal(d).slice(0, 7);
    return {
      label: bln[d.getMonth()],
      tahun: d.getFullYear(),
      p: db.pesanan.filter((o) => uangMasuk(o) && tanggalBayar(o).startsWith(kunci)).reduce((n, o) => n + nilaiPesanan(o), 0),
      k: pengeluaran().filter((x) => String(x.tanggal).startsWith(kunci)).reduce((n, x) => n + (+x.jumlah || 0), 0)
    };
  });
}

function gambarGrafik() {
  const dataBulan = ringkasanBulanan();
  const maks = Math.max(1, ...dataBulan.map((b) => Math.max(b.p, b.k)));
  isi("grafik", dataBulan.map((b) => `<div class="kolom">
    <div class="batang" title="${b.label}: pendapatan ${rp(b.p)} · pengeluaran ${rp(b.k)}">
      <i class="p" style="height:${Math.max(2, Math.round((b.p / maks) * 100))}%"></i>
      <i class="k" style="height:${Math.max(2, Math.round((b.k / maks) * 100))}%"></i>
    </div><label>${b.label}</label></div>`).join(""));
}

/* ---------- arus kas terakhir + chip saring kategori pengeluaran ---------- */
let saringKat = "";

function gambarChips() {
  chipSaring("chips", [["", "Semua"], ...kategoriKeluar().map((k) => [k, esc(k)])], (nilai) => {
    saringKat = nilai;
    gambarKas();
  }, saringKat);
}

function arusKas() {
  /* gabungkan uang masuk (pesanan lunas) & keluar (pengeluaran), urut dari terbaru */
  return [
    ...db.pesanan.filter(uangMasuk).map((o) => ({
      tanggal: tanggalBayar(o), masuk: true, kategori: "Pendapatan",
      keterangan: `Pesanan ${kodePesanan(o)} - ${ringkasItem(o)}`,
      jumlah: nilaiPesanan(o)
    })),
    ...pengeluaran().map((x) => ({
      tanggal: x.tanggal, masuk: false, id: x.id,
      kategori: x.kategori || "Lain-lain", keterangan: x.keterangan, jumlah: +x.jumlah || 0
    }))
  ].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

function gambarKas() {
  const acara = arusKas();
  /* chip hanya menyaring pengeluaran (kategori miliknya); pendapatan tampil saat "Semua" */
  const tampil = saringKat ? acara.filter((a) => !a.masuk && a.kategori === saringKat) : acara;
  const baris = tampil.slice(0, 30).map((a) => `<div class="row">
    <span class="ikas${a.masuk ? "" : " merah"}" title="${a.masuk ? "Uang masuk" : "Uang keluar"}">
      <span class="ikon" data-lucide="${a.masuk ? "arrow-down-left" : "arrow-up-right"}"></span></span>
    <div><b>${esc(a.keterangan)}</b><span>${tglID(a.tanggal)}</span>
      <div class="rowinfo"><span class="tag ${a.masuk ? "biru" : "abu"}">${esc(a.kategori)}</span>${!a.masuk && db.akun.role === "admin" ? `<button class="btn" type="button" data-hapus="${a.id}" title="Hapus catatan ini"><span class="ikon" data-lucide="trash-2"></span>Hapus</button>` : ""}</div>
    </div>
    <b>${a.masuk ? "+" : "−"} ${rp(a.jumlah)}</b>
  </div>`).join("");

  if (baris) isi("list", baris);
  else isi("list", pesanKosong("receipt", saringKat
    ? `Belum ada pengeluaran kategori "${esc(saringKat)}".`
    : "Belum ada arus kas — catat pengeluaran atau tunggu pesanan lunas."));
}

/* ---------- formulir catat pengeluaran (khusus admin) ---------- */
if (db.akun.role === "admin") {
  const kartu = el("catat");
  kartu.hidden = false;
  kartu.innerHTML = `<h2>Catat Pengeluaran</h2>
  <div class="form">
    <div><label class="lbl" for="k-tanggal">Tanggal</label><input type="date" id="k-tanggal" value="${hariIni()}"></div>
    <div><label class="lbl" for="k-kategori">Kategori</label>
      <input type="text" id="k-kategori" list="daftarKat" placeholder="Mis. Gaji">
      <datalist id="daftarKat">${kategoriKeluar().map((k) => `<option value="${esc(k)}">`).join("")}</datalist></div>
    <div class="full"><label class="lbl" for="k-ket">Keterangan</label><input type="text" id="k-ket" placeholder="Mis. Listrik & air sebulan"></div>
    <div><label class="lbl" for="k-jumlah">Jumlah (Rp)</label><input type="number" id="k-jumlah" min="0" step="1000" placeholder="500000"></div>
    <div class="btns">
      <button class="primary" id="k-simpan" type="button">Catat Pengeluaran</button>
      <span class="petunjuk" id="k-info"></span>
    </div>
  </div>`;

  el("k-simpan").onclick = async () => {
    const tanggal = el("k-tanggal").value;
    const keterangan = el("k-ket").value.trim();
    const jumlah = +el("k-jumlah").value || 0;
    if (!tanggal) return isi("k-info", "⚠ Isi tanggalnya dulu.");
    if (!keterangan) return isi("k-info", "⚠ Isi keterangan pengeluarannya.");
    if (jumlah <= 0) return isi("k-info", "⚠ Jumlah harus lebih dari 0.");
    const { data, error } = await api.post("/pengeluaran", { tanggal, kategori: el("k-kategori").value.trim(), keterangan, jumlah });
    if (error) return isi("k-info", "⚠ " + esc(error));
    db.keuangan.pengeluaran = [data, ...pengeluaran()];
    el("k-ket").value = "";
    el("k-jumlah").value = "";
    el("k-info").textContent = "✓ Tercatat — langsung masuk ke ringkasan & grafik.";
    saringKat = "";
    segarkan();
    notif("Pengeluaran tercatat.");
  };

  /* hapus catatan pengeluaran */
  el("list").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-hapus]");
    if (!b) return;
    const id = +b.dataset.hapus;
    const x = pengeluaran().find((p) => p.id === id) || {};
    if (!(await konfirmasi("Hapus pengeluaran ini?", `"${x.keterangan}" (${rp(x.jumlah)}) hilang dari ringkasan.`))) return;
    const { error } = await api.hapus("/pengeluaran/" + id);
    if (error) return notif(error);
    db.keuangan.pengeluaran = pengeluaran().filter((p) => p.id !== id);
    segarkan();
    notif("Catatan pengeluaran dihapus.");
  });
}

/* ---------- ekspor ---------- */
const adminKeuangan = db.akun.role === "admin";
isi("eksport", `
  ${adminKeuangan ? '<button class="btn" type="button" id="unduhCsv"><span class="ikon" data-lucide="download"></span>Unduh CSV</button>' : ""}
  <button class="btn" type="button" id="cetak"><span class="ikon" data-lucide="file-down"></span>Unduh PDF</button>`);

if (adminKeuangan) {
  el("unduhCsv").onclick = () => {
    /* tabel: uang masuk (pesanan lunas) + uang keluar (pengeluaran), lalu ringkasan */
    const tabel = [["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah (Rp)"]];
    db.pesanan.filter(uangMasuk).forEach((o) =>
      tabel.push([tanggalBayar(o), "Masuk", "Pendapatan", `Pesanan ${kodePesanan(o)} — ${ringkasItem(o)}`, nilaiPesanan(o)]));
    pengeluaran().forEach((x) =>
      tabel.push([x.tanggal, "Keluar", x.kategori || "Lain-lain", x.keterangan, +x.jumlah || 0]));
    tabel.push([], ["", "Ringkasan", "", "Pendapatan", totalPendapatan()]);
    tabel.push(["", "Ringkasan", "", "Pengeluaran", totalKeluar()]);
    tabel.push(["", "Ringkasan", "", "Laba bersih", totalPendapatan() - totalKeluar()]);

    /* pemisah ";" (Excel id-ID) + BOM agar karakter pembaca langsung benar */
    const csv = "\ufeff" + tabel
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const tautan = document.createElement("a");
    tautan.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    tautan.download = `keuangan-sortik-${hariIni()}.csv`;
    tautan.click();
    URL.revokeObjectURL(tautan.href);
    notif("Laporan keuangan diunduh.");
  };
}

/* PDF dibuat langsung di browser (jsPDF), bukan lewat dialog cetak */
el("cetak").onclick = () => {
  if (!window.jspdf) return notif("Pustaka PDF belum termuat, muat ulang halaman.");
  const rupiah = (n) => rp(n).replace(/ /g, " ");
  const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const lebar = pdf.internal.pageSize.getWidth();
  const pendapatan = totalPendapatan();
  const keluar = totalKeluar();
  const biru = [34, 66, 107];

  pdf.setTextColor(...biru).setFont("helvetica", "bold").setFontSize(11).text(db.toko.nama || "SORTIK", 14, 16);
  pdf.setTextColor(23, 32, 44).setFontSize(20).text("Laporan Keuangan", 14, 25);
  pdf.setTextColor(68, 76, 88).setFont("helvetica", "normal").setFontSize(9).text(`Seluruh periode · Dibuat ${tglID(hariIni())}`, 14, 31);
  pdf.setDrawColor(...biru).setLineWidth(0.6).line(14, 34, lebar - 14, 34);

  const gaya = { theme: "grid", styles: { fontSize: 9, cellPadding: 2, lineColor: [212, 221, 232], textColor: [23, 32, 44] }, headStyles: { fillColor: biru, textColor: 255 }, margin: { left: 14, right: 14 } };
  const kanan = { halign: "right" };
  const bagian = (judul, y) => pdf.setTextColor(23, 32, 44).setFont("helvetica", "bold").setFontSize(12).text(judul, 14, y);

  bagian("Ringkasan", 42);
  pdf.autoTable({ ...gaya, startY: 45,
    head: [["Pendapatan", "Piutang", "Pengeluaran", "Laba bersih"]],
    body: [[rupiah(pendapatan), rupiah(totalPiutang()), rupiah(keluar), rupiah(pendapatan - keluar)]] });

  bagian("Arus Kas 6 Bulan Terakhir", pdf.lastAutoTable.finalY + 10);
  pdf.autoTable({ ...gaya, startY: pdf.lastAutoTable.finalY + 13,
    head: [["Bulan", "Pendapatan", "Pengeluaran", "Laba bersih"]],
    body: ringkasanBulanan().map((b) => [`${b.label} ${b.tahun}`, rupiah(b.p), rupiah(b.k), rupiah(b.p - b.k)]),
    columnStyles: { 1: kanan, 2: kanan, 3: kanan } });
  pdf.setTextColor(68, 76, 88).setFont("helvetica", "normal").setFontSize(8)
    .text("Tanggal pesanan digunakan jika tanggal pembayaran tidak tercatat.", 14, pdf.lastAutoTable.finalY + 5);

  bagian("Rincian Arus Kas", pdf.lastAutoTable.finalY + 14);
  const kas = arusKas();
  pdf.autoTable({ ...gaya, startY: pdf.lastAutoTable.finalY + 17,
    head: [["Tanggal", "Keterangan", "Kategori", "Jumlah"]],
    body: kas.length ? kas.map((a) => [tglID(a.tanggal), a.keterangan, a.kategori, `${a.masuk ? "+" : "-"} ${rupiah(a.jumlah)}`]) : [[{ content: "Belum ada transaksi arus kas.", colSpan: 4 }]],
    columnStyles: { 0: { cellWidth: 30 }, 2: { cellWidth: 32 }, 3: { ...kanan, cellWidth: 36 } } });

  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i).setTextColor(68, 76, 88).setFont("helvetica", "normal").setFontSize(8)
      .text(`${i} / ${n}`, lebar - 14, 290, { align: "right" });
  }
  pdf.save(`laporan-keuangan-sortik-${hariIni()}.pdf`);
  notif("Laporan PDF diunduh.");
};

function segarkan() {
  gambarStats();
  gambarGrafik();
  gambarChips();
  gambarKas();
}

segarkan();
