/* SORTIK — data & util bersama (dipakai semua halaman pembeli)
   Satu-satunya sumber data mock. Saat pindah ke database, cukup isi ulang:
     Object.assign(db, await (await fetch("/api/db")).json());
   Nama field sengaja mengikuti kolom tabel yang dibutuhkan:
     kategori -> id, nama, ikon
     produk   -> id, nama, kategori, harga, stok, rak, ikon   (ikon nanti: gambar)
     pesanan  -> id, produk (id produk), jumlah, status, tanggal
   Render di user.js / cari.js / pesan.js tidak perlu diubah. */

const db = {
  user: { nama: "Rina Kartika", role: "Pembeli", inisial: "RK" },

  kategori: [
    { id: "handphone", nama: "Handphone", ikon: "📱" },
    { id: "laptop", nama: "Laptop", ikon: "💻" },
    { id: "washer", nama: "Washer", ikon: "🫧" },
    { id: "wearable", nama: "Wearable Tech", ikon: "⌚" },
    { id: "audio", nama: "Audio", ikon: "🎧" }
  ],

  /* denah rak toko: baris A–F × 4 kolom */
  rak: { baris: "ABCDEF", kolom: 4 },

  produk: [
    { id: 1, nama: "Samsung Galaxy A26 5G 8GB/256GB", kategori: "handphone", harga: 4999000, stok: 12, rak: "A1", ikon: "📱" },
    { id: 2, nama: "Vivo Y500 4G 8GB/256GB", kategori: "handphone", harga: 5499000, stok: 8, rak: "A2", ikon: "📱" },
    { id: 3, nama: "Apple iPhone 17 Pro Max", kategori: "handphone", harga: 24499000, stok: 4, rak: "A3", ikon: "📱" },
    { id: 4, nama: "Xiaomi Redmi Note 14 5G", kategori: "handphone", harga: 3199000, stok: 15, rak: "A4", ikon: "📱" },
    { id: 5, nama: "Asus Vivobook 14 (i3/5)", kategori: "laptop", harga: 6700000, stok: 6, rak: "B1", ikon: "💻" },
    { id: 6, nama: "Acer Lite AL14 (Intel N100)", kategori: "laptop", harga: 8050000, stok: 3, rak: "B2", ikon: "💻" },
    { id: 7, nama: "Samsung Galaxy Book4", kategori: "laptop", harga: 9999000, stok: 5, rak: "B3", ikon: "💻" },
    { id: 8, nama: "Bosch Mesin Cuci Front Loading 8 KG", kategori: "washer", harga: 7909000, stok: 4, rak: "C1", ikon: "🫧" },
    { id: 9, nama: "Aqua Mesin Cuci 2 Tabung 8 Kg", kategori: "washer", harga: 2299000, stok: 7, rak: "C2", ikon: "🫧" },
    { id: 10, nama: "JBL Live Free 2 TWS", kategori: "audio", harga: 1649500, stok: 10, rak: "D1", ikon: "🎧" },
    { id: 11, nama: "Sony Personal Earphone TWS WF-C710N", kategori: "audio", harga: 1509000, stok: 9, rak: "D2", ikon: "🎧" },
    { id: 12, nama: "Roadmaster Speaker Aktif Partyflash28", kategori: "audio", harga: 3278000, stok: 5, rak: "D3", ikon: "🔊" },
    { id: 13, nama: "KJB Passive Speaker 081-PA", kategori: "audio", harga: 1429000, stok: 6, rak: "D4", ikon: "🔊" },
    { id: 14, nama: "Roadmaster Speaker Aktif KD-Pro12USBST", kategori: "audio", harga: 2021000, stok: 3, rak: "E1", ikon: "🔊" },
    { id: 15, nama: "Polytron Speaker Aktif PAS8BF22", kategori: "audio", harga: 2265000, stok: 4, rak: "E2", ikon: "🔊" },
    { id: 16, nama: "Apple Watch SE (GPS 40mm)", kategori: "wearable", harga: 3499000, stok: 6, rak: "F1", ikon: "⌚" },
    { id: 17, nama: "Xiaomi Redmi Watch 5", kategori: "wearable", harga: 899000, stok: 11, rak: "F2", ikon: "⌚" }
  ],

  statistik: [
    { label: "Booking Aktif", nilai: 2 },
    { label: "Pesanan Diproses", nilai: 1 },
    { label: "Siap Diambil", nilai: 1 }
  ],

  /* pesanan merujuk ke produk (foreign key), bukan menyalin nama/harga */
  pesanan: [
    { id: 1, produk: 1, jumlah: 1, status: "Menunggu", tanggal: "2026-09-01" },
    { id: 2, produk: 10, jumlah: 1, status: "Diproses", tanggal: "2026-08-27" },
    { id: 3, produk: 13, jumlah: 1, status: "Siap", tanggal: "2026-08-03" },
    { id: 4, produk: 12, jumlah: 1, status: "Selesai", tanggal: "2026-07-13" }
  ]
};

/* ---------- util bersama ---------- */
const el = (id) => document.getElementById(id);
const isi = (id, html) => { const x = el(id); if (x) x.innerHTML = html; };
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const produkById = (id) => db.produk.find((p) => p.id === id) || {};

/* status pesanan -> kelas badge */
const warna = { Menunggu: "wait", Diproses: "proc", Siap: "ok", Selesai: "done" };

/* info user di pojok kiri bawah sidebar */
isi("me", `<div class="avatar">${db.user.inisial}</div>
  <div><b>${db.user.nama}</b><span>${db.user.role}</span></div>`);
