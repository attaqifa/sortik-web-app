/* SORTIK — logika tampilan (domain): harga, status pesanan, ringkasan.
   Berkas ini tidak menyentuh DOM. Membuat pesanan, membayar, membatalkan, dan
   mengubah stok dikerjakan server (/api/pesanan); di sini hanya hitungan
   untuk ditampilkan dari data yang sudah dimuat ke `db`. */

const produkById = (id) => db.produk.find((p) => p.id === id) || {};

/* ---------- harga ---------- */
/* harga jual = harga − diskon% (0–100, dibulatkan ke ratusan); sama dengan harga_jual() di server */
const hargaJual = (p) => {
  const diskon = Math.max(0, Math.min(100, (p && p.diskon) || 0));
  return Math.round(((p && p.harga) || 0) * (1 - diskon / 100) / 100) * 100;
};
/* pesanan dari server membawa items[{produk,jumlah,harga}], subtotal, total, dan kode */
const nilaiPesanan = (o) => o.total;
const kodePesanan = (o) => o.kode;
const jumlahItem = (o) => o.items.reduce((n, i) => n + i.jumlah, 0);

/* ---------- status ---------- */
const ALUR = ["Menunggu", "Diproses", "Siap", "Selesai"];
/* Pesanan yang dibatalkan tidak dihapus: statusnya "Dibatalkan" (di luar ALUR). */
const batal = (o) => o.status === "Dibatalkan";
const aktif = (o) => o.status !== "Selesai" && o.status !== "Dibatalkan";
/* batas waktu bayar; pembatalan otomatisnya dikerjakan server (HARI_TAHAN di pesanan.php) */
const HARI_TAHAN = 2;
const batasBayar = (o) => new Date(new Date(o.dibuat).getTime() + HARI_TAHAN * 86400000);

/* ---------- tanggal ---------- */
const tanggalLokal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const tanggalBayar = (o) => (o.dibayarPada ? tanggalLokal(new Date(o.dibayarPada)) : o.tanggal);

/* total unit terjual satu produk (dihitung server) — untuk badge/urutan Terlaris */
const jmlTerjual = (id) => produkById(id).terjual || 0;

/* ---------- keuangan ---------- */
const totalPendapatan = () => db.pesanan.filter((o) => o.lunas).reduce((n, o) => n + o.total, 0);
const totalPiutang = () => db.pesanan.filter((o) => !o.lunas && !batal(o)).reduce((n, o) => n + o.total, 0);
