<?php
declare(strict_types=1);

/* Router API SORTIK. Semua jalur diawali /api (lihat bagian Deployment di README). */

require __DIR__ . '/../src/http.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/auth.php';
require __DIR__ . '/../src/api/toko.php';
require __DIR__ . '/../src/api/katalog.php';
require __DIR__ . '/../src/api/keranjang.php';
require __DIR__ . '/../src/api/pesanan.php';
require __DIR__ . '/../src/api/berkas.php';
require __DIR__ . '/../src/api/kelola.php';
require __DIR__ . '/../src/api/keuangan.php';

pasang_penanganan_galat();
kirim_header_aman();
periksa_origin();

/* [metode, pola jalur, fungsi penangan] — tambahkan rute baru di sini */
$rute = [
    ['GET',  '#^/kesehatan$#', 'kesehatan'],
    ['GET',  '#^/toko$#',      'toko_baca'],
    ['POST', '#^/masuk$#',     'masuk'],
    ['POST', '#^/daftar$#',    'daftar'],
    ['POST', '#^/keluar$#',    'keluar'],
    ['GET',  '#^/saya$#',      'saya'],
    ['GET',  '#^/kategori$#',  'kategori_daftar'],
    ['GET',  '#^/produk$#',    'produk_daftar'],
    ['GET',  '#^/rak$#',       'rak_baca'],
    ['POST', '#^/berkas/foto$#',                'foto_unggah'],
    ['POST', '#^/produk$#',                     'produk_buat'],
    ['PUT',  '#^/produk/(\d+)$#',               'produk_ubah'],
    ['PUT',  '#^/produk/(\d+)/rak$#',           'produk_pindah_rak'],
    ['DELETE', '#^/produk/(\d+)$#',             'produk_hapus'],
    ['POST', '#^/kategori$#',                   'kategori_buat'],
    ['PUT',  '#^/kategori/([^/]+)$#',           'kategori_ubah'],
    ['DELETE', '#^/kategori/([^/]+)$#',         'kategori_hapus'],
    ['GET',  '#^/pengeluaran$#',                'pengeluaran_daftar'],
    ['POST', '#^/pengeluaran$#',                'pengeluaran_buat'],
    ['DELETE', '#^/pengeluaran/(\d+)$#',       'pengeluaran_hapus'],
    ['GET',  '#^/pengguna$#',                   'pengguna_daftar'],
    ['POST', '#^/pengguna$#',                   'pengguna_buat'],
    ['PUT',  '#^/pengguna/(\d+)$#',             'pengguna_ubah'],
    ['DELETE', '#^/pengguna/(\d+)$#',           'pengguna_hapus'],
    ['PATCH', '#^/saya$#',                      'saya_ubah'],
    ['POST', '#^/saya/avatar$#',                'saya_avatar'],
    ['PUT',  '#^/toko$#',                       'toko_ubah'],
    ['PUT',  '#^/rak$#',                        'rak_simpan'],
    ['GET',  '#^/keranjang$#',                  'keranjang_baca'],
    ['POST', '#^/keranjang$#',                  'keranjang_tambah'],
    ['PUT',  '#^/keranjang/(\d+)$#',            'keranjang_atur'],
    ['GET',  '#^/pesanan$#',                    'pesanan_daftar'],
    ['GET',  '#^/pesanan/antrean$#',             'pesanan_antrean'],
    ['POST', '#^/pesanan$#',                    'pesanan_buat'],
    ['GET',  '#^/pesanan/(\d+)$#',              'pesanan_detail'],
    ['POST', '#^/pesanan/(\d+)/bayar$#',        'pesanan_bayar'],
    ['POST', '#^/pesanan/(\d+)/status$#',       'pesanan_status'],
    ['POST', '#^/pesanan/(\d+)/batal$#',        'pesanan_batal'],
    ['POST', '#^/pesanan/(\d+)/bukti$#',        'pesanan_bukti'],
    ['GET',  '#^/berkas/(foto|bukti)/([\w-]{1,64}\.(?:jpg|png|webp))$#', 'berkas_sajikan'],
];

$metode = $_SERVER['REQUEST_METHOD'];
$jalur = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$jalur = preg_replace('#^/api#', '', $jalur) ?: '/';
$jalur = $jalur === '/' ? $jalur : rtrim($jalur, '/');

$jalurCocok = false;
foreach ($rute as [$m, $pola, $penangan]) {
    if (preg_match($pola, $jalur, $cocok)) {
        $jalurCocok = true;
        if ($m === $metode) {
            $penangan(...array_slice($cocok, 1));
            exit;
        }
    }
}

throw new GalatHttp($jalurCocok ? 405 : 404, $jalurCocok ? 'Metode tidak diizinkan.' : 'Jalur tidak ditemukan.');
