<?php
declare(strict_types=1);

/* Unggahan: simpan di backend/uploads (di luar folder publik), sajikan lewat /api/berkas. */

const MIME_GAMBAR = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const MAKS_UNGGAHAN = 2 * 1024 * 1024;

function folder_unggahan(string $jenis): string
{
    $d = dirname(__DIR__, 2) . '/uploads/' . $jenis;
    if (!is_dir($d) && !mkdir($d, 0775, true) && !is_dir($d)) {
        throw new RuntimeException("Folder unggahan tidak bisa dibuat: {$d}");
    }
    return $d;
}

/* validasi berkas gambar dari $_FILES[$field] dan simpan dengan nama acak; mengembalikan nama berkas */
function simpan_unggahan(string $field, string $jenis): string
{
    $f = $_FILES[$field] ?? null;
    if ($f === null || ($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        throw new GalatHttp(400, 'Pilih berkas gambar dulu.');
    }
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE || $f['size'] > MAKS_UNGGAHAN) {
        throw new GalatHttp(413, 'Ukuran gambar maksimal 2 MB.');
    }
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
        throw new GalatHttp(400, 'Unggahan gagal. Coba lagi.');
    }
    /* jenis dari isi berkas, bukan dari nama atau Content-Type kiriman klien */
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    if (!isset(MIME_GAMBAR[$mime])) {
        throw new GalatHttp(415, 'Hanya gambar JPG, PNG, atau WebP.');
    }
    $nama = bin2hex(random_bytes(16)) . '.' . MIME_GAMBAR[$mime];
    if (!move_uploaded_file($f['tmp_name'], folder_unggahan($jenis) . '/' . $nama)) {
        throw new RuntimeException('Berkas unggahan tidak bisa disimpan.');
    }
    return $nama;
}

/* GET /api/berkas/{jenis}/{nama} — foto produk terbuka; bukti transfer hanya untuk pemilik, staff, dan admin */
function berkas_sajikan(string $jenis, string $nama): void
{
    if ($jenis === 'bukti') {
        $u = wajib_login();
        if ($u['role'] === 'pembeli' && db_satu('SELECT 1 FROM pesanan WHERE bukti = ? AND pembeli_id = ?', [$nama, $u['id']]) === null) {
            throw new GalatHttp(404, 'Berkas tidak ditemukan.');
        }
    }
    $jalur = folder_unggahan($jenis) . '/' . $nama;
    if (!is_file($jalur)) {
        throw new GalatHttp(404, 'Berkas tidak ditemukan.');
    }
    $tipe = array_flip(MIME_GAMBAR)[pathinfo($nama, PATHINFO_EXTENSION)] ?? 'application/octet-stream';
    header('Content-Type: ' . $tipe);
    header('Content-Length: ' . filesize($jalur));
    header('Cache-Control: ' . ($jenis === 'foto' ? 'public, max-age=86400' : 'private, max-age=3600'));
    readfile($jalur);
    exit;
}
