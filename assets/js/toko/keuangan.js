/* Keuangan — ringkasan uang toko:
   pendapatan dihitung dari pesanan yang sudah lunas, piutang dari yang belum,
   dan pengeluaran dicatat manual oleh admin. Dipakai bersama
   staff/keuangan.html (hanya lihat) dan admin/keuangan.html (bisa mencatat). */

const pengeluaran = () => db.keuangan.pengeluaran || [];
const totalPendapatan = () => db.pesanan.filter((o) => o.lunas).reduce((n, o) => n + nilaiPesanan(o), 0);
const totalPiutang = () => db.pesanan.filter((o) => !o.lunas).reduce((n, o) => n + nilaiPesanan(o), 0);
const totalKeluar = () => pengeluaran().reduce((n, x) => n + (+x.jumlah || 0), 0);
const kategoriKeluar = () => [...new Set(pengeluaran().map((x) => x.kategori).filter(Boolean))];

/* tanggal hari ini lokal (toISOString memakai UTC — beda zona bisa meleset) */
const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
function gambarGrafik() {
  const kini = new Date();
  const dataBulan = [...Array(6)].map((_, i) => {
    const d = new Date(kini.getFullYear(), kini.getMonth() - 5 + i, 1);
    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: bln[d.getMonth()],
      p: db.pesanan.filter((o) => o.lunas && o.tanggal.startsWith(kunci)).reduce((n, o) => n + nilaiPesanan(o), 0),
      k: pengeluaran().filter((x) => String(x.tanggal).startsWith(kunci)).reduce((n, x) => n + (+x.jumlah || 0), 0)
    };
  });
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
  chipSaring("chips", [["", "Semua"], ...kategoriKeluar().map((k) => [k, k])], (nilai) => {
    saringKat = nilai;
    gambarKas();
  }, saringKat);
}

function gambarKas() {
  /* gabungkan uang masuk (pesanan lunas) & keluar (pengeluaran), urut dari terbaru */
  const acara = [
    ...db.pesanan.filter((o) => o.lunas).map((o) => ({
      tanggal: o.tanggal, masuk: true, kategori: "Pendapatan",
      keterangan: `Pesanan ${kodePesanan(o)} — ${produkById(o.produk).nama || "barang"}`,
      jumlah: nilaiPesanan(o)
    })),
    ...pengeluaran().map((x) => ({
      tanggal: x.tanggal, masuk: false, id: x.id,
      kategori: x.kategori || "Lain-lain", keterangan: x.keterangan, jumlah: +x.jumlah || 0
    }))
  ].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

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

  el("k-simpan").onclick = () => {
    const tanggal = el("k-tanggal").value;
    const keterangan = el("k-ket").value.trim();
    const jumlah = +el("k-jumlah").value || 0;
    if (!tanggal) return isi("k-info", "⚠ Isi tanggalnya dulu.");
    if (!keterangan) return isi("k-info", "⚠ Isi keterangan pengeluarannya.");
    if (jumlah <= 0) return isi("k-info", "⚠ Jumlah harus lebih dari 0.");
    const id = pengeluaran().reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    db.keuangan.pengeluaran = pengeluaran();
    db.keuangan.pengeluaran.push({ id, tanggal, kategori: el("k-kategori").value.trim() || "Lain-lain", keterangan, jumlah });
    simpan("keuangan");
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
    db.keuangan.pengeluaran = pengeluaran().filter((p) => p.id !== id);
    simpan("keuangan");
    segarkan();
    notif("Catatan pengeluaran dihapus.");
  });
}

/* pesanan lunas / pengeluaran berubah di tab lain → ikut segarkan */
window.addEventListener("storage", (e) => {
  if ([VERSI + "keuangan", VERSI + "pesanan"].includes(e.key)) segarkan();
});

function segarkan() {
  gambarStats();
  gambarGrafik();
  gambarChips();
  gambarKas();
}

segarkan();
