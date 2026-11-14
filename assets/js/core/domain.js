/* SORTIK — logika data (domain): harga, transaksi, stok, status pesanan.
   Berkas ini tidak menyentuh DOM dan tidak memanggil notif/simpan; ia hanya
   membaca dan mengubah objek `db` di memori. Halaman yang memanggilnya
   bertugas menyimpan (`simpan`) dan menampilkan hasilnya.
   Fungsi yang mengubah data mengembalikan `urungkan()` supaya perubahan bisa
   dibatalkan bila penyimpanan gagal. */

const produkById = (id) => db.produk.find((p) => p.id === id) || {};

/* ---------- harga ---------- */
/* harga jual = harga − diskon% (0–100, dibulatkan ke ratusan agar rapi) */
const hargaJual = (p) => {
  const diskon = Math.max(0, Math.min(100, (p && p.diskon) || 0));
  return Math.round(((p && p.harga) || 0) * (1 - diskon / 100) / 100) * 100;
};
/* pesanan baru menyimpan harga saat dibuat (o.harga) — ubah diskon/harga tidak
   mengubah riwayat; pesanan lama memakai harga kini */
const subtotalPesanan = (o) => (o.harga != null ? o.harga : hargaJual(produkById(o.produk))) * o.jumlah;
const nilaiPesanan = (o) => subtotalPesanan(o) + (+o.ongkir || 0);

/* ---------- status ---------- */
/* urutan status pesanan */
const ALUR = ["Menunggu", "Diproses", "Siap", "Selesai"];
/* Pesanan yang dibatalkan tidak dihapus: statusnya "Dibatalkan" (di luar ALUR)
   agar riwayat dan laporan tetap utuh. */
const batal = (o) => o.status === "Dibatalkan";
const aktif = (o) => o.status !== "Selesai" && o.status !== "Dibatalkan";
/* Pesanan "Menunggu" yang belum dibayar dibatalkan otomatis setelah sekian hari. */
const HARI_TAHAN = 2;
const kedaluwarsa = (o) => o.status === "Menunggu" && !o.lunas && o.tanggal
  && Date.now() - new Date(o.tanggal + "T00:00:00").getTime() > HARI_TAHAN * 86400000;

/* ---------- tanggal ---------- */
const tanggalLokal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/* Pesanan lama tidak menyimpan tanggal pembayaran; tanggal pesanan jadi perkiraan. */
const tanggalBayar = (o) => o.tanggalDibayar || (o.dibayarPada ? tanggalLokal(new Date(o.dibayarPada)) : o.tanggal);

/* ---------- transaksi (kelompok baris pesanan) ---------- */
const kodePesanan = (o) => `BK-${o.tanggal.slice(0, 4)}-${String(o.pesananId || o.id).padStart(3, "0")}`;
/* Baris lama tetap berdiri sendiri. Pesanan baru memakai pesananId bersama. */
const itemPesanan = (o) => o.pesananId
  ? db.pesanan.filter((x) => x.pesananId === o.pesananId && x.pembeli_id === o.pembeli_id)
  : [o];
const transaksi = (daftar) => {
  const seen = new Set();
  return daftar.filter((o) => {
    const kunci = o.pesananId ? `baru:${o.pembeli_id}:${o.pesananId}` : `lama:${o.id}`;
    if (seen.has(kunci)) return false;
    seen.add(kunci); return true;
  });
};
const totalTransaksi = (o) => itemPesanan(o).reduce((n, x) => n + nilaiPesanan(x), 0);
/* total unit terjual satu produk (dari seluruh pesanan) — untuk badge/urutan Terlaris */
const jmlTerjual = (id) => db.pesanan.reduce((n, o) => n + (o.produk === id && !batal(o) ? o.jumlah : 0), 0);

/* ---------- keuangan ---------- */
const totalPendapatan = () => db.pesanan.filter((o) => o.lunas).reduce((n, o) => n + nilaiPesanan(o), 0);
const totalPiutang = () => db.pesanan.filter((o) => !o.lunas && !batal(o)).reduce((n, o) => n + nilaiPesanan(o), 0);

/* ---------- stok ---------- */
/* jumlah per produk dari sekumpulan baris (satu produk bisa muncul dua kali) */
const kebutuhanStok = (baris) => {
  const m = new Map();
  for (const x of baris) m.set(x.produk, (m.get(x.produk) || 0) + x.jumlah);
  return m;
};
/* baris pesanan yang stoknya belum dipotong (pesanan lama sebelum stok dicadangkan) */
const butuhStok = (items) => items.filter((x) => !x.stokDipesan);
/* stok cukup untuk semua produk? */
const stokCukup = (kebutuhan) => [...kebutuhan].every(([id, n]) => {
  const p = produkById(id);
  return p.id && Number.isInteger(n) && n >= 1 && Number.isInteger(p.stok) && p.stok >= n;
});

/* ---------- membuat pesanan ---------- */
/* Buat baris pesanan dari keranjang: kunci harga, cadangkan stok, tambahkan ke
   db.pesanan. Mengembalikan { baris, urungkan } atau { error }. */
function buatPesanan({ keranjang, akun, cara, bayar, alamat = "", ongkir = 0, sekarang = new Date() }) {
  if (!keranjang.length) return { error: "Keranjang masih kosong." };
  if (keranjang.some((i) => !Number.isInteger(i.jumlah) || i.jumlah < 1) || !stokCukup(kebutuhanStok(keranjang.map((i) => ({ produk: i.produk, jumlah: i.jumlah })))))
    return { error: "Stok tidak mencukupi. Periksa kembali keranjang Anda." };
  const mulai = Math.max(0, ...db.pesanan.map((o) => o.id)) + 1;
  const checkoutId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  const baris = keranjang.map((i, n) => ({
    id: mulai + n,
    checkoutId,
    pesananId: mulai,
    ongkir: n === 0 && cara === "antar" ? ongkir : 0,
    produk: i.produk,
    pembeli_id: akun.id,
    pembeli: akun.nama,
    jumlah: i.jumlah,
    /* harga jual dikunci saat pesanan dibuat — diskon belakangan tidak mengubah riwayat */
    harga: hargaJual(produkById(i.produk)),
    status: "Menunggu",
    tanggal: tanggalLokal(sekarang),
    cara,
    bayar,
    alamat: cara === "antar" ? alamat : "",
    lunas: false,
    staff: "",
    /* stok dicadangkan saat pesanan dibuat; dikembalikan bila dibatalkan */
    stokDipesan: true
  }));
  const dipesan = baris.map((x) => [produkById(x.produk), x.jumlah]);
  dipesan.forEach(([p, n]) => { p.stok -= n; });
  db.pesanan.push(...baris);
  return {
    baris,
    urungkan: () => {
      db.pesanan = db.pesanan.filter((o) => !baris.includes(o));
      dipesan.forEach(([p, n]) => { p.stok += n; });
    }
  };
}

/* ---------- membayar & membatalkan ---------- */
/* Tandai satu transaksi lunas. Stok hanya dipotong untuk baris yang belum
   mencadangkannya. Mengembalikan { urungkan } atau { error }. */
function bayarPesanan(items, staff, sekarang = new Date()) {
  if (items.some(batal)) return { error: "Pesanan ini sudah dibatalkan." };
  if (items.some((x) => x.lunas)) return { error: "Pesanan sudah dibayar atau memiliki status pembayaran tidak konsisten." };
  const kebutuhan = kebutuhanStok(butuhStok(items));
  if (!stokCukup(kebutuhan)) return { error: "Stok tidak cukup. Pembayaran belum dikonfirmasi." };
  const sebelum = items.map((x) => ({ ...x }));
  const stokLama = [...kebutuhan.keys()].map((id) => [produkById(id), produkById(id).stok]);
  items.forEach((x) => {
    x.stokDipesan = false;
    x.lunas = true;
    x.staff = staff;
    x.dibayarPada = sekarang.toISOString();
    x.tanggalDibayar = tanggalLokal(sekarang);
    if (x.status === "Menunggu") x.status = "Diproses";
  });
  kebutuhan.forEach((n, id) => { produkById(id).stok -= n; });
  return {
    urungkan: () => {
      items.forEach((x, i) => { Object.keys(x).forEach((k) => delete x[k]); Object.assign(x, sebelum[i]); });
      stokLama.forEach(([p, stok]) => { p.stok = stok; });
    }
  };
}

/* Batalkan semua baris satu transaksi: status jadi Dibatalkan dan stok yang
   dipesan dikembalikan. Mengembalikan fungsi pembatal untuk rollback bila simpan gagal. */
const batalkanItem = (items, alasan) => {
  const sebelum = items.map((x) => ({ ...x }));
  const stok = [];
  const waktu = new Date().toISOString();
  items.forEach((x) => {
    const p = produkById(x.produk);
    if (x.stokDipesan && p.id) { p.stok = (p.stok || 0) + x.jumlah; stok.push([p, x.jumlah]); }
    x.status = "Dibatalkan";
    x.alasanBatal = alasan;
    x.dibatalkanPada = waktu;
    x.stokDipesan = false;
  });
  return () => {
    stok.forEach(([p, n]) => { p.stok -= n; });
    items.forEach((x, i) => { Object.keys(x).forEach((k) => delete x[k]); Object.assign(x, sebelum[i]); });
  };
};
