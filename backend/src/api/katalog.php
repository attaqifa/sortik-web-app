<?php
declare(strict_types=1);

/* Katalog publik (tanpa login): kategori, produk, denah rak.
   Bentuk JSON sengaja sama dengan objek db di frontend. */

/* GET /api/kategori */
function kategori_daftar(): void
{
    kirim_json(db_semua(
        "SELECT id, nama, COALESCE(lucide, '') AS lucide, '' AS ikon, urutan FROM kategori ORDER BY urutan, nama"
    ));
}

/* nama berkas unggahan → alamat penyaji; tautan https:// (foto contoh) dipakai apa adanya */
function foto_url(string $berkas): string
{
    return preg_match('#^https?://#i', $berkas) ? $berkas : '/api/berkas/foto/' . rawurlencode($berkas);
}

/* GET /api/produk — foto = foto utama, galeri = foto lain, terjual = unit pada pesanan yang tidak dibatalkan */
function produk_daftar(): void
{
    kirim_json(produk_muat());
}

/* satu produk (atau semua bila $id null) dalam bentuk JSON frontend */
function produk_muat(?int $id = null): array
{
    $produk = db_semua(
        "SELECT p.id, p.nama, COALESCE(p.kategori_id, '') AS kategori, p.harga, p.diskon, p.stok,
                COALESCE(p.rak_kode, '') AS rak, p.deskripsi, '' AS ikon,
                COALESCE((SELECT SUM(i.jumlah) FROM pesanan_item i JOIN pesanan o ON o.id = i.pesanan_id
                          WHERE i.produk_id = p.id AND o.status <> 'Dibatalkan'), 0)::int AS terjual
         FROM produk p " . ($id === null ? '' : 'WHERE p.id = ' . (int) $id) . ' ORDER BY p.id'
    );
    $foto = [];
    foreach (db_semua('SELECT produk_id, berkas FROM produk_foto ORDER BY produk_id, utama DESC, urutan, id') as $f) {
        $foto[$f['produk_id']][] = foto_url($f['berkas']);
    }
    foreach ($produk as &$p) {
        $semua = $foto[$p['id']] ?? [];
        $p['foto'] = $semua[0] ?? '';
        $p['galeri'] = array_slice($semua, 1);
    }
    return $produk;
}

/* GET /api/rak — { lantai: [{ id, nama, lebar, tinggi, pintu: {sisi, pos}, daftar: [rak], area: [area] }] } */
function rak_baca(): void
{
    $lantai = db_semua('SELECT id, nama, lebar, tinggi, pintu_sisi, pintu_pos FROM lantai ORDER BY urutan, id');
    $rak = [];
    foreach (db_semua('SELECT kode, lantai_id, x, y, w, h FROM rak ORDER BY kode') as $r) {
        $rak[$r['lantai_id']][] = ['kode' => $r['kode'], 'x' => $r['x'], 'y' => $r['y'], 'w' => $r['w'], 'h' => $r['h']];
    }
    $area = [];
    foreach (db_semua('SELECT id, lantai_id, nama, x, y, w, h FROM area ORDER BY id') as $a) {
        $area[$a['lantai_id']][] = ['id' => (string) $a['id'], 'nama' => $a['nama'], 'x' => $a['x'], 'y' => $a['y'], 'w' => $a['w'], 'h' => $a['h']];
    }
    $hasil = [];
    foreach ($lantai as $l) {
        $hasil[] = [
            'id' => $l['id'], 'nama' => $l['nama'], 'lebar' => $l['lebar'], 'tinggi' => $l['tinggi'],
            'pintu' => ['sisi' => $l['pintu_sisi'], 'pos' => $l['pintu_pos']],
            'daftar' => $rak[$l['id']] ?? [],
            'area' => $area[$l['id']] ?? [],
        ];
    }
    kirim_json(['lantai' => $hasil]);
}
