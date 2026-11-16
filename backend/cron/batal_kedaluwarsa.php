<?php
declare(strict_types=1);

/* Dijalankan cron tiap jam:  0 * * * * php /var/www/sortik/backend/cron/batal_kedaluwarsa.php
   Membatalkan pesanan Menunggu yang belum dibayar lewat batas waktu dan mengembalikan stoknya. */

if (PHP_SAPI !== 'cli') {
    exit(1);
}
require __DIR__ . '/../src/http.php';
require __DIR__ . '/../src/db.php';
require __DIR__ . '/../src/auth.php';
require __DIR__ . '/../src/api/pesanan.php';

echo date('c'), ' dibatalkan: ', batalkan_kedaluwarsa(), PHP_EOL;
