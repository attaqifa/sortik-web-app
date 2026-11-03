/* SORTIK — database lokal.
   Seluruh data (kategori, toko, rak, produk, pesanan, pengguna, pesan,
   keuangan) disimpan di localStorage browser — tidak ada server sama sekali.
   Perubahan bertahan antar muat halaman; data hanya ada di browser ini.

   Reset data awal: jalankan localStorage.removeItem("sortik-db") di Console,
   lalu muat ulang halaman.
   Masuk: email salah satu akun contoh di DATA_AWAL (kata sandi bebas,
   tidak dipakai di mode lokal). */

const KUNCI_DB = "sortik-db";
const KUNCI_SESI = "sortik-sesi";

/* foto contoh: tautan Unsplash — stabil, https, bebas hotlink */
const fotoUnsplash = (id) => `https://images.unsplash.com/${id}?fm=jpg&q=70&w=1200&auto=format&fit=crop`;

/* ---------- data awal (dipakai saat pertama kali / setelah reset) ---------- */
const DATA_AWAL = () => ({
  toko: {
    id: 1, nama: "Toko Elektronik Sortik", alamat: "Jl. Merdeka No. 12, Malang",
    jam: "08.00–21.00", wa: "6281234567890", ongkir: 10000,
    rekening: [
      { bank: "BCA", nomor: "1234567890", atasNama: "Sortik Store" },
      { bank: "Mandiri", nomor: "9876543210", atasNama: "Sortik Store" }
    ], logo: ""
  },
  kategori: [
    { id: "smartphone", nama: "Smartphone", lucide: "smartphone", ikon: "", urutan: 0 },
    { id: "laptop", nama: "Laptop", lucide: "laptop", ikon: "", urutan: 1 },
    { id: "audio", nama: "Audio / Headphone", lucide: "headphones", ikon: "", urutan: 2 },
    { id: "tv", nama: "Televisi", lucide: "tv", ikon: "", urutan: 3 },
    { id: "game", nama: "Game", lucide: "gamepad-2", ikon: "", urutan: 4 },
    { id: "kamera", nama: "Kamera", lucide: "camera", ikon: "", urutan: 5 }
  ],
  rak: {
    grid: 28, aktif: 0,
    lantai: [{
      id: 1, nama: "Lantai 1", lebar: 24, tinggi: 18,
      pintu: { sisi: "bawah", pos: 10 },
      daftar: [
        { id: 1, kode: "A1", x: 1, y: 1, w: 5, h: 2 },
        { id: 2, kode: "A2", x: 7, y: 1, w: 5, h: 2 },
        { id: 3, kode: "B1", x: 13, y: 1, w: 5, h: 2 },
        { id: 4, kode: "B2", x: 1, y: 5, w: 5, h: 2 },
        { id: 5, kode: "C1", x: 7, y: 5, w: 5, h: 2 },
        { id: 6, kode: "C2", x: 13, y: 5, w: 5, h: 2 }
      ],
      area: [{ id: "1", nama: "Kasir", x: 1, y: 14, w: 6, h: 2 }]
    }]
  },
  produk: [
    { id: 1, nama: "Samsung Galaxy A55", kategori: "smartphone", harga: 4999000, diskon: 5, stok: 12, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1581410307517-1d1aac3dfdcb"), deskripsi: "Layar AMOLED 120Hz, kamera 50MP, baterai 5000mAh.", galeri: [fotoUnsplash("photo-1756098520280-7c10327d4858")] },
    { id: 2, nama: "iPhone 13 128GB", kategori: "smartphone", harga: 9999000, diskon: 0, stok: 4, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1650488619534-a733eacb15c1"), deskripsi: "Chip A15 Bionic, kamera ganda, iOS 18.", galeri: [fotoUnsplash("photo-1591337676887-a217a6970a8a")] },
    { id: 3, nama: "Lenovo ThinkPad E14", kategori: "laptop", harga: 12500000, diskon: 10, stok: 3, rak: "B1", ikon: "", foto: fotoUnsplash("photo-1517336714731-489689fd1ca8"), deskripsi: "Ryzen 5, RAM 16GB, SSD 512GB, layar 14 inci.", galeri: [fotoUnsplash("photo-1680479611243-a072462e4d6b")] },
    { id: 4, nama: "ASUS Vivobook 15", kategori: "laptop", harga: 8500000, diskon: 0, stok: 7, rak: "B1", ikon: "", foto: fotoUnsplash("photo-1680479611243-a072462e4d6b"), deskripsi: "Core i5 Gen 12, RAM 8GB, SSD 512GB.", galeri: [] },
    { id: 5, nama: "Sony WH-1000XM5", kategori: "audio", harga: 5499000, diskon: 0, stok: 6, rak: "A2", ikon: "", foto: fotoUnsplash("photo-1711397996073-c9a629ebc05b"), deskripsi: "Peredam bising terbaik di kelasnya, baterai 30 jam.", galeri: [] },
    { id: 6, nama: "TWS Earbuds Pro", kategori: "audio", harga: 299000, diskon: 20, stok: 25, rak: "A2", ikon: "", foto: fotoUnsplash("photo-1600294037681-c80b4cb5b434"), deskripsi: "Bluetooth 5.3, tahan air IPX4, baterai 24 jam.", galeri: [] },
    { id: 7, nama: 'Smart TV 43" 4K', kategori: "tv", harga: 4500000, diskon: 0, stok: 5, rak: "B2", ikon: "", foto: fotoUnsplash("photo-1593359677879-a4bb92f829d1"), deskripsi: "Resolusi 4K UHD, Android TV, HDR10.", galeri: [fotoUnsplash("photo-1461151304267-38535e780c79")] },
    { id: 8, nama: "Konsol Game Next-gen", kategori: "game", harga: 6200000, diskon: 0, stok: 0, rak: "C1", ikon: "", foto: fotoUnsplash("photo-1606144042614-b2417e99c4e3"), deskripsi: "SSD super cepat, ray tracing, dukungan 4K 120fps.", galeri: [fotoUnsplash("photo-1600080972464-8e5f35f63d08"), fotoUnsplash("photo-1592840496694-26d035b52b48")] },
    { id: 9, nama: "Kamera Mirrorless M50", kategori: "kamera", harga: 9750000, diskon: 0, stok: 2, rak: "C2", ikon: "", foto: fotoUnsplash("photo-1516035069371-29a1b244cc32"), deskripsi: "Sensor APS-C 24MP, video 4K, layar sentuh putar.", galeri: [fotoUnsplash("photo-1597511858759-8ee3767d9ad4")] },
    { id: 10, nama: "Powerbank 20000mAh", kategori: "smartphone", harga: 349000, diskon: 0, stok: 30, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1609091839311-d5365f9ff1c5"), deskripsi: "Output 22.5W, isi ulang 3 perangkat sekaligus.", galeri: [fotoUnsplash("photo-1583863788434-e58a36330cf0")] }
  ],
  pengguna: [
    { id: "u-admin", nama: "Admin Toko", role: "admin", status: "aktif", email: "admin@sortik.id", telepon: "6281234567891", alamat: "", avatar: "", ikon: "🛡️" },
    { id: "u-staff", nama: "Staff Toko", role: "staff", status: "aktif", email: "staff@sortik.id", telepon: "6281234567892", alamat: "", avatar: "", ikon: "🧰" },
    { id: "u-budi", nama: "Budi Pembeli", role: "pembeli", status: "aktif", email: "budi@sortik.id", telepon: "6281234567893", alamat: "Jl. Kenanga No. 5, Malang", avatar: "", ikon: "🧑" },
    { id: "u-sari", nama: "Sari Pembeli", role: "pembeli", status: "aktif", email: "sari@sortik.id", telepon: "6281234567894", alamat: "Jl. Melati No. 9, Malang", avatar: "", ikon: "👩" },
    { id: "u-lama", nama: "Akun Lama", role: "pembeli", status: "nonaktif", email: "lama@sortik.id", telepon: "", alamat: "", avatar: "", ikon: "🧑" }
  ],
  pesanan: [
    { id: 1, produk: 6, pembeli_id: "u-budi", pembeli: "Budi Pembeli", jumlah: 2, status: "Selesai", tanggal: "2026-10-30", cara: "ambil", bayar: "Bayar di kasir", alamat: "", lunas: true, staff: "Staff Toko", harga: 239200, bukti: "", buktiPada: null },
    { id: 2, produk: 5, pembeli_id: "u-budi", pembeli: "Budi Pembeli", jumlah: 1, status: "Diproses", tanggal: "2026-11-01", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Kenanga No. 5, Malang", lunas: true, staff: "Staff Toko", harga: 5499000, bukti: "", buktiPada: "2026-11-01T14:10:00.000Z" },
    { id: 3, produk: 10, pembeli_id: "u-sari", pembeli: "Sari Pembeli", jumlah: 3, status: "Siap", tanggal: "2026-11-02", cara: "ambil", bayar: "Bayar di kasir", alamat: "", lunas: false, staff: "", harga: 349000, bukti: "", buktiPada: null },
    { id: 4, produk: 7, pembeli_id: "u-sari", pembeli: "Sari Pembeli", jumlah: 1, status: "Menunggu", tanggal: "2026-11-02", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Melati No. 9, Malang", lunas: false, staff: "", harga: 4500000, bukti: "", buktiPada: null }
  ],
  pesan: [
    { id: 1, user_id: "u-budi", dari: "SORTIK Bot", peran: "bot", teks: "Pesanan baru BK-2026-001 — Budi Pembeli, TWS Earbuds Pro ×2. Akan dibayar di kasir.", waktu: "2026-10-30T09:15:00.000Z" },
    { id: 2, user_id: "u-budi", dari: "SORTIK Bot", peran: "bot", teks: "Pesanan baru BK-2026-002 — Budi Pembeli, Sony WH-1000XM5 ×1. Tunggu konfirmasi transfer.", waktu: "2026-11-01T14:00:00.000Z" },
    { id: 3, user_id: "u-sari", dari: "Sari Pembeli", peran: "pembeli", teks: "Halo, pesanan BK-2026-003 sudah siap diambil kapan saja?", waktu: "2026-11-02T08:30:00.000Z" },
    { id: 4, user_id: "u-sari", dari: "Staff Toko", peran: "staff", teks: "Siap, sudah kami taruh di rak C2 — tunjukkan kode pesanan di kasir ya.", waktu: "2026-11-02T08:45:00.000Z" }
  ],
  keuangan: { pengeluaran: [
    { id: 1, tanggal: "2026-10-28", keterangan: "Listrik & internet toko", kategori: "Operasional", jumlah: 750000 },
    { id: 2, tanggal: "2026-10-30", keterangan: "Karung & bubble wrap", kategori: "Pengemasan", jumlah: 120000 },
    { id: 3, tanggal: "2026-11-01", keterangan: "Konsumsi rapat bulanan", kategori: "Operasional", jumlah: 200000 }
  ] }
});

/* ---------- muat & tulis ---------- */
const simpanDB = (d) => {
  try { localStorage.setItem(KUNCI_DB, JSON.stringify(d)); return null; }
  catch { return { message: "Penyimpanan browser penuh — hapus beberapa foto." }; }
};
const muatDB = () => {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KUNCI_DB)); } catch {}
  if (!d) { d = DATA_AWAL(); simpanDB(d); }
  return d;
};

/* ---------- sesi & akun ---------- */
const bacaSesi = () => localStorage.getItem(KUNCI_SESI);
const simpanSesi = (id) => id ? localStorage.setItem(KUNCI_SESI, id) : localStorage.removeItem(KUNCI_SESI);

/* masuk: email harus terdaftar di db.pengguna; kata sandi tidak diperiksa */
const masukLokal = (email) => {
  const d = muatDB();
  const u = (d.pengguna || []).find((r) => String(r.email || "").toLowerCase() === String(email).toLowerCase());
  if (!u) return { data: null, error: "Email tidak terdaftar — daftar dulu atau pakai akun contoh." };
  if (u.status !== "aktif") return { data: u, error: "Akun ini nonaktif — hubungi admin toko." };
  simpanSesi(u.id);
  return { data: u, error: null };
};

/* daftar: selalu peran pembeli; staff/admin dibuat lewat data awal */
const daftarLokal = (email, nama) => {
  const d = muatDB();
  if ((d.pengguna || []).some((r) => String(r.email || "").toLowerCase() === String(email).toLowerCase()))
    return { data: null, error: "Email sudah terdaftar — silakan masuk di halaman Masuk." };
  const u = {
    id: "u" + Date.now().toString(36), nama: nama || String(email).split("@")[0],
    role: "pembeli", status: "aktif", email,
    telepon: "", alamat: "", avatar: "", ikon: "🧑"
  };
  d.pengguna.push(u);
  const g = simpanDB(d);
  if (g) return { data: null, error: g.message };
  simpanSesi(u.id);
  return { data: u, error: null };
};

const keluarLokal = () => simpanSesi(null);
