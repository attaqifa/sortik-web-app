<?php
declare(strict_types=1);

/* Router untuk server bawaan PHP (hanya pengembangan).
   Jalankan dari akar repo:  php -S 127.0.0.1:8080 -t public backend/dev-router.php
   Hanya folder public/ yang disajikan; backend/, .env, docs/, dan .git/ tidak terjangkau.
   Produksi tidak memakai berkas ini: Dockerfile memakai Apache (docker/sortik.conf),
   dan di VPS tugas ini dipegang Nginx. */

/* muat .env di akar repo ke environment (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS) */
$env = dirname(__DIR__) . '/.env';
if (is_file($env)) {
    foreach (file($env, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $baris) {
        if ($baris[0] !== '#' && str_contains($baris, '=')) {
            [$k, $v] = explode('=', $baris, 2);
            $v = trim(trim($v), '"\'');
            putenv(trim($k) . '=' . $v);
        }
    }
}

$jalur = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');

if ($jalur === '/api' || str_starts_with($jalur, '/api/')) {
    require __DIR__ . '/public/index.php';
    return true;
}

/* berkas tersembunyi dan skrip PHP tidak pernah disajikan dari folder publik */
if (preg_match('#(^|/)\.[^/]*#', $jalur) || str_ends_with($jalur, '.php')) {
    http_response_code(403);
    echo 'Forbidden';
    return true;
}

return false; // berkas statis frontend dilayani apa adanya
