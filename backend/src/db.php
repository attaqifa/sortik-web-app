<?php
declare(strict_types=1);

/* Koneksi PostgreSQL lewat PDO. Semua query memakai prepared statement asli. */

function pdo(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'localhost',
            getenv('DB_PORT') ?: '5432',
            getenv('DB_NAME') ?: 'sortik_dev'
        );
        $pdo = new PDO($dsn, getenv('DB_USER') ?: 'sortik', getenv('DB_PASS') ?: '', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function db_semua(string $sql, array $param = []): array
{
    $st = pdo()->prepare($sql);
    $st->execute($param);
    return $st->fetchAll();
}

function db_satu(string $sql, array $param = []): ?array
{
    $st = pdo()->prepare($sql);
    $st->execute($param);
    $baris = $st->fetch();
    return $baris === false ? null : $baris;
}

/* jalankan $fn dalam satu transaksi; galat apa pun membatalkan semuanya */
function transaksi(callable $fn): mixed
{
    $pdo = pdo();
    $pdo->beginTransaction();
    try {
        $hasil = $fn($pdo);
        $pdo->commit();
        return $hasil;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
