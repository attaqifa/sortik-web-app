-- B3: keranjang belanja disimpan di server (bukan di browser).
CREATE TABLE IF NOT EXISTS keranjang (
  pengguna_id BIGINT NOT NULL REFERENCES pengguna(id) ON DELETE CASCADE,
  produk_id   BIGINT NOT NULL REFERENCES produk(id)   ON DELETE CASCADE,
  jumlah      INT    NOT NULL CHECK (jumlah >= 1),
  PRIMARY KEY (pengguna_id, produk_id)
);
