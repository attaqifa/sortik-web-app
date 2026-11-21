<?php
declare(strict_types=1);

/* Pesanan: checkout, daftar, bayar, status, batal, bukti transfer, kedaluwarsa.
   Semua perubahan stok dan status terjadi dalam transaksi dengan kunci baris,
   jadi dua pembeli tidak bisa memesan unit terakhir yang sama. */

const CARA_ANTAR_AMBIL = ['ambil', 'antar'];
const CARA_BAYAR = ['Transfer ke admin', 'Bayar di kasir'];
const ALUR_STATUS = ['Menunggu', 'Diproses', 'Siap', 'Selesai'];
const HARI_TAHAN = 2; // pesanan Menunggu yang belum dibayar dibatalkan setelah sekian hari

function waktu_iso(?string $v): ?string
{
    return $v === null ? null : (new DateTimeImmutable($v))->format(DATE_ATOM);
}

/* ambil pesanan + itemnya dalam bentuk JSON untuk frontend.
   $where hanya berisi kondisi tetap dari kode ini, nilai pengguna selalu lewat $param. */
function pesanan_muat(string $where, array $param = []): array
{
    $baris = db_semua(
        "SELECT o.id, o.pembeli_id AS \"pembeliId\", u.nama AS pembeli, o.cara, o.bayar, o.alamat, o.ongkir,
                o.status, o.lunas, COALESCE(s.nama, '') AS staff, o.dibayar_pada, o.bukti, o.bukti_pada,
                COALESCE(o.alasan_batal, '') AS \"alasanBatal\", o.dibuat, to_char(o.dibuat, 'YYYY-MM-DD') AS tanggal
         FROM pesanan o
         JOIN pengguna u ON u.id = o.pembeli_id
         LEFT JOIN pengguna s ON s.id = o.staff_id
         WHERE {$where} ORDER BY o.id DESC",
        $param
    );
    if (!$baris) {
        return [];
    }
    $item = [];
    $ids = '{' . implode(',', array_column($baris, 'id')) . '}';
    foreach (db_semua('SELECT pesanan_id, produk_id AS produk, jumlah, harga_satuan AS harga
                       FROM pesanan_item WHERE pesanan_id = ANY(?::bigint[]) ORDER BY id', [$ids]) as $i) {
        $item[$i['pesanan_id']][] = ['produk' => $i['produk'], 'jumlah' => $i['jumlah'], 'harga' => $i['harga']];
    }
    foreach ($baris as &$o) {
        $o['items'] = $item[$o['id']] ?? [];
        $o['subtotal'] = array_sum(array_map(fn($i) => $i['harga'] * $i['jumlah'], $o['items']));
        $o['total'] = $o['subtotal'] + $o['ongkir'];
        $o['kode'] = sprintf('BK-%s-%03d', substr($o['tanggal'], 0, 4), $o['id']);
        $o['dibayarPada'] = waktu_iso($o['dibayar_pada']);
        $o['buktiPada'] = waktu_iso($o['bukti_pada']);
        $o['bukti'] = $o['bukti'] ? '/api/berkas/bukti/' . $o['bukti'] : '';
        $o['dibuat'] = waktu_iso($o['dibuat']);
        unset($o['dibayar_pada'], $o['bukti_pada']);
    }
    return $baris;
}

/* satu pesanan yang boleh dilihat pengguna ini (pembeli: hanya miliknya) */
function pesanan_milik(int $id, array $u): array
{
    $hasil = $u['role'] === 'pembeli'
        ? pesanan_muat('o.id = ? AND o.pembeli_id = ?', [$id, $u['id']])
        : pesanan_muat('o.id = ?', [$id]);
    if (!$hasil) {
        throw new GalatHttp(404, 'Pesanan tidak ditemukan.');
    }
    return $hasil[0];
}

/* GET /api/pesanan?status=… — pembeli: miliknya; staff/admin: semua */
function pesanan_daftar(): void
{
    $u = wajib_login();
    batalkan_kedaluwarsa();
    $where = [];
    $param = [];
    if ($u['role'] === 'pembeli') {
        $where[] = 'o.pembeli_id = ?';
        $param[] = $u['id'];
    }
    $status = $_GET['status'] ?? '';
    if ($status !== '') {
        if (!in_array($status, [...ALUR_STATUS, 'Dibatalkan'], true)) {
            throw new GalatHttp(400, 'Status tidak dikenal.');
        }
        $where[] = 'o.status = ?';
        $param[] = $status;
    }
    kirim_json(pesanan_muat($where ? implode(' AND ', $where) : 'TRUE', $param));
}

/* GET /api/pesanan/antrean — daftar ID untuk badge dan notifikasi admin/staff. */
function pesanan_antrean(): void
{
    wajib_peran('admin', 'staff');
    batalkan_kedaluwarsa();
    $baris = db_semua("SELECT id FROM pesanan WHERE status = 'Menunggu'");
    kirim_json(array_map('intval', array_column($baris, 'id')));
}

/* GET /api/pesanan/{id} */
function pesanan_detail(string $id): void
{
    kirim_json(pesanan_milik((int) $id, wajib_login()));
}

/* POST /api/pesanan  {cara, bayar, alamat?} — checkout dari isi keranjang di server */
function pesanan_buat(): void
{
    $u = wajib_peran('pembeli');
    $in = baca_json();
    $cara = (string) ($in['cara'] ?? '');
    $bayar = (string) ($in['bayar'] ?? '');
    $alamat = trim((string) ($in['alamat'] ?? ''));
    if (!in_array($cara, CARA_ANTAR_AMBIL, true) || !in_array($bayar, CARA_BAYAR, true)) {
        throw new GalatHttp(400, 'Cara pengambilan atau pembayaran tidak valid.');
    }
    if ($cara === 'antar' && $alamat === '') {
        throw new GalatHttp(400, 'Alamat pengantaran wajib diisi.');
    }
    if (strlen($alamat) > 500) {
        throw new GalatHttp(400, 'Alamat terlalu panjang.');
    }

    $id = transaksi(function () use ($u, $cara, $bayar, $alamat): int {
        /* kunci keranjang dulu: checkout ganda dari pembeli yang sama menemukan keranjang kosong */
        $isi = db_semua('SELECT produk_id, jumlah FROM keranjang WHERE pengguna_id = ? ORDER BY produk_id FOR UPDATE', [$u['id']]);
        if (!$isi) {
            throw new GalatHttp(400, 'Keranjang masih kosong.');
        }
        /* kunci baris produk berurutan (anti-deadlock), lalu periksa stok dengan nilai terbaru */
        $ph = implode(',', array_fill(0, count($isi), '?'));
        $produk = [];
        foreach (db_semua("SELECT id, nama, harga, diskon, stok FROM produk WHERE id IN ({$ph}) ORDER BY id FOR UPDATE",
            array_column($isi, 'produk_id')) as $p) {
            $produk[$p['id']] = $p;
        }
        foreach ($isi as $i) {
            $p = $produk[$i['produk_id']] ?? null;
            if ($p === null) {
                throw new GalatHttp(409, 'Ada barang di keranjang yang sudah tidak tersedia.');
            }
            if ($p['stok'] < $i['jumlah']) {
                throw new GalatHttp(409, "Stok {$p['nama']} tidak mencukupi (sisa {$p['stok']}). Periksa keranjang Anda.");
            }
        }
        $ongkir = $cara === 'antar' ? (int) db_satu('SELECT ongkir FROM toko WHERE id = 1')['ongkir'] : 0;
        $pesanan = db_satu('INSERT INTO pesanan (pembeli_id, cara, bayar, alamat, ongkir) VALUES (?, ?, ?, ?, ?) RETURNING id',
            [$u['id'], $cara, $bayar, $cara === 'antar' ? $alamat : '', $ongkir]);
        foreach ($isi as $i) {
            $p = $produk[$i['produk_id']];
            db_semua('UPDATE produk SET stok = stok - ? WHERE id = ? RETURNING id', [$i['jumlah'], $p['id']]);
            /* harga dikunci saat dipesan: diskon belakangan tidak mengubah riwayat */
            db_semua('INSERT INTO pesanan_item (pesanan_id, produk_id, jumlah, harga_satuan) VALUES (?, ?, ?, ?) RETURNING id',
                [$pesanan['id'], $p['id'], $i['jumlah'], harga_jual((int) $p['harga'], (int) $p['diskon'])]);
        }
        db_semua('DELETE FROM keranjang WHERE pengguna_id = ? RETURNING produk_id', [$u['id']]);
        return (int) $pesanan['id'];
    });
    kirim_json(pesanan_milik($id, $u), 201);
}

/* kunci satu baris pesanan di dalam transaksi */
function pesanan_kunci(int $id): array
{
    $o = db_satu('SELECT id, pembeli_id, status, lunas FROM pesanan WHERE id = ? FOR UPDATE', [$id]);
    if ($o === null) {
        throw new GalatHttp(404, 'Pesanan tidak ditemukan.');
    }
    return $o;
}

/* batalkan dan kembalikan stok; dipanggil dalam transaksi dengan baris pesanan terkunci */
function pesanan_batalkan_inti(int $id, string $alasan): void
{
    foreach (db_semua('SELECT produk_id, jumlah FROM pesanan_item WHERE pesanan_id = ? ORDER BY produk_id', [$id]) as $i) {
        db_semua('UPDATE produk SET stok = stok + ? WHERE id = ? RETURNING id', [$i['jumlah'], $i['produk_id']]);
    }
    db_semua("UPDATE pesanan SET status = 'Dibatalkan', alasan_batal = ?, dibatalkan_pada = now() WHERE id = ? RETURNING id",
        [$alasan, $id]);
}

/* POST /api/pesanan/{id}/batal  {alasan?} */
function pesanan_batal(string $id): void
{
    $u = wajib_login();
    $in = $_SERVER['CONTENT_TYPE'] ?? '' ? baca_json() : [];
    transaksi(function () use ($id, $u, $in): void {
        $o = pesanan_kunci((int) $id);
        if ($u['role'] === 'pembeli' && (int) $o['pembeli_id'] !== (int) $u['id']) {
            throw new GalatHttp(404, 'Pesanan tidak ditemukan.');
        }
        if ($o['status'] === 'Dibatalkan' || $o['status'] === 'Selesai') {
            throw new GalatHttp(409, "Pesanan yang sudah {$o['status']} tidak bisa dibatalkan.");
        }
        if ($u['role'] === 'pembeli') {
            if ($o['status'] !== 'Menunggu' || $o['lunas']) {
                throw new GalatHttp(409, 'Pesanan tidak dapat dibatalkan setelah diproses atau dibayar.');
            }
            $alasan = 'Dibatalkan pembeli';
        } else {
            $alasan = trim((string) ($in['alasan'] ?? '')) ?: 'Dibatalkan oleh toko';
            if (strlen($alasan) > 200) {
                throw new GalatHttp(400, 'Alasan terlalu panjang.');
            }
        }
        pesanan_batalkan_inti((int) $id, $alasan);
    });
    kirim_json(pesanan_milik((int) $id, $u));
}

/* POST /api/pesanan/{id}/bayar — staff/admin mengonfirmasi pembayaran */
function pesanan_bayar(string $id): void
{
    $u = wajib_peran('staff', 'admin');
    transaksi(function () use ($id, $u): void {
        $o = pesanan_kunci((int) $id);
        if ($o['status'] === 'Dibatalkan') {
            throw new GalatHttp(409, 'Pesanan ini sudah dibatalkan.');
        }
        if ($o['lunas']) {
            throw new GalatHttp(409, 'Pesanan ini sudah dibayar.');
        }
        db_semua("UPDATE pesanan SET lunas = true, staff_id = ?, dibayar_pada = now(),
                  status = CASE WHEN status = 'Menunggu' THEN 'Diproses' ELSE status END
                  WHERE id = ? RETURNING id", [$u['id'], $id]);
    });
    kirim_json(pesanan_milik((int) $id, $u));
}

/* POST /api/pesanan/{id}/status  {status} — hanya maju satu tahap, dan hanya bila sudah lunas */
function pesanan_status(string $id): void
{
    $u = wajib_peran('staff', 'admin');
    $tujuan = (string) (baca_json()['status'] ?? '');
    transaksi(function () use ($id, $tujuan): void {
        $o = pesanan_kunci((int) $id);
        $tahap = array_search($o['status'], ALUR_STATUS, true);
        if ($tahap === false) {
            throw new GalatHttp(409, 'Pesanan ini tidak bisa diubah statusnya.');
        }
        if (!$o['lunas']) {
            throw new GalatHttp(409, 'Pesanan harus lunas sebelum diproses.');
        }
        if (($ALUR_BERIKUT = ALUR_STATUS[$tahap + 1] ?? null) === null || $tujuan !== $ALUR_BERIKUT) {
            throw new GalatHttp(409, 'Status hanya boleh maju satu tahap sesuai urutan.');
        }
        db_semua('UPDATE pesanan SET status = ? WHERE id = ? RETURNING id', [$tujuan, $id]);
    });
    kirim_json(pesanan_milik((int) $id, $u));
}

/* batalkan pesanan Menunggu yang belum dibayar lewat batas waktu; mengembalikan jumlah yang dibatalkan.
   Dipanggil cron tiap jam (backend/cron/batal_kedaluwarsa.php) dan saat daftar pesanan dibuka. */
function batalkan_kedaluwarsa(): int
{
    $ids = db_semua("SELECT id FROM pesanan WHERE status = 'Menunggu' AND NOT lunas
                     AND dibuat < now() - make_interval(days => ?)", [HARI_TAHAN]);
    $n = 0;
    foreach ($ids as $r) {
        transaksi(function () use ($r, &$n): void {
            $o = pesanan_kunci((int) $r['id']);
            if ($o['status'] === 'Menunggu' && !$o['lunas']) { // periksa ulang setelah terkunci
                pesanan_batalkan_inti((int) $r['id'], 'Tidak dibayar dalam ' . HARI_TAHAN . ' hari');
                $n++;
            }
        });
    }
    return $n;
}

/* POST /api/pesanan/{id}/bukti — multipart, field "bukti" (JPG/PNG/WebP) */
function pesanan_bukti(string $id): void
{
    $u = wajib_peran('pembeli');
    $o = pesanan_milik((int) $id, $u);
    if ($o['bayar'] !== 'Transfer ke admin') {
        throw new GalatHttp(409, 'Pesanan ini tidak dibayar lewat transfer.');
    }
    if ($o['lunas'] || $o['status'] === 'Dibatalkan') {
        throw new GalatHttp(409, 'Bukti tidak bisa diunggah untuk pesanan yang sudah dibayar atau dibatalkan.');
    }
    $nama = simpan_unggahan('bukti', 'bukti');
    $lama = db_satu('SELECT bukti FROM pesanan WHERE id = ?', [$id])['bukti'] ?? null;
    db_semua('UPDATE pesanan SET bukti = ?, bukti_pada = now() WHERE id = ? RETURNING id', [$nama, $id]);
    if ($lama) {
        hapus_berkas('bukti', (string) $lama);
    }
    kirim_json(pesanan_milik((int) $id, $u));
}
