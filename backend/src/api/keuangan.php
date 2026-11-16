<?php
declare(strict_types=1);

/* Pengeluaran toko. Pendapatan & piutang dihitung dari pesanan; di sini hanya uang keluar. */

const SQL_PENGELUARAN = "SELECT id, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, kategori, keterangan, jumlah FROM pengeluaran";

/* GET /api/pengeluaran — staff & admin (staff hanya melihat) */
function pengeluaran_daftar(): void
{
    wajib_peran('staff', 'admin');
    kirim_json(db_semua(SQL_PENGELUARAN . ' ORDER BY tanggal DESC, id DESC'));
}

/* POST /api/pengeluaran {tanggal, kategori?, keterangan, jumlah} — admin */
function pengeluaran_buat(): void
{
    $u = wajib_peran('admin');
    $in = baca_json();
    $tanggal = trim((string) ($in['tanggal'] ?? ''));
    $d = DateTime::createFromFormat('!Y-m-d', $tanggal);
    if ($d === false || $d->format('Y-m-d') !== $tanggal) {
        throw new GalatHttp(400, 'Tanggal tidak valid.');
    }
    $keterangan = teks_wajib($in, 'keterangan', 'Keterangan', 200);
    $kategori = teks_opsi($in, 'kategori', 'Kategori', 40);
    $jumlah = angka_rentang($in, 'jumlah', 'Jumlah', 1, 2000000000);
    $baris = db_satu(
        "INSERT INTO pengeluaran (tanggal, kategori, keterangan, jumlah, dicatat_oleh) VALUES (?, ?, ?, ?, ?)
         RETURNING id, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, kategori, keterangan, jumlah",
        [$tanggal, $kategori !== '' ? $kategori : 'Lain-lain', $keterangan, $jumlah, $u['id']]
    );
    kirim_json($baris, 201);
}

/* DELETE /api/pengeluaran/{id} — admin */
function pengeluaran_hapus(string $id): void
{
    wajib_peran('admin');
    $baris = db_satu('DELETE FROM pengeluaran WHERE id = ? RETURNING id', [(int) $id]);
    if ($baris === null) {
        throw new GalatHttp(404, 'Catatan tidak ditemukan.');
    }
    kirim_json(['ok' => true]);
}
