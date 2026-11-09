/* Database lokal di localStorage; reset dan akun contoh ada di CATATAN-DEV.md. */

const KUNCI_DB = "sortik-db";
const KUNCI_SESI = "sortik-sesi";
/* Toko aktif: pembeli pilih sendiri, admin pilih miliknya, staff terkunci. */
const KUNCI_TOKO = "sortik2:toko";

/* foto contoh: tautan Unsplash, stabil, https, bebas hotlink */
const fotoUnsplash = (id) => `https://images.unsplash.com/${id}?fm=jpg&q=70&w=1200&auto=format&fit=crop`;

/* kategori & denah bawaan toko baru, juga dipakai data awal */
const KATEGORI_AWAL = () => [
  { id: "smartphone", nama: "Smartphone", lucide: "smartphone", ikon: "", urutan: 0 },
  { id: "laptop", nama: "Laptop", lucide: "laptop", ikon: "", urutan: 1 },
  { id: "audio", nama: "Audio / Headphone", lucide: "headphones", ikon: "", urutan: 2 },
  { id: "tv", nama: "Televisi", lucide: "tv", ikon: "", urutan: 3 },
  { id: "game", nama: "Game", lucide: "gamepad-2", ikon: "", urutan: 4 },
  { id: "kamera", nama: "Kamera", lucide: "camera", ikon: "", urutan: 5 }
];
const RAK_AWAL = () => ({
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
});

/* data awal (dipakai saat pertama kali / setelah reset) */
/* Setiap toko punya koleksi sendiri; admin/staff terikat lewat u.toko. */
const DATA_AWAL = () => ({
  toko: [
    {
      id: "sortik",
      nama: "Toko Elektronik Sortik", alamat: "Jl. Merdeka No. 12, Malang",
      jam: "08.00–21.00", wa: "6281234567890", ongkir: 10000,
      rekening: [
        { bank: "BCA", nomor: "1234567890", atasNama: "Sortik Store" },
        { bank: "Mandiri", nomor: "9876543210", atasNama: "Sortik Store" }
      ], logo: "",
      foto: fotoUnsplash("photo-1516035069371-29a1b244cc32"), pemilik: "u-admin",
      kategori: KATEGORI_AWAL(),
      rak: RAK_AWAL(),
      produk: [
        { id: 1, nama: "Samsung Galaxy A55", kategori: "smartphone", harga: 4999000, diskon: 5, stok: 12, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1581410307517-1d1aac3dfdcb"), deskripsi: "Layar AMOLED 120Hz, kamera 50MP, baterai 5000mAh.", galeri: [fotoUnsplash("photo-1756098520280-7c10327d4858")] },
        { id: 2, nama: "iPhone 13 128GB", kategori: "smartphone", harga: 9999000, diskon: 0, stok: 4, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1650488619534-a733eacb15c1"), deskripsi: "Chip A15 Bionic, kamera ganda, iOS 18.", galeri: [fotoUnsplash("photo-1591337676887-a217a6970a8a")] },
        { id: 3, nama: "Lenovo ThinkPad E14", kategori: "laptop", harga: 12500000, diskon: 10, stok: 3, rak: "B1", ikon: "", foto: fotoUnsplash("photo-1517336714731-489689fd1ca8"), deskripsi: "Ryzen 5, RAM 16GB, SSD 512GB, layar 14 inci.", galeri: [fotoUnsplash("photo-1680479611243-a072462e4d6b")] },
        { id: 4, nama: "ASUS Vivobook 15", kategori: "laptop", harga: 8500000, diskon: 0, stok: 7, rak: "B1", ikon: "", foto: fotoUnsplash("photo-1680479611243-a072462e4d6b"), deskripsi: "Core i5 Gen 12, RAM 8GB, SSD 512GB.", galeri: [] },
        { id: 5, nama: "Sony WH-1000XM5", kategori: "audio", harga: 5499000, diskon: 0, stok: 6, rak: "A2", ikon: "", foto: fotoUnsplash("photo-1711397996073-c9a629ebc05b"), deskripsi: "Peredam bising terbaik di kelasnya, baterai 30 jam.", galeri: [] },
        { id: 6, nama: "TWS Earbuds Pro", kategori: "audio", harga: 299000, diskon: 20, stok: 25, rak: "A2", ikon: "", foto: fotoUnsplash("photo-1600294037681-c80b4cb5b434"), deskripsi: "Bluetooth 5.3, tahan air IPX4, baterai 24 jam.", galeri: [] },
        { id: 7, nama: 'Smart TV 43" 4K', kategori: "tv", harga: 4500000, diskon: 0, stok: 5, rak: "B2", ikon: "", foto: fotoUnsplash("photo-1593359677879-a4bb92f829d1"), deskripsi: "Resolusi 4K UHD, Android TV, HDR10.", galeri: [fotoUnsplash("photo-1461151304267-38535e780c79")] },
        { id: 8, nama: "Konsol Game Xbox Series X", kategori: "game", harga: 6200000, diskon: 0, stok: 0, rak: "C1", ikon: "", foto: fotoUnsplash("photo-1606144042614-b2417e99c4e3"), deskripsi: "SSD super cepat, ray tracing, dukungan 4K 120fps.", galeri: [fotoUnsplash("photo-1600080972464-8e5f35f63d08"), fotoUnsplash("photo-1592840496694-26d035b52b48")] },
        { id: 9, nama: "Kamera Mirrorless M50", kategori: "kamera", harga: 9750000, diskon: 0, stok: 2, rak: "C2", ikon: "", foto: fotoUnsplash("photo-1516035069371-29a1b244cc32"), deskripsi: "Sensor APS-C 24MP, video 4K, layar sentuh putar.", galeri: [fotoUnsplash("photo-1597511858759-8ee3767d9ad4")] },
        { id: 10, nama: "Powerbank 20000mAh", kategori: "smartphone", harga: 349000, diskon: 0, stok: 30, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1609091839311-d5365f9ff1c5"), deskripsi: "Output 22.5W, isi ulang 3 perangkat sekaligus.", galeri: [fotoUnsplash("photo-1583863788434-e58a36330cf0")] }
      ],
      pesanan: [
        { id: 1, produk: 6, pembeli_id: "u-budi", pembeli: "Budi Pembeli", jumlah: 2, status: "Selesai", tanggal: "2026-10-30", cara: "ambil", bayar: "Bayar di kasir", alamat: "", lunas: true, staff: "Staff Toko", harga: 239200, bukti: "", buktiPada: null },
        { id: 2, produk: 5, pembeli_id: "u-budi", pembeli: "Budi Pembeli", jumlah: 1, status: "Diproses", tanggal: "2026-11-01", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Kenanga No. 5, Malang", lunas: true, staff: "Staff Toko", harga: 5499000, bukti: "", buktiPada: "2026-11-01T14:10:00.000Z" },
        { id: 3, produk: 10, pembeli_id: "u-sari", pembeli: "Sari Pembeli", jumlah: 3, status: "Siap", tanggal: "2026-11-02", cara: "ambil", bayar: "Bayar di kasir", alamat: "", lunas: false, staff: "", harga: 349000, bukti: "", buktiPada: null },
        { id: 4, produk: 7, pembeli_id: "u-sari", pembeli: "Sari Pembeli", jumlah: 1, status: "Menunggu", tanggal: "2026-11-02", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Melati No. 9, Malang", lunas: false, staff: "", harga: 4500000, bukti: "", buktiPada: null }
      ],
      pesan: [
        { id: 1, dari: "Admin Toko", peran: "admin", teks: "Stok TWS di rak A2 tinggal 25, tolong dicek fisiknya sore ini.", waktu: "2026-11-02T08:30:00.000Z" },
        { id: 2, dari: "Staff Toko", peran: "staff", teks: "Siap, sudah saya hitung ulang. Rak C2 juga sudah dirapikan.", waktu: "2026-11-02T08:45:00.000Z" }
      ],
      keuangan: { pengeluaran: [
        { id: 1, tanggal: "2026-10-28", keterangan: "Listrik & internet toko", kategori: "Operasional", jumlah: 750000 },
        { id: 2, tanggal: "2026-10-30", keterangan: "Karung & bubble wrap", kategori: "Pengemasan", jumlah: 120000 },
        { id: 3, tanggal: "2026-11-01", keterangan: "Konsumsi rapat bulanan", kategori: "Operasional", jumlah: 200000 }
      ] }
    },
    {
      id: "gadget",
      nama: "GadgetHub Jakarta", alamat: "Mall Kelapa Gading Lt. 2, Jakarta Utara",
      jam: "10.00–22.00", wa: "6282100003344", ongkir: 20000,
      rekening: [{ bank: "BCA", nomor: "7788990011", atasNama: "GadgetHub Jakarta" }],
      logo: "",
      foto: fotoUnsplash("photo-1592750475338-74b7b21085ab"), pemilik: "u-gadget-admin",
      kategori: [
        { id: "smartphone", nama: "Smartphone", lucide: "smartphone", ikon: "", urutan: 0 },
        { id: "laptop", nama: "Laptop", lucide: "laptop", ikon: "", urutan: 1 },
        { id: "audio", nama: "Audio / Headphone", lucide: "headphones", ikon: "", urutan: 2 }
      ],
      rak: {
        grid: 28, aktif: 0,
        lantai: [{
          id: 1, nama: "Lantai 1", lebar: 18, tinggi: 14,
          pintu: { sisi: "bawah", pos: 7 },
          daftar: [
            { id: 1, kode: "A1", x: 1, y: 1, w: 5, h: 2 },
            { id: 2, kode: "A2", x: 7, y: 1, w: 5, h: 2 },
            { id: 3, kode: "B1", x: 1, y: 5, w: 5, h: 2 },
            { id: 4, kode: "B2", x: 7, y: 5, w: 5, h: 2 }
          ],
          area: [{ id: "1", nama: "Kasir", x: 1, y: 11, w: 5, h: 2 }]
        }]
      },
      produk: [
        { id: 1, nama: "Apple iPhone 17 Pro 256GB", kategori: "smartphone", harga: 21999000, diskon: 0, stok: 6, rak: "A1", ikon: "", foto: fotoUnsplash("photo-1592750475338-74b7b21085ab"), deskripsi: "Chip A19 Pro, kamera 48 MP, layar ProMotion 120 Hz.", galeri: [] },
        { id: 2, nama: "MacBook Air 13 M5", kategori: "laptop", harga: 17499000, diskon: 5, stok: 4, rak: "B1", ikon: "", foto: fotoUnsplash("photo-1517336714731-489689fd1ca8"), deskripsi: "Chip Apple M5, layar Liquid Retina, baterai 18 jam.", galeri: [] },
        { id: 3, nama: "Sony WH-1000XM6", kategori: "audio", harga: 4999000, diskon: 10, stok: 8, rak: "A2", ikon: "", foto: fotoUnsplash("photo-1505740420928-5e560c06d30e"), deskripsi: "Headphone noise cancelling, baterai 40 jam, audio hi-res.", galeri: [] },
        { id: 4, nama: "Samsung Galaxy S26 Ultra", kategori: "smartphone", harga: 19999000, diskon: 0, stok: 5, rak: "B2", ikon: "", foto: fotoUnsplash("photo-1610945265064-0e34e5519bbf"), deskripsi: "S Pen, kamera 200 MP, layar Dynamic AMOLED 2X.", galeri: [] }
      ],
      pesanan: [
        { id: 1, produk: 3, pembeli_id: "u-sari", pembeli: "Sari Pembeli", jumlah: 1, status: "Menunggu", tanggal: "2026-11-02", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: false, staff: "", harga: 4499100, bukti: "", buktiPada: null }
      ],
      pesan: [],
      keuangan: { pengeluaran: [
        { id: 1, tanggal: "2026-11-01", keterangan: "Sewa booth bulan November", kategori: "Operasional", jumlah: 2500000 }
      ] }
    }
  ],
  pengguna: [
    { id: "u-admin", nama: "Admin Toko", role: "admin", status: "aktif", email: "admin@sortik.id", telepon: "6281234567891", alamat: "", avatar: "", toko: "sortik" },
    { id: "u-staff", nama: "Staff Toko", role: "staff", status: "aktif", email: "staff@sortik.id", telepon: "6281234567892", alamat: "", avatar: "", toko: "sortik" },
    { id: "u-budi", nama: "Budi Pembeli", role: "pembeli", status: "aktif", email: "budi@sortik.id", telepon: "6281234567893", alamat: "Jl. Kenanga No. 5, Malang", avatar: "", toko: "" },
    { id: "u-sari", nama: "Sari Pembeli", role: "pembeli", status: "aktif", email: "sari@sortik.id", telepon: "6281234567894", alamat: "Jl. Melati No. 9, Malang", avatar: "", toko: "" },
    { id: "u-lama", nama: "Akun Lama", role: "pembeli", status: "nonaktif", email: "lama@sortik.id", telepon: "", alamat: "", avatar: "", toko: "" },
    { id: "u-gadget-admin", nama: "Fajar Nugroho", role: "admin", status: "aktif", email: "admin@gadget.id", telepon: "6282100003345", alamat: "", avatar: "", toko: "gadget" },
    { id: "u-gadget-staff", nama: "Putri Maharani", role: "staff", status: "aktif", email: "staff@gadget.id", telepon: "6282100003346", alamat: "", avatar: "", toko: "gadget" }
  ]
});

/* muat & tulis */
const simpanDB = (d) => {
  try { localStorage.setItem(KUNCI_DB, JSON.stringify(d)); return null; }
  catch { return { message: "Penyimpanan browser penuh, hapus beberapa foto." }; }
};
/* data satu toko versi lama (produk/pesanan di akar objek) dilipat jadi toko[0] */
const rapikanDB = (d) => {
  const legacy = !Array.isArray(d.toko);
  if (legacy) {
    const t = d.toko || {};
    d.toko = [{
      ...t, id: "sortik", logo: t.logo || "",
      kategori: d.kategori || [], rak: d.rak || RAK_AWAL(),
      produk: d.produk || [], pesanan: d.pesanan || [],
      pesan: d.pesan || [], keuangan: d.keuangan || { pengeluaran: [] }
    }];
  }
  d.toko.forEach((t) => {
    t.kategori = t.kategori || KATEGORI_AWAL();
    t.rak = t.rak || RAK_AWAL();
    t.produk = (t.produk || []).map((p) => ({ ...p, galeri: Array.isArray(p.galeri) ? p.galeri : [] }));
    /* Simpan asal toko dan ongkir untuk pesanan lama. */
    t.pesanan = (t.pesanan || []).map((o) => ({
      ...o, toko: t.id,
      ongkir: o.ongkir != null ? o.ongkir : (o.cara === "antar" ? +t.ongkir || 0 : 0)
    }));
    /* grup hanya untuk percakapan admin dan staff */
    t.pesan = (t.pesan || []).filter((m) => ["staff", "admin"].includes(m.peran));
    t.keuangan = t.keuangan || { pengeluaran: [] };
    /* field multi-toko: foto toko dan pemilik (admin pemilik) */
    t.foto = t.foto || "";
    t.pemilik = t.pemilik || "";
    delete t.kode; /* kode referral sudah dihapus dari sistem */
  });
  d.pengguna = (d.pengguna || []).map((u) => {
    delete u.minta; /* permintaan gabung staff sudah dihapus */
    /* data lama terikat ke toko[0]; data baru boleh staff/admin tanpa toko */
    return { ...u, toko: u.role === "pembeli" ? "" : (legacy ? (u.toko || d.toko[0].id) : (u.toko || "")) };
  });
  /* toko lama yang belum punya pemilik diikat ke admin yang menaunginya */
  d.toko.forEach((t) => {
    if (t.pemilik) return;
    const a = d.pengguna.find((u) => u.role === "admin" && u.toko === t.id);
    t.pemilik = a ? a.id : "";
  });
  return d;
};
const muatDB = () => {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KUNCI_DB)); } catch {}
  if (!d) { d = rapikanDB(DATA_AWAL()); simpanDB(d); return d; }
  const perlu = !Array.isArray(d.toko) || (d.pesan || []).some((m) => !["staff", "admin"].includes(m.peran))
    || (d.toko || []).some((t) => !("foto" in t) || !("pemilik" in t) || "kode" in t)
    || (d.toko || []).some((t) => (t.pesanan || []).some((o) => !o.toko || o.ongkir == null))
    || (d.pengguna || []).some((u) => "minta" in u);
  if (perlu) { rapikanDB(d); simpanDB(d); }
  return d;
};

/* sesi & akun */
const bacaSesi = () => localStorage.getItem(KUNCI_SESI);
const simpanSesi = (id) => id ? localStorage.setItem(KUNCI_SESI, id) : localStorage.removeItem(KUNCI_SESI);
const bacaToko = () => localStorage.getItem(KUNCI_TOKO);
const simpanToko = (id) => id ? localStorage.setItem(KUNCI_TOKO, id) : localStorage.removeItem(KUNCI_TOKO);
const tokoDari = (d, id) => (d.toko || []).find((t) => t.id === id) || null;

/* shortcut: hash browser bukan pengaman server; ganti saat ada backend. */
async function hashSandi(sandi) {
  const t = new TextEncoder().encode("sortik:" + sandi);
  if (crypto.subtle) {
    const b = await crypto.subtle.digest("SHA-256", t);
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  let h = 2166136261;
  for (const b of t) h = Math.imul(h ^ b, 16777619) >>> 0;
  return "fnv" + h.toString(16);
}

/* Akun lama tanpa sandi menerima sandi apa pun. */
const masukLokal = async (email, sandi = "") => {
  const d = muatDB();
  const u = (d.pengguna || []).find((r) => String(r.email || "").toLowerCase() === String(email).toLowerCase());
  if (!u) return { data: null, error: "Email tidak terdaftar, daftar dulu atau pakai akun contoh." };
  if (u.status !== "aktif") return { data: u, error: "Akun ini nonaktif, hubungi admin toko." };
  if (u.sandi && u.sandi !== await hashSandi(sandi)) return { data: null, error: "Kata sandi salah, coba lagi." };
  simpanSesi(u.id);
  /* staff dikunci ke tokonya; admin memakai toko terakhir yang dipilih (divalidasi saat muat) */
  if (u.role === "staff") simpanToko(u.toko || null);
  return { data: u, error: null };
};

/* Daftar hanya untuk pembeli/admin; akun staff dibuat admin. */
const daftarLokal = async (email, nama, sandi, peran = "pembeli") => {
  const d = muatDB();
  email = String(email || "").toLowerCase();
  /* staff tidak mendaftar sendiri; akun staff dibuat admin toko */
  if (!["pembeli", "admin"].includes(peran)) peran = "pembeli";
  if ((d.pengguna || []).some((r) => String(r.email || "").toLowerCase() === email))
    return { data: null, error: "Email sudah terdaftar, silakan masuk di halaman Masuk." };
  const u = {
    id: "u" + Date.now().toString(36), nama: nama || email.split("@")[0],
    role: peran, status: "aktif", email, toko: "",
    sandi: await hashSandi(sandi), telepon: "", alamat: "", avatar: ""
  };
  d.pengguna.push(u);
  const g = simpanDB(d);
  if (g) return { data: null, error: g.message };
  simpanSesi(u.id);
  simpanToko(null);
  return { data: u, error: null };
};

/* Tambah toko oleh admin, langsung jadi toko aktif. */
const tambahToko = async ({ nama, alamat, jam, wa, ongkir, logo = "", foto = "", rekening = [] }) => {
  const d = muatDB();
  if (!String(nama || "").trim()) return { data: null, error: "Nama toko wajib diisi." };
  const pemilik = (d.pengguna || []).find((u) => u.id === bacaSesi() && u.role === "admin");
  if (!pemilik) return { data: null, error: "Masuk sebagai admin dulu untuk menambah toko." };
  /* satu akun admin hanya mengelola satu toko */
  if (d.toko.some((t) => t.pemilik === pemilik.id))
    return { data: null, error: "Akun ini sudah punya toko. Satu akun admin hanya mengelola satu toko." };

  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "toko";
  let id = slug(nama), n = 2;
  while (d.toko.some((t) => t.id === id)) id = `${slug(nama)}-${n++}`;

  const toko = {
    id, nama: String(nama).trim(), alamat: String(alamat || "").trim(),
    jam: String(jam || "").trim(), wa: String(wa || "").replace(/\D/g, ""),
    ongkir: +ongkir || 0, rekening, logo, foto,
    pemilik: pemilik.id,
    kategori: KATEGORI_AWAL(), rak: RAK_AWAL(), produk: [], pesanan: [], pesan: [], keuangan: { pengeluaran: [] }
  };
  d.toko.push(toko);
  const g = simpanDB(d);
  if (g) return { data: null, error: g.message };
  simpanToko(id);
  return { data: toko, error: null };
};

const pilihToko = (id) => { if (id) simpanToko(id); };
const keluarLokal = () => simpanSesi(null);
