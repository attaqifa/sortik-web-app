<?php
declare(strict_types=1);

/* Keranjang belanja pembeli, disimpan di tabel keranjang (bukan di browser). */

/* harga jual = harga − diskon%, dibulatkan ke ratusan; sama dengan hargaJual() di frontend */
function harga_jual(int $harga, int $diskon): int
{
    $d = max(0, min(100, $diskon));
    return (int) (round($harga * (1 - $d / 100) / 100) * 100);
}

function keranjang_isi(int $uid): array
{
    return db_semua('SELECT produk_id AS produk, jumlah FROM keranjang WHERE pengguna_id = ? ORDER BY produk_id', [$uid]);
}

function angka_bulat(mixed $v, string $nama): int
{
    if (is_int($v) || (is_string($v) && preg_match('/^\d{1,9}$/', $v))) {
        return (int) $v;
    }
    throw new GalatHttp(400, "{$nama} harus bilangan bulat.");
}

/* GET /api/keranjang */
function keranjang_baca(): void
{
    $u = wajib_peran('pembeli');
    kirim_json(keranjang_isi((int) $u['id']));
}

/* POST /api/keranjang  {produk, tambah?}  — tambah jumlah, dibatasi stok */
function keranjang_tambah(): void
{
    $u = wajib_peran('pembeli');
    $in = baca_json();
    $id = angka_bulat($in['produk'] ?? null, 'Produk');
    $tambah = isset($in['tambah']) ? angka_bulat($in['tambah'], 'Jumlah') : 1;
    if ($tambah < 1) {
        throw new GalatHttp(400, 'Jumlah minimal 1.');
    }
    $p = db_satu('SELECT stok FROM produk WHERE id = ?', [$id]);
    if ($p === null) {
        throw new GalatHttp(404, 'Produk tidak ditemukan.');
    }
    if ($p['stok'] < 1) {
        throw new GalatHttp(409, 'Stok produk ini habis.');
    }
    db_semua('INSERT INTO keranjang (pengguna_id, produk_id, jumlah) VALUES (?, ?, LEAST(?::int, ?::int))
              ON CONFLICT (pengguna_id, produk_id) DO UPDATE SET jumlah = LEAST(?::int, keranjang.jumlah + ?::int)
              RETURNING jumlah', [$u['id'], $id, $tambah, $p['stok'], $p['stok'], $tambah]);
    kirim_json(keranjang_isi((int) $u['id']));
}

/* PUT /api/keranjang/{produk}  {jumlah} — set jumlah (0 = hapus), dibatasi stok */
function keranjang_atur(string $produk): void
{
    $u = wajib_peran('pembeli');
    $jumlah = angka_bulat(baca_json()['jumlah'] ?? null, 'Jumlah');
    $id = (int) $produk;
    if ($jumlah === 0) {
        db_semua('DELETE FROM keranjang WHERE pengguna_id = ? AND produk_id = ? RETURNING produk_id', [$u['id'], $id]);
    } else {
        $p = db_satu('SELECT stok FROM produk WHERE id = ?', [$id]);
        if ($p === null) {
            throw new GalatHttp(404, 'Produk tidak ditemukan.');
        }
        if ($p['stok'] < 1) {
            throw new GalatHttp(409, 'Stok produk ini habis.');
        }
        db_semua('INSERT INTO keranjang (pengguna_id, produk_id, jumlah) VALUES (?, ?, ?)
                  ON CONFLICT (pengguna_id, produk_id) DO UPDATE SET jumlah = EXCLUDED.jumlah
                  RETURNING jumlah', [$u['id'], $id, min($jumlah, $p['stok'])]);
    }
    kirim_json(keranjang_isi((int) $u['id']));
}
