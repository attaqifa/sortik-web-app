<?php
declare(strict_types=1);

/* Pembantu HTTP: kirim JSON, baca JSON, galat seragam. */

final class GalatHttp extends RuntimeException
{
    public function __construct(public readonly int $status, string $pesan)
    {
        parent::__construct($pesan);
    }
}

function kirim_header_aman(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
}

function kirim_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

/* respons umum ke klien; rincian teknis hanya masuk log server */
function pasang_penanganan_galat(): void
{
    ini_set('display_errors', '0');
    set_exception_handler(function (Throwable $e): void {
        if ($e instanceof GalatHttp) {
            kirim_json(['error' => $e->getMessage()], $e->status);
        }
        error_log('[sortik] ' . $e::class . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        kirim_json(['error' => 'Terjadi kesalahan di server.'], 500);
    });
}

/* badan permintaan sebagai array; wajib Content-Type: application/json */
function baca_json(): array
{
    $tipe = strtolower(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]);
    if ($tipe !== 'application/json') {
        throw new GalatHttp(415, 'Content-Type harus application/json.');
    }
    $mentah = file_get_contents('php://input');
    $data = json_decode($mentah === false ? '' : $mentah, true);
    if (!is_array($data)) {
        throw new GalatHttp(400, 'Isi permintaan bukan JSON yang valid.');
    }
    return $data;
}
