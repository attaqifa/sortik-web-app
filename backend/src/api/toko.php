<?php
declare(strict_types=1);

/* GET /api/toko — bentuk JSON sama dengan objek db.toko di frontend (atasNama camelCase). */
function toko_baca(): void
{
    $toko = db_satu('SELECT id, nama, alamat, jam, wa, ongkir, logo FROM toko WHERE id = 1');
    if ($toko === null) {
        throw new GalatHttp(404, 'Data toko belum diisi.');
    }
    $toko['logo'] = $toko['logo'] ? foto_url($toko['logo']) : '';
    $toko['rekening'] = db_semua('SELECT bank, nomor, atas_nama AS "atasNama" FROM rekening ORDER BY id');
    kirim_json($toko);
}

/* GET /api/kesehatan — pemeriksaan cepat: server hidup dan database terjangkau. */
function kesehatan(): void
{
    db_satu('SELECT 1');
    kirim_json(['ok' => true]);
}
