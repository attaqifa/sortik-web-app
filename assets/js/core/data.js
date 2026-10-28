/* SORTIK — data contoh; backend siap = ganti dengan hasil GET /api/db. */

/* hash sandi demo — djb2 ringan (BUKAN kriptografi; backend nanti ganti bcrypt).
   Dipakai login/daftar & kelola pengguna; simpan hash, bukan teks sandinya. */
const sandiHash = (s) => {
  let h = 5381;
  for (const c of String(s)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return "h" + h.toString(36);
};

const db = {
  kategori: [
    { id: "handphone", nama: "Handphone", ikon: "📱", lucide: "smartphone" },
    { id: "laptop", nama: "Laptop", ikon: "💻", lucide: "laptop" },
    { id: "washer", nama: "Washer", ikon: "🫧", lucide: "washing-machine" },
    { id: "wearable", nama: "Wearable Tech", ikon: "⌚", lucide: "watch" },
    { id: "audio", nama: "Audio", ikon: "🎧", lucide: "headphones" }
  ],

  toko: {
    nama: "Toko SORTIK",
    alamat: "Jl. Elektronik No. 21, Kota Bandung",
    jam: "Senin–Sabtu, 09.00–20.00 WIB",
    wa: "6281200001122",
    ongkir: 25000,
    rekening: [{ bank: "BCA", nomor: "1234567890", atasNama: "Admin SORTIK" }]
  },

  /* rak: denah toko. grid = ukuran satu kotak alas (px); daftar lantai & rak
     diisi di bawah — siap dipetakan ke tabel lantai dan tabel rak. */
  rak: { grid: 28 },

  produk: [
    { id: 1, nama: "Samsung Galaxy A26 5G 8GB/256GB", kategori: "handphone", harga: 4999000, stok: 12, rak: "A1", ikon: "📱", deskripsi: "Ponsel 5G layar Super AMOLED 6,7 inci, RAM 8 GB, memori 256 GB, dan baterai 5.000 mAh." },
    { id: 2, nama: "Vivo Y500 4G 8GB/256GB", kategori: "handphone", harga: 5499000, diskon: 10, stok: 8, rak: "A2", ikon: "📱", deskripsi: "Ponsel 4G dengan baterai jumbo 6.500 mAh, pengisian cepat 90W, dan layar 120 Hz." },
    { id: 3, nama: "Apple iPhone 17 Pro Max", kategori: "handphone", harga: 24499000, stok: 4, rak: "A3", ikon: "📱", deskripsi: "Flagship Apple dengan chip A19 Pro, kamera utama 48 MP, dan bodi titanium." },
    { id: 4, nama: "Xiaomi Redmi Note 14 5G", kategori: "handphone", harga: 3199000, stok: 15, rak: "A4", ikon: "📱", deskripsi: "Ponsel 5G kelas menengah: layar AMOLED 120 Hz dan kamera 50 MP dengan OIS." },
    { id: 5, nama: "Asus Vivobook 14 (i3/5)", kategori: "laptop", harga: 6700000, stok: 6, rak: "B1", ikon: "💻", deskripsi: "Laptop 14 inci untuk kerja harian dengan Intel Core i3, RAM 8 GB, dan SSD 512 GB." },
    { id: 6, nama: "Acer Lite AL14 (Intel N100)", kategori: "laptop", harga: 8050000, diskon: 15, stok: 3, rak: "B2", ikon: "💻", deskripsi: "Laptop ringan 14 inci dengan Intel N100 — hemat daya, cocok untuk sekolah dan kerja ringan." },
    { id: 7, nama: "Samsung Galaxy Book4", kategori: "laptop", harga: 9999000, diskon: 5, stok: 5, rak: "B3", ikon: "💻", deskripsi: "Laptop tipis 15,6 inci dengan Intel Core 5, layar anti-glare, dan baterai tahan seharian." },
    { id: 8, nama: "Bosch Mesin Cuci Front Loading 8 KG", kategori: "washer", harga: 7909000, stok: 4, rak: "C1", ikon: "🫧", deskripsi: "Mesin cuci front loading 8 kg dengan 15 program dan motor inverter yang senyap serta hemat listrik." },
    { id: 9, nama: "Aqua Mesin Cuci 2 Tabung 8 Kg", kategori: "washer", harga: 2299000, stok: 7, rak: "C2", ikon: "🫧", deskripsi: "Mesin cuci 2 tabung 8 kg dengan pengering 6 kg, tangguh untuk pemakaian harian." },
    { id: 10, nama: "JBL Live Free 2 TWS", kategori: "audio", harga: 1649500, diskon: 20, stok: 10, rak: "D1", ikon: "🎧", deskripsi: "TWS JBL dengan hybrid noise cancelling, suara JBL Signature, dan daya tahan hingga 35 jam." },
    { id: 11, nama: "Sony Personal Earphone TWS WF-C710N", kategori: "audio", harga: 1509000, stok: 9, rak: "D2", ikon: "🎧", deskripsi: "Earphone TWS ringan dengan noise cancelling dan koneksi multipoint dua perangkat sekaligus." },
    { id: 12, nama: "Roadmaster Speaker Aktif Partyflash28", kategori: "audio", harga: 3278000, stok: 5, rak: "D3", ikon: "🔊", deskripsi: "Speaker aktif 28 inci dengan lampu LED, bluetooth, USB, dan mikrofon nirkabel untuk acara." },
    { id: 13, nama: "KJB Passive Speaker 081-PA", kategori: "audio", harga: 1429000, stok: 6, rak: "D4", ikon: "🔊", deskripsi: "Speaker pasif 8 inci 150 watt untuk panggung dan ruang serbaguna." },
    { id: 14, nama: "Roadmaster Speaker Aktif KD-Pro12USBST", kategori: "audio", harga: 2021000, stok: 3, rak: "E1", ikon: "🔊", deskripsi: "Speaker aktif 12 inci serba bisa: bluetooth, USB/SD, dan dua input mikrofon." },
    { id: 15, nama: "Polytron Speaker Aktif PAS8BF22", kategori: "audio", harga: 2265000, stok: 4, rak: "E2", ikon: "🔊", deskripsi: "Speaker aktif 8 inci dengan fitur karaoke, bluetooth, dan remote control." },
    { id: 16, nama: "Apple Watch SE (GPS 40mm)", kategori: "wearable", harga: 3499000, stok: 6, rak: "F1", ikon: "⌚", deskripsi: "Smartwatch GPS 40 mm dengan deteksi detak jantung, pemantau tidur, dan tahan air 50 m." },
    { id: 17, nama: "Xiaomi Redmi Watch 5", kategori: "wearable", harga: 899000, stok: 11, rak: "F2", ikon: "⌚", deskripsi: "Smartwatch layar AMOLED 2,07 inci, baterai hingga 20 hari, dan 150+ mode olahraga." }
  ],

  /* pesanan merujuk produk lewat id */
  pesanan: [
    { id: 1, produk: 1, pembeli: "Rina Kartika", jumlah: 1, status: "Menunggu", tanggal: "2026-09-01", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: false, staff: "" },
    { id: 2, produk: 10, pembeli: "Rina Kartika", jumlah: 1, status: "Diproses", tanggal: "2026-08-27", cara: "antar", bayar: "Transfer ke admin", alamat: "Jl. Merdeka No. 8, Bandung", lunas: true, staff: "Bagas Prasetyo" },
    { id: 3, produk: 13, pembeli: "Rina Kartika", jumlah: 1, status: "Siap", tanggal: "2026-08-03", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" },
    { id: 4, produk: 12, pembeli: "Rina Kartika", jumlah: 1, status: "Selesai", tanggal: "2026-07-13", cara: "ambil", bayar: "Transfer ke admin", alamat: "", lunas: true, staff: "Bagas Prasetyo" }
  ],

  pengguna: [
    { id: 1, nama: "Rina Kartika", email: "rina@mail.com", role: "pembeli", status: "aktif", telepon: "0812-1111-2222", alamat: "Jl. Merdeka No. 8, Bandung", avatar: "", ikon: "🧑", sandi: "h5b6tp1" },
    { id: 2, nama: "Bagas Prasetyo", email: "bagas@sortik.id", role: "staff", status: "aktif", telepon: "", alamat: "", avatar: "", ikon: "🧑", sandi: "h15n3cuf" },
    { id: 3, nama: "Dewi Lestari", email: "dewi@sortik.id", role: "admin", status: "aktif", telepon: "", alamat: "", avatar: "", ikon: "🧑", sandi: "hukbj1q" },
    { id: 4, nama: "Andi Saputra", email: "andi@mail.com", role: "pembeli", status: "aktif", telepon: "", alamat: "", avatar: "", ikon: "🧑", sandi: "" },
    { id: 5, nama: "Sari Melati", email: "sari@mail.com", role: "pembeli", status: "nonaktif", telepon: "", alamat: "", avatar: "", ikon: "🧑", sandi: "" }
  ],

  /* pesan grup: obrolan admin & staff dalam satu grup "Grup Toko" */
  pesan: [
    { id: 1, dari: "Dewi Lestari", peran: "admin", teks: "Siang tim 👋 Lantai 2 sudah saya buka di Tata Rak — silakan ditata raknya di sana.", waktu: "2026-10-20T09:12:00" },
    { id: 2, dari: "Bagas Prasetyo", peran: "staff", teks: "Siap Pak/Bu. Sore ini saya rapikan stok speaker yang laris ke rak dekat pintu biar gampang dijangkau.", waktu: "2026-10-20T13:40:00" },
    { id: 3, dari: "Dewi Lestari", peran: "admin", teks: "Boleh. Jangan lupa blok dekat tangga jangan tertutup rak ya, itu jalur pelanggan.", waktu: "2026-10-20T13:55:00" },
    { id: 4, dari: "Bagas Prasetyo", peran: "staff", teks: "Aman 👍. Oh iya, pesanan BK-2026-0011 sudah saya proses, tinggal diambil pembesok.", waktu: "2026-10-21T16:02:00" }
  ],

  /* keuangan: pendapatan dihitung dari pesanan lunas; pengeluaran dicatat manual */
  keuangan: {
    pengeluaran: [
      { id: 1, tanggal: "2026-08-05", keterangan: "Listrik & air sebulan", kategori: "Operasional", jumlah: 820000 },
      { id: 2, tanggal: "2026-08-10", keterangan: "Belanja stok mesin cuci Aqua", kategori: "Belanja barang", jumlah: 9500000 },
      { id: 3, tanggal: "2026-08-28", keterangan: "Gaji staff Agustus", kategori: "Gaji", jumlah: 6500000 },
      { id: 4, tanggal: "2026-09-07", keterangan: "Sewa ruko September", kategori: "Sewa", jumlah: 4500000 },
      { id: 5, tanggal: "2026-09-15", keterangan: "Iklan media sosial", kategori: "Pemasaran", jumlah: 350000 },
      { id: 6, tanggal: "2026-09-30", keterangan: "Gaji staff September", kategori: "Gaji", jumlah: 6500000 }
    ]
  }
};

/* pilihan ikon Lucide untuk form Kategori */
const IKON_KATEGORI = [
  ["smartphone", "Smartphone"], ["laptop", "Laptop"], ["washing-machine", "Mesin cuci"],
  ["watch", "Jam / Wearable"], ["headphones", "Audio / Headphone"], ["speaker", "Speaker"],
  ["tv", "Televisi"], ["camera", "Kamera"], ["gamepad-2", "Game"], ["printer", "Printer"],
  ["refrigerator", "Kulkas"], ["fan", "Kipas"], ["tag", "Lainnya"]
];

/* foto contoh: tautan internet; emoji tetap jadi cadangan */
const FOTO_BAWAAN = {
  1: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=70",
  2: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=70",
  3: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=70",
  4: "https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=600&q=70",
  5: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=70",
  6: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=70",
  7: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=70",
  8: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=70",
  9: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=70",
  10: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=70",
  11: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=70",
  12: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=70",
  13: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=70",
  14: "https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=600&q=70",
  15: "https://images.unsplash.com/photo-1558537348-c0f8e733989d?auto=format&fit=crop&w=600&q=70",
  16: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=70",
  17: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70"
};
db.produk.forEach((p) => { if (FOTO_BAWAAN[p.id]) p.foto = FOTO_BAWAAN[p.id]; });

/* Denah toko: bisa beberapa lantai. Tiap lantai punya luas (lebar×tinggi dalam
   kotak grid), satu pintu masuk (sisi + posisi di sisi itu), dan daftar rak.
   Posisi & ukuran rak disimpan dalam satuan kotak grid (bukan piksel),
   jadi ukuran kotak (db.rak.grid) boleh diubah tanpa merusak susunan. */
function susunAwal(baris = "ABCDEF", kolom = 4) {
  const daftar = [];
  [...baris].forEach((b, r) => {
    for (let i = 1; i <= kolom; i++) daftar.push({ kode: b + i, x: (i - 1) * 5, y: r * 3, w: 4, h: 2 });
  });
  return daftar;
}
function lantaiAwal(daftar) {
  const ujung = (f) => (daftar.length ? Math.max(...daftar.map(f)) : 0);
  const lebar = Math.max(24, ujung((r) => r.x + r.w));
  const tinggi = Math.max(18, ujung((r) => r.y + r.h));
  return { nama: "Lantai 1", lebar, tinggi, pintu: { sisi: "bawah", pos: Math.floor((lebar - 2) / 2) }, daftar };
}
db.rak = { grid: db.rak.grid || 28, lantai: [lantaiAwal(susunAwal())] };
