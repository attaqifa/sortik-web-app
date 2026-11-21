<?php
declare(strict_types=1);

/* Unggahan: disimpan di tabel `berkas` (PostgreSQL), disajikan lewat /api/berkas.
   Disk server tidak dipakai, jadi aman di hosting yang disknya hilang saat redeploy. */

const MIME_GAMBAR = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const MAKS_UNGGAHAN = 2 * 1024 * 1024;

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
    $isi = fopen($f['tmp_name'], 'rb');
    if ($isi === false) {
        throw new RuntimeException('Berkas unggahan tidak bisa dibaca.');
    }
    $st = pdo()->prepare('INSERT INTO berkas (jenis, nama, mime, isi) VALUES (?, ?, ?, ?)');
    $st->bindValue(1, $jenis);
    $st->bindValue(2, $nama);
    $st->bindValue(3, $mime);
    $st->bindValue(4, $isi, PDO::PARAM_LOB);
    $st->execute();
    fclose($isi);
    return $nama;
}

function berkas_ada(string $jenis, string $nama): bool
{
    return db_satu('SELECT 1 FROM berkas WHERE jenis = ? AND nama = ?', [$jenis, $nama]) !== null;
}

function hapus_berkas(string $jenis, string $nama): void
{
    db_semua('DELETE FROM berkas WHERE jenis = ? AND nama = ? RETURNING nama', [$jenis, basename($nama)]);
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
    $st = pdo()->prepare('SELECT mime, isi FROM berkas WHERE jenis = ? AND nama = ?');
    $st->execute([$jenis, $nama]);
    $st->bindColumn(1, $mime);
    $st->bindColumn(2, $isi, PDO::PARAM_LOB);
    if (!$st->fetch(PDO::FETCH_BOUND)) {
        throw new GalatHttp(404, 'Berkas tidak ditemukan.');
    }
    $data = is_resource($isi) ? stream_get_contents($isi) : (string) $isi;
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . strlen($data));
    header('Cache-Control: ' . ($jenis === 'foto' ? 'public, max-age=86400' : 'private, max-age=3600'));
    echo $data;
    exit;
}
