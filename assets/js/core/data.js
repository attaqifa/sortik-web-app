/* SORTIK — wadah data kosong; core/store.js mengisinya dari Supabase. */
const db = {
  kategori: [],
  toko: { id: 1, nama: "", alamat: "", jam: "", wa: "", ongkir: 0, rekening: [], logo: "" },
  rak: { grid: 28, aktif: 0, lantai: [] },
  produk: [],
  pesanan: [],
  pengguna: [],
  pesan: [],
  keuangan: { pengeluaran: [] },
  akun: null
};

/* Pilihan ikon form kategori; bukan data toko atau seed. */
const IKON_KATEGORI = [
  ["smartphone", "Smartphone"], ["laptop", "Laptop"], ["washing-machine", "Mesin cuci"],
  ["watch", "Jam / Wearable"], ["headphones", "Audio / Headphone"], ["speaker", "Speaker"],
  ["tv", "Televisi"], ["camera", "Kamera"], ["gamepad-2", "Game"], ["printer", "Printer"],
  ["refrigerator", "Kulkas"], ["fan", "Kipas"], ["tag", "Lainnya"]
];

/* Helper untuk denah kosong; hasilnya hanya struktur tampilan sementara. */
function susunAwal(baris = "", kolom = 0) {
  const daftar = [];
  [...baris].forEach((b, r) => {
    for (let i = 1; i <= kolom; i++) daftar.push({ kode: b + i, x: (i - 1) * 5, y: r * 3, w: 4, h: 2 });
  });
  return daftar;
}
function lantaiAwal(daftar = []) {
  const ujung = (f) => (daftar.length ? Math.max(...daftar.map(f)) : 0);
  const lebar = Math.max(8, ujung((r) => r.x + r.w));
  const tinggi = Math.max(6, ujung((r) => r.y + r.h));
  return { nama: "Lantai 1", lebar, tinggi, pintu: { sisi: "bawah", pos: Math.floor(Math.max(0, lebar - 2) / 2) }, daftar, area: [] };
}
