-- Skema PostgreSQL SORTIK (sesuai docs/rancangan-backend.md bagian 3).
-- Dimuat otomatis oleh kontainer db saat volume masih kosong.
-- Perubahan setelah ini ditulis sebagai berkas bertanggal di backend/db/migrasi/.

CREATE TABLE pengguna (
  id          BIGSERIAL PRIMARY KEY,
  nama        TEXT NOT NULL,
  email       TEXT NOT NULL,
  sandi_hash  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('pembeli','staff','admin')),
  status      TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
  telepon     TEXT NOT NULL DEFAULT '',
  alamat      TEXT NOT NULL DEFAULT '',
  avatar      TEXT,                                  -- nama berkas
  dibuat      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pengguna_email_uq ON pengguna (lower(email));

CREATE TABLE login_gagal (                           -- pembatas percobaan di server
  kunci   TEXT PRIMARY KEY,                          -- email + IP
  jumlah  INT NOT NULL DEFAULT 0,
  sampai  TIMESTAMPTZ
);

CREATE TABLE toko (                                  -- satu baris saja
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nama TEXT NOT NULL, alamat TEXT NOT NULL, jam TEXT NOT NULL,
  wa TEXT NOT NULL, ongkir INT NOT NULL CHECK (ongkir >= 0), logo TEXT
);
CREATE TABLE rekening (
  id SERIAL PRIMARY KEY, bank TEXT NOT NULL, nomor TEXT NOT NULL, atas_nama TEXT NOT NULL
);

CREATE TABLE kategori (
  id TEXT PRIMARY KEY, nama TEXT NOT NULL, lucide TEXT, urutan INT NOT NULL DEFAULT 0
);

CREATE TABLE lantai (
  id SERIAL PRIMARY KEY, nama TEXT NOT NULL, lebar INT NOT NULL, tinggi INT NOT NULL,
  pintu_sisi TEXT NOT NULL, pintu_pos INT NOT NULL, urutan INT NOT NULL DEFAULT 0
);
CREATE TABLE rak (
  kode TEXT PRIMARY KEY, lantai_id INT NOT NULL REFERENCES lantai(id) ON DELETE CASCADE,
  x INT NOT NULL, y INT NOT NULL, w INT NOT NULL, h INT NOT NULL
);
CREATE TABLE area (
  id SERIAL PRIMARY KEY, lantai_id INT NOT NULL REFERENCES lantai(id) ON DELETE CASCADE,
  nama TEXT NOT NULL DEFAULT '', x INT NOT NULL, y INT NOT NULL, w INT NOT NULL, h INT NOT NULL
);

CREATE TABLE produk (
  id BIGSERIAL PRIMARY KEY, nama TEXT NOT NULL,
  kategori_id TEXT REFERENCES kategori(id),
  harga INT NOT NULL CHECK (harga >= 0),
  diskon SMALLINT NOT NULL DEFAULT 0 CHECK (diskon BETWEEN 0 AND 100),
  stok INT NOT NULL DEFAULT 0 CHECK (stok >= 0),     -- stok tidak bisa minus, dijaga database
  rak_kode TEXT REFERENCES rak(kode) ON UPDATE CASCADE,
  deskripsi TEXT NOT NULL DEFAULT ''
);
-- berkas: nama berkas unggahan, atau tautan https:// untuk foto contoh (seed)
CREATE TABLE produk_foto (
  id BIGSERIAL PRIMARY KEY, produk_id BIGINT NOT NULL REFERENCES produk(id) ON DELETE CASCADE,
  berkas TEXT NOT NULL, utama BOOLEAN NOT NULL DEFAULT false, urutan INT NOT NULL DEFAULT 0
);

CREATE TABLE pesanan (
  id BIGSERIAL PRIMARY KEY,
  pembeli_id BIGINT NOT NULL REFERENCES pengguna(id),
  cara TEXT NOT NULL CHECK (cara IN ('ambil','antar')),
  bayar TEXT NOT NULL CHECK (bayar IN ('Transfer ke admin','Bayar di kasir')),
  alamat TEXT NOT NULL DEFAULT '',
  ongkir INT NOT NULL DEFAULT 0 CHECK (ongkir >= 0),
  status TEXT NOT NULL DEFAULT 'Menunggu'
         CHECK (status IN ('Menunggu','Diproses','Siap','Selesai','Dibatalkan')),
  lunas BOOLEAN NOT NULL DEFAULT false,
  staff_id BIGINT REFERENCES pengguna(id),
  dibayar_pada TIMESTAMPTZ,
  bukti TEXT, bukti_pada TIMESTAMPTZ,
  alasan_batal TEXT, dibatalkan_pada TIMESTAMPTZ,
  dibuat TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pesanan_pembeli_ix ON pesanan (pembeli_id);
CREATE INDEX pesanan_status_ix  ON pesanan (status);

CREATE TABLE pesanan_item (
  id BIGSERIAL PRIMARY KEY,
  pesanan_id BIGINT NOT NULL REFERENCES pesanan(id) ON DELETE CASCADE,
  produk_id BIGINT NOT NULL REFERENCES produk(id),
  jumlah INT NOT NULL CHECK (jumlah >= 1),
  harga_satuan INT NOT NULL CHECK (harga_satuan >= 0)  -- harga dikunci saat dipesan
);

CREATE TABLE pengeluaran (
  id BIGSERIAL PRIMARY KEY, tanggal DATE NOT NULL, kategori TEXT NOT NULL DEFAULT 'Lain-lain',
  keterangan TEXT NOT NULL, jumlah INT NOT NULL CHECK (jumlah > 0),
  dicatat_oleh BIGINT REFERENCES pengguna(id)
);

CREATE TABLE keranjang (                             -- keranjang belanja per pembeli, disimpan di server
  pengguna_id BIGINT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  produk_id   BIGINT NOT NULL REFERENCES produk(id)   ON DELETE CASCADE,
  jumlah      INT    NOT NULL CHECK (jumlah >= 1),
  PRIMARY KEY (pengguna_id, produk_id)
);
