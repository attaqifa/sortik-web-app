<?php
declare(strict_types=1);

/* Sesi, login, dan pemeriksaan peran. */

const BATAS_GAGAL = 5;     // kegagalan berturut-turut sebelum dikunci
const JEDA_GAGAL_DETIK = 60;

function mulai_sesi(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'; // di balik Nginx
    session_name('sortik');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,      // di VPS (HTTPS) otomatis aktif; di localhost HTTP tetap bisa
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    session_start();
}

/* tolak permintaan pengubah data yang berasal dari situs lain */
function periksa_origin(): void
{
    if (in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && parse_url($origin, PHP_URL_HOST) . ':' . (parse_url($origin, PHP_URL_PORT) ?? '')
        !== explode(':', $_SERVER['HTTP_HOST'] ?? '')[0] . ':' . (explode(':', $_SERVER['HTTP_HOST'] ?? '')[1] ?? '')) {
        throw new GalatHttp(403, 'Asal permintaan tidak diizinkan.');
    }
}

function pengguna_publik(array $u): array
{
    return [
        'id' => (int) $u['id'],
        'nama' => $u['nama'],
        'email' => $u['email'],
        'role' => $u['role'],
        'telepon' => $u['telepon'],
        'alamat' => $u['alamat'],
        'avatar' => !empty($u['avatar']) ? foto_url($u['avatar']) : '',
    ];
}

/* pengguna dari sesi; dibaca ulang dari database agar akun yang dinonaktifkan langsung tertolak */
function pengguna_saat_ini(): ?array
{
    mulai_sesi();
    $id = $_SESSION['uid'] ?? null;
    if ($id === null) {
        return null;
    }
    $u = db_satu('SELECT id, nama, email, role, status, telepon, alamat, avatar FROM pengguna WHERE id = ?', [$id]);
    if ($u === null || $u['status'] !== 'aktif') {
        akhiri_sesi();
        return null;
    }
    return $u;
}

function wajib_login(): array
{
    $u = pengguna_saat_ini();
    if ($u === null) {
        throw new GalatHttp(401, 'Silakan masuk dulu.');
    }
    return $u;
}

/* wajib_peran('staff', 'admin') → 403 bila peran sesi tidak termasuk */
function wajib_peran(string ...$boleh): array
{
    $u = wajib_login();
    if (!in_array($u['role'], $boleh, true)) {
        throw new GalatHttp(403, 'Peran Anda tidak boleh melakukan ini.');
    }
    return $u;
}

function akhiri_sesi(): void
{
    mulai_sesi();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'],
            'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']);
    }
    session_destroy();
}

/* ---------- pembatas percobaan: kunci = email + IP, disimpan di tabel login_gagal ---------- */
function kunci_gagal(string $email): string
{
    return strtolower($email) . '|' . ($_SERVER['REMOTE_ADDR'] ?? '');
}

function sisa_jeda(string $kunci): int
{
    $r = db_satu('SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (sampai - now()))))::int AS detik
                  FROM login_gagal WHERE kunci = ? AND sampai IS NOT NULL', [$kunci]);
    return (int) ($r['detik'] ?? 0);
}

function catat_gagal(string $kunci): void
{
    /* hitungan dimulai dari nol bila kunci lama sudah lewat */
    db_satu('INSERT INTO login_gagal (kunci, jumlah, sampai) VALUES (?, 1, NULL)
             ON CONFLICT (kunci) DO UPDATE SET
               jumlah = CASE WHEN login_gagal.sampai IS NOT NULL AND login_gagal.sampai <= now()
                             THEN 1 ELSE login_gagal.jumlah + 1 END,
               sampai = CASE WHEN (CASE WHEN login_gagal.sampai IS NOT NULL AND login_gagal.sampai <= now()
                                        THEN 1 ELSE login_gagal.jumlah + 1 END) >= ' . BATAS_GAGAL . '
                             THEN now() + interval \'' . JEDA_GAGAL_DETIK . ' seconds\' ELSE NULL END
             RETURNING jumlah', [$kunci]);
}

function bersih_gagal(string $kunci): void
{
    db_semua('DELETE FROM login_gagal WHERE kunci = ? RETURNING kunci', [$kunci]);
}

/* ---------- endpoint ---------- */

/* POST /api/masuk  {email, sandi, peran?} */
function masuk(): void
{
    $in = baca_json();
    $email = trim((string) ($in['email'] ?? ''));
    $sandi = (string) ($in['sandi'] ?? '');
    $peran = isset($in['peran']) ? (string) $in['peran'] : null;
    if ($email === '' || $sandi === '') {
        throw new GalatHttp(400, 'Email dan kata sandi wajib diisi.');
    }

    $kunci = kunci_gagal($email);
    $jeda = sisa_jeda($kunci);
    if ($jeda > 0) {
        throw new GalatHttp(429, "Terlalu banyak percobaan salah — coba lagi dalam {$jeda} detik.");
    }

    $u = db_satu('SELECT id, nama, email, sandi_hash, role, status, telepon, alamat, avatar
                  FROM pengguna WHERE lower(email) = lower(?)', [$email]);
    /* email tak dikenal dan sandi salah dijawab sama, dengan waktu yang mirip */
    $hash = $u['sandi_hash'] ?? password_hash('dummy', PASSWORD_ARGON2ID);
    $cocok = password_verify($sandi, $hash) && $u !== null;
    if (!$cocok) {
        catat_gagal($kunci);
        throw new GalatHttp(401, 'Email atau kata sandi salah.');
    }
    if ($u['status'] !== 'aktif') {
        throw new GalatHttp(403, 'Akun ini nonaktif — hubungi admin toko.');
    }
    if ($peran !== null && $peran !== $u['role']) {
        $nama = ['pembeli' => 'Pembeli', 'staff' => 'Staff Toko', 'admin' => 'Admin Toko'][$u['role']];
        throw new GalatHttp(403, "Email ini terdaftar sebagai {$nama} — pilih peran itu di atas.");
    }

    bersih_gagal($kunci);
    if (password_needs_rehash($u['sandi_hash'], PASSWORD_ARGON2ID)) {
        db_semua('UPDATE pengguna SET sandi_hash = ? WHERE id = ? RETURNING id',
            [password_hash($sandi, PASSWORD_ARGON2ID), $u['id']]);
    }
    mulai_sesi();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $u['id'];
    kirim_json(['user' => pengguna_publik($u)]);
}

/* POST /api/daftar  {nama, email, sandi} — selalu peran pembeli */
function daftar(): void
{
    $in = baca_json();
    $nama = trim((string) ($in['nama'] ?? ''));
    $email = trim((string) ($in['email'] ?? ''));
    $sandi = (string) ($in['sandi'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        throw new GalatHttp(400, 'Alamat email tidak valid.');
    }
    if (strlen($sandi) < 8 || strlen($sandi) > 200) {
        throw new GalatHttp(400, 'Kata sandi minimal 8 karakter.');
    }
    if (strlen($nama) > 200) { // byte, bukan huruf: cukup untuk membatasi, tanpa ekstensi mbstring
        throw new GalatHttp(400, 'Nama terlalu panjang.');
    }
    if ($nama === '') {
        $nama = explode('@', $email)[0];
    }
    try {
        $u = db_satu("INSERT INTO pengguna (nama, email, sandi_hash, role) VALUES (?, ?, ?, 'pembeli')
                      RETURNING id, nama, email, role, telepon, alamat, avatar",
            [$nama, $email, password_hash($sandi, PASSWORD_ARGON2ID)]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23505') { // email sudah ada (indeks unik)
            throw new GalatHttp(409, 'Email sudah terdaftar — silakan masuk di halaman Masuk.');
        }
        throw $e;
    }
    mulai_sesi();
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $u['id'];
    kirim_json(['user' => pengguna_publik($u)], 201);
}

/* POST /api/keluar */
function keluar(): void
{
    akhiri_sesi();
    kirim_json(['ok' => true]);
}

/* GET /api/saya */
function saya(): void
{
    kirim_json(['user' => pengguna_publik(wajib_login())]);
}
