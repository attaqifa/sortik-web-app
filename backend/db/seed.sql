-- Data contoh SORTIK. DIHASILKAN dari DATA_AWAL di assets/js/core/koneksi.js — jangan sunting tangan.
-- Semua akun contoh memakai kata sandi demo (hash Argon2id). Akun nyata dibuat lewat /api/daftar.

INSERT INTO pengguna (id, nama, email, sandi_hash, role, status, telepon, alamat, dibuat) VALUES
  (1, 'Admin Toko', 'admin@sortik.id', '$argon2id$v=19$m=65536,t=4,p=1$RDJIVlJXWWJmdS5Td25TTA$o5/N1nj8UsDieHurtWtlXTzOPFsGaj9cqwYBUSnC8u8', 'admin', 'aktif', '6281234567891', '', '2026-10-01T00:00:00Z'),
  (2, 'Staff Toko', 'staff@sortik.id', '$argon2id$v=19$m=65536,t=4,p=1$RDJIVlJXWWJmdS5Td25TTA$o5/N1nj8UsDieHurtWtlXTzOPFsGaj9cqwYBUSnC8u8', 'staff', 'aktif', '6281234567892', '', '2026-10-01T00:00:00Z'),
  (3, 'Budi Pembeli', 'budi@sortik.id', '$argon2id$v=19$m=65536,t=4,p=1$RDJIVlJXWWJmdS5Td25TTA$o5/N1nj8UsDieHurtWtlXTzOPFsGaj9cqwYBUSnC8u8', 'pembeli', 'aktif', '6281234567893', 'Jl. Kenanga No. 5, Malang', '2026-10-01T00:00:00Z'),
  (4, 'Sari Pembeli', 'sari@sortik.id', '$argon2id$v=19$m=65536,t=4,p=1$RDJIVlJXWWJmdS5Td25TTA$o5/N1nj8UsDieHurtWtlXTzOPFsGaj9cqwYBUSnC8u8', 'pembeli', 'aktif', '6281234567894', 'Jl. Melati No. 9, Malang', '2026-10-01T00:00:00Z'),
  (5, 'Akun Lama', 'lama@sortik.id', '$argon2id$v=19$m=65536,t=4,p=1$RDJIVlJXWWJmdS5Td25TTA$o5/N1nj8UsDieHurtWtlXTzOPFsGaj9cqwYBUSnC8u8', 'pembeli', 'nonaktif', '', '', '2026-10-01T00:00:00Z');
SELECT setval(pg_get_serial_sequence('pengguna','id'), 5);

INSERT INTO toko (id, nama, alamat, jam, wa, ongkir, logo) VALUES (1, 'Toko Elektronik Sortik', 'Jl. Merdeka No. 12, Malang', '08.00–21.00', '6281234567890', 10000, NULL);
INSERT INTO rekening (bank, nomor, atas_nama) VALUES
  ('BCA', '1234567890', 'Sortik Store'),
  ('Mandiri', '9876543210', 'Sortik Store');

INSERT INTO kategori (id, nama, lucide, urutan) VALUES
  ('smartphone', 'Smartphone', 'smartphone', 0),
  ('laptop', 'Laptop', 'laptop', 1),
  ('audio', 'Audio / Headphone', 'headphones', 2),
  ('tv', 'Televisi', 'tv', 3),
  ('game', 'Game', 'gamepad-2', 4),
  ('kamera', 'Kamera', 'camera', 5);

INSERT INTO lantai (id, nama, lebar, tinggi, pintu_sisi, pintu_pos, urutan) VALUES (1, 'Lantai 1', 24, 18, 'bawah', 10, 0);
INSERT INTO rak (kode, lantai_id, x, y, w, h) VALUES
  ('A1', 1, 1, 1, 5, 2),
  ('A2', 1, 7, 1, 5, 2),
  ('B1', 1, 13, 1, 5, 2),
  ('B2', 1, 1, 5, 5, 2),
  ('C1', 1, 7, 5, 5, 2),
  ('C2', 1, 13, 5, 5, 2);
INSERT INTO area (lantai_id, nama, x, y, w, h) VALUES
  (1, 'Kasir', 1, 14, 6, 2);
SELECT setval(pg_get_serial_sequence('lantai','id'), 1);

INSERT INTO produk (id, nama, kategori_id, harga, diskon, stok, rak_kode, deskripsi) VALUES
  (1, 'Samsung Galaxy A55', 'smartphone', 4999000, 5, 12, 'A1', 'Layar AMOLED 120Hz, kamera 50MP, baterai 5000mAh.'),
  (2, 'iPhone 13 128GB', 'smartphone', 9999000, 0, 4, 'A1', 'Chip A15 Bionic, kamera ganda, iOS 18.'),
  (3, 'Lenovo ThinkPad E14', 'laptop', 12500000, 10, 3, 'B1', 'Ryzen 5, RAM 16GB, SSD 512GB, layar 14 inci.'),
  (4, 'ASUS Vivobook 15', 'laptop', 8500000, 0, 7, 'B1', 'Core i5 Gen 12, RAM 8GB, SSD 512GB.'),
  (5, 'Sony WH-1000XM5', 'audio', 5499000, 0, 6, 'A2', 'Peredam bising terbaik di kelasnya, baterai 30 jam.'),
  (6, 'TWS Earbuds Pro', 'audio', 299000, 20, 25, 'A2', 'Bluetooth 5.3, tahan air IPX4, baterai 24 jam.'),
  (7, 'Smart TV 43" 4K', 'tv', 4500000, 0, 5, 'B2', 'Resolusi 4K UHD, Android TV, HDR10.'),
  (8, 'Konsol Game Next-gen', 'game', 6200000, 0, 0, 'C1', 'SSD super cepat, ray tracing, dukungan 4K 120fps.'),
  (9, 'Kamera Mirrorless M50', 'kamera', 9750000, 0, 2, 'C2', 'Sensor APS-C 24MP, video 4K, layar sentuh putar.'),
  (10, 'Powerbank 20000mAh', 'smartphone', 349000, 0, 30, 'A1', 'Output 22.5W, isi ulang 3 perangkat sekaligus.');
SELECT setval(pg_get_serial_sequence('produk','id'), 10);

INSERT INTO produk_foto (produk_id, berkas, utama, urutan) VALUES
  (1, 'https://images.unsplash.com/photo-1581410307517-1d1aac3dfdcb?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (1, 'https://images.unsplash.com/photo-1756098520280-7c10327d4858?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1),
  (2, 'https://images.unsplash.com/photo-1650488619534-a733eacb15c1?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (2, 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1),
  (3, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (3, 'https://images.unsplash.com/photo-1680479611243-a072462e4d6b?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1),
  (4, 'https://images.unsplash.com/photo-1680479611243-a072462e4d6b?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (5, 'https://images.unsplash.com/photo-1711397996073-c9a629ebc05b?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (6, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (7, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (7, 'https://images.unsplash.com/photo-1461151304267-38535e780c79?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1),
  (8, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (8, 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1),
  (8, 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 2),
  (9, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (9, 'https://images.unsplash.com/photo-1597511858759-8ee3767d9ad4?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1),
  (10, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?fm=jpg&q=70&w=1200&auto=format&fit=crop', true, 0),
  (10, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?fm=jpg&q=70&w=1200&auto=format&fit=crop', false, 1);

INSERT INTO pesanan (id, pembeli_id, cara, bayar, alamat, ongkir, status, lunas, staff_id, dibayar_pada, bukti_pada, dibuat) VALUES
  (1, 3, 'ambil', 'Bayar di kasir', '', 0, 'Selesai', true, 2, '2026-10-30T00:00:00Z', NULL, '2026-10-30T00:00:00Z'),
  (2, 3, 'antar', 'Transfer ke admin', 'Jl. Kenanga No. 5, Malang', 10000, 'Diproses', true, 2, '2026-11-01T14:10:00.000Z', '2026-11-01T14:10:00.000Z', '2026-11-01T00:00:00Z'),
  (3, 4, 'ambil', 'Bayar di kasir', '', 0, 'Siap', false, NULL, NULL, NULL, '2026-11-02T00:00:00Z'),
  (4, 4, 'antar', 'Transfer ke admin', 'Jl. Melati No. 9, Malang', 10000, 'Menunggu', false, NULL, NULL, NULL, '2026-11-02T00:00:00Z');
SELECT setval(pg_get_serial_sequence('pesanan','id'), 4);
INSERT INTO pesanan_item (pesanan_id, produk_id, jumlah, harga_satuan) VALUES
  (1, 6, 2, 239200),
  (2, 5, 1, 5499000),
  (3, 10, 3, 349000),
  (4, 7, 1, 4500000);

INSERT INTO pengeluaran (id, tanggal, kategori, keterangan, jumlah, dicatat_oleh) VALUES
  (1, '2026-10-28', 'Operasional', 'Listrik & internet toko', 750000, 1),
  (2, '2026-10-30', 'Pengemasan', 'Karung & bubble wrap', 120000, 1),
  (3, '2026-11-01', 'Operasional', 'Konsumsi rapat bulanan', 200000, 1);
SELECT setval(pg_get_serial_sequence('pengeluaran','id'), 3);
