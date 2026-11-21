<?php
declare(strict_types=1);

/* Pengelolaan data toko oleh staff/admin: foto, produk, kategori, rak, toko;
   admin saja: pengguna. Profil sendiri: PATCH /saya. */

/* ---------- validasi kecil ---------- */
function teks_wajib(array $in, string $k, string $label, int $maks): string
{
    $v = trim((string) ($in[$k] ?? ''));
    if ($v === '') {
        throw new GalatHttp(400, "{$label} wajib diisi.");
    }
    if (strlen($v) > $maks) {
        throw new GalatHttp(400, "{$label} terlalu panjang.");
    }
    return $v;
}
function teks_opsi(array $in, string $k, string $label, int $maks): string
{
    $v = trim((string) ($in[$k] ?? ''));
    if (strlen($v) > $maks) {
        throw new GalatHttp(400, "{$label} terlalu panjang.");
    }
    return $v;
}
function angka_rentang(array $in, string $k, string $label, int $min, int $maks): int
{
    $v = $in[$k] ?? null;
    if (is_string($v) && preg_match('/^-?\d{1,10}$/', $v)) {
        $v = (int) $v;
    }
    if (!is_int($v) || $v < $min || $v > $maks) {
        throw new GalatHttp(400, "{$label} harus bilangan bulat {$min}–{$maks}.");
    }
    return $v;
}
/* daftar teks → literal array PostgreSQL ({"a","b"}) untuk = ANY(?::text[]) */
function larik_pg(array $nilai): string
{
    return '{' . implode(',', array_map(fn($v) => '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $v) . '"', $nilai)) . '}';
}

/* ---------- foto ---------- */
/* nilai foto dari klien → yang disimpan: nama berkas unggahan atau tautan https. '' = kosong. */
function foto_simpanan(mixed $v): string
{
    $v = is_string($v) ? trim($v) : '';
    if ($v === '') {
        return '';
    }
    if (preg_match('#^https://[^\s]{1,480}$#i', $v)) {
        return $v;
    }
    if (preg_match('#^/api/berkas/foto/([\w-]{1,64}\.(?:jpg|png|webp))$#', $v, $m)
        && berkas_ada('foto', $m[1])) {
        return $m[1];
    }
    throw new GalatHttp(400, 'Foto harus berupa tautan https:// atau hasil unggahan.');
}

/* hapus berkas foto yang tidak dipakai lagi oleh produk, toko, atau pengguna mana pun */
function bersihkan_foto(array $kandidat): void
{
    foreach (array_unique($kandidat) as $b) {
        if ($b === '' || preg_match('#^https?://#i', $b)) {
            continue;
        }
        $pakai = db_satu('SELECT 1 FROM produk_foto WHERE berkas = ? UNION ALL SELECT 1 FROM toko WHERE logo = ?
                          UNION ALL SELECT 1 FROM pengguna WHERE avatar = ?', [$b, $b, $b]);
        if ($pakai === null) {
            hapus_berkas('foto', $b);
        }
    }
}

/* POST /api/berkas/foto — multipart "berkas"; mengembalikan {url} untuk dipakai di form produk/logo */
function foto_unggah(): void
{
    wajib_peran('staff', 'admin');
    kirim_json(['url' => '/api/berkas/foto/' . simpan_unggahan('berkas', 'foto')], 201);
}

/* ---------- produk ---------- */
function produk_baca_input(array $in): array
{
    $kat = trim((string) ($in['kategori'] ?? ''));
    if ($kat === '' || db_satu('SELECT 1 FROM kategori WHERE id = ?', [$kat]) === null) {
        throw new GalatHttp(400, 'Pilih kategori yang valid.');
    }
    $rak = trim((string) ($in['rak'] ?? ''));
    if ($rak !== '' && db_satu('SELECT 1 FROM rak WHERE kode = ?', [$rak]) === null) {
        throw new GalatHttp(400, 'Rak tidak dikenal.');
    }
    $galeri = $in['galeri'] ?? [];
    if (!is_array($galeri) || count($galeri) > 10) {
        throw new GalatHttp(400, 'Foto detail maksimal 10.');
    }
    $foto = array_values(array_filter([foto_simpanan($in['foto'] ?? ''), ...array_map('foto_simpanan', $galeri)], fn($f) => $f !== ''));
    return [
        'nama' => teks_wajib($in, 'nama', 'Nama barang', 150),
        'kategori' => $kat,
        'harga' => angka_rentang($in, 'harga', 'Harga', 0, 2000000000),
        'diskon' => angka_rentang($in, 'diskon', 'Diskon', 0, 100),
        'stok' => angka_rentang($in, 'stok', 'Stok', 0, 1000000),
        'rak' => $rak === '' ? null : $rak,
        'deskripsi' => teks_opsi($in, 'deskripsi', 'Deskripsi', 4000),
        'foto' => $foto,
    ];
}

function produk_tulis_foto(int $id, array $foto): void
{
    db_semua('DELETE FROM produk_foto WHERE produk_id = ? RETURNING id', [$id]);
    foreach ($foto as $i => $b) {
        db_semua('INSERT INTO produk_foto (produk_id, berkas, utama, urutan) VALUES (?, ?, ?, ?) RETURNING id',
            [$id, $b, $i === 0 ? 'true' : 'false', $i]);
    }
}

/* POST /api/produk */
function produk_buat(): void
{
    wajib_peran('staff', 'admin');
    $d = produk_baca_input(baca_json());
    $id = transaksi(function () use ($d): int {
        $p = db_satu('INSERT INTO produk (nama, kategori_id, harga, diskon, stok, rak_kode, deskripsi)
                      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
            [$d['nama'], $d['kategori'], $d['harga'], $d['diskon'], $d['stok'], $d['rak'], $d['deskripsi']]);
        produk_tulis_foto((int) $p['id'], $d['foto']);
        return (int) $p['id'];
    });
    kirim_json(produk_muat($id)[0], 201);
}

/* PUT /api/produk/{id} */
function produk_ubah(string $id): void
{
    wajib_peran('staff', 'admin');
    $id = (int) $id;
    $d = produk_baca_input(baca_json());
    $lama = array_column(db_semua('SELECT berkas FROM produk_foto WHERE produk_id = ?', [$id]), 'berkas');
    transaksi(function () use ($id, $d): void {
        $n = db_satu('UPDATE produk SET nama = ?, kategori_id = ?, harga = ?, diskon = ?, stok = ?, rak_kode = ?, deskripsi = ?
                      WHERE id = ? RETURNING id',
            [$d['nama'], $d['kategori'], $d['harga'], $d['diskon'], $d['stok'], $d['rak'], $d['deskripsi'], $id]);
        if ($n === null) {
            throw new GalatHttp(404, 'Barang tidak ditemukan.');
        }
        produk_tulis_foto($id, $d['foto']);
    });
    bersihkan_foto($lama);
    kirim_json(produk_muat($id)[0]);
}

/* PUT /api/produk/{id}/rak  {rak} — pindah rak (halaman Tata Rak) */
function produk_pindah_rak(string $id): void
{
    wajib_peran('staff', 'admin');
    $rak = trim((string) (baca_json()['rak'] ?? ''));
    if ($rak === '' || db_satu('SELECT 1 FROM rak WHERE kode = ?', [$rak]) === null) {
        throw new GalatHttp(400, 'Rak tidak dikenal.');
    }
    if (db_satu('UPDATE produk SET rak_kode = ? WHERE id = ? RETURNING id', [$rak, (int) $id]) === null) {
        throw new GalatHttp(404, 'Barang tidak ditemukan.');
    }
    kirim_json(produk_muat((int) $id)[0]);
}

/* DELETE /api/produk/{id} — ditolak bila sudah ada di pesanan (riwayat harus utuh) */
function produk_hapus(string $id): void
{
    wajib_peran('staff', 'admin');
    $id = (int) $id;
    if (db_satu('SELECT 1 FROM pesanan_item WHERE produk_id = ?', [$id]) !== null) {
        throw new GalatHttp(409, 'Barang ini sudah ada di riwayat pesanan. Kosongkan stoknya saja bila tidak dijual lagi.');
    }
    $lama = array_column(db_semua('SELECT berkas FROM produk_foto WHERE produk_id = ?', [$id]), 'berkas');
    if (db_satu('DELETE FROM produk WHERE id = ? RETURNING id', [$id]) === null) {
        throw new GalatHttp(404, 'Barang tidak ditemukan.');
    }
    bersihkan_foto($lama);
    kirim_json(['ok' => true]);
}

/* ---------- kategori ---------- */
function slug(string $s): string
{
    return trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower($s)), '-');
}
function kategori_baca_input(array $in): array
{
    return [teks_wajib($in, 'nama', 'Nama kategori', 60), teks_opsi($in, 'lucide', 'Ikon', 40) ?: 'tag'];
}
/* POST /api/kategori */
function kategori_buat(): void
{
    wajib_peran('staff', 'admin');
    [$nama, $ikon] = kategori_baca_input(baca_json());
    $id = slug($nama);
    if ($id === '') {
        throw new GalatHttp(400, 'Nama kategori harus berisi huruf atau angka.');
    }
    if (db_satu('SELECT 1 FROM kategori WHERE id = ?', [$id]) !== null) {
        throw new GalatHttp(409, "Kategori \"{$nama}\" sudah ada.");
    }
    db_semua('INSERT INTO kategori (id, nama, lucide, urutan) VALUES (?, ?, ?, (SELECT COALESCE(MAX(urutan), 0) + 1 FROM kategori)) RETURNING id',
        [$id, $nama, $ikon]);
    kirim_json(['id' => $id, 'nama' => $nama, 'lucide' => $ikon, 'ikon' => ''], 201);
}
/* PUT /api/kategori/{id} */
function kategori_ubah(string $id): void
{
    wajib_peran('staff', 'admin');
    $id = rawurldecode($id);
    [$nama, $ikon] = kategori_baca_input(baca_json());
    if (db_satu('UPDATE kategori SET nama = ?, lucide = ? WHERE id = ? RETURNING id', [$nama, $ikon, $id]) === null) {
        throw new GalatHttp(404, 'Kategori tidak ditemukan.');
    }
    kirim_json(['id' => $id, 'nama' => $nama, 'lucide' => $ikon, 'ikon' => '']);
}
/* DELETE /api/kategori/{id} */
function kategori_hapus(string $id): void
{
    wajib_peran('staff', 'admin');
    $id = rawurldecode($id);
    if (db_satu('SELECT 1 FROM produk WHERE kategori_id = ?', [$id]) !== null) {
        throw new GalatHttp(409, 'Kategori masih dipakai barang — pindahkan dulu barangnya ke kategori lain.');
    }
    if (db_satu('DELETE FROM kategori WHERE id = ? RETURNING id', [$id]) === null) {
        throw new GalatHttp(404, 'Kategori tidak ditemukan.');
    }
    kirim_json(['ok' => true]);
}

/* ---------- pengguna (admin) ---------- */
const BARIS_PENGGUNA = "id, nama, email, role, status, telepon, alamat, COALESCE(avatar, '') AS avatar";
function pengguna_tampil(array $u): array
{
    $u['avatar'] = $u['avatar'] ? foto_url($u['avatar']) : '';
    return $u;
}
function pengguna_baca_input(array $in, bool $baru): array
{
    $email = strtolower(teks_wajib($in, 'email', 'Email', 254));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new GalatHttp(400, 'Format email tidak valid.');
    }
    $role = (string) ($in['role'] ?? '');
    $status = (string) ($in['status'] ?? 'aktif');
    if (!in_array($role, ['pembeli', 'staff', 'admin'], true) || !in_array($status, ['aktif', 'nonaktif'], true)) {
        throw new GalatHttp(400, 'Peran atau status tidak valid.');
    }
    $sandi = (string) ($in['sandi'] ?? '');
    if (($baru || $sandi !== '') && (strlen($sandi) < 8 || strlen($sandi) > 200)) {
        throw new GalatHttp(400, 'Kata sandi minimal 8 karakter.');
    }
    return ['nama' => teks_wajib($in, 'nama', 'Nama', 100), 'email' => $email, 'role' => $role, 'status' => $status, 'sandi' => $sandi];
}
/* GET /api/pengguna */
function pengguna_daftar(): void
{
    wajib_peran('admin');
    kirim_json(array_map('pengguna_tampil', db_semua('SELECT ' . BARIS_PENGGUNA . ' FROM pengguna ORDER BY nama')));
}
/* POST /api/pengguna */
function pengguna_buat(): void
{
    wajib_peran('admin');
    $d = pengguna_baca_input(baca_json(), true);
    if (db_satu('SELECT 1 FROM pengguna WHERE lower(email) = ?', [$d['email']]) !== null) {
        throw new GalatHttp(409, 'Email sudah dipakai akun lain.');
    }
    $u = db_satu('INSERT INTO pengguna (nama, email, sandi_hash, role, status) VALUES (?, ?, ?, ?, ?) RETURNING ' . BARIS_PENGGUNA,
        [$d['nama'], $d['email'], password_hash($d['sandi'], PASSWORD_ARGON2ID), $d['role'], $d['status']]);
    kirim_json(pengguna_tampil($u), 201);
}
/* admin tidak boleh mengunci dirinya sendiri (turun peran, nonaktif, atau hapus) */
function jaga_diri(int $id, ?array $baru, array $saya): void
{
    if ($id === (int) $saya['id'] && ($baru === null || $baru['role'] !== 'admin' || $baru['status'] !== 'aktif')) {
        throw new GalatHttp(409, 'Anda tidak bisa menurunkan, menonaktifkan, atau menghapus akun Anda sendiri.');
    }
}
/* PUT /api/pengguna/{id} */
function pengguna_ubah(string $id): void
{
    $saya = wajib_peran('admin');
    $id = (int) $id;
    $d = pengguna_baca_input(baca_json(), false);
    if (db_satu('SELECT 1 FROM pengguna WHERE id = ?', [$id]) === null) {
        throw new GalatHttp(404, 'Pengguna tidak ditemukan.');
    }
    jaga_diri($id, $d, $saya);
    if (db_satu('SELECT 1 FROM pengguna WHERE lower(email) = ? AND id <> ?', [$d['email'], $id]) !== null) {
        throw new GalatHttp(409, 'Email sudah dipakai akun lain.');
    }
    $u = db_satu('UPDATE pengguna SET nama = ?, email = ?, role = ?, status = ? WHERE id = ? RETURNING ' . BARIS_PENGGUNA,
        [$d['nama'], $d['email'], $d['role'], $d['status'], $id]);
    if ($d['sandi'] !== '') {
        db_semua('UPDATE pengguna SET sandi_hash = ? WHERE id = ? RETURNING id', [password_hash($d['sandi'], PASSWORD_ARGON2ID), $id]);
    }
    kirim_json(pengguna_tampil($u));
}
/* DELETE /api/pengguna/{id} — akun yang punya riwayat transaksi hanya bisa dinonaktifkan */
function pengguna_hapus(string $id): void
{
    $saya = wajib_peran('admin');
    $id = (int) $id;
    jaga_diri($id, null, $saya);
    if (db_satu('SELECT 1 FROM pesanan WHERE pembeli_id = ? OR staff_id = ?', [$id, $id]) !== null
        || db_satu('SELECT 1 FROM pengeluaran WHERE dicatat_oleh = ?', [$id]) !== null) {
        throw new GalatHttp(409, 'Akun ini punya riwayat transaksi. Nonaktifkan saja agar riwayat tetap utuh.');
    }
    $lama = db_satu("DELETE FROM pengguna WHERE id = ? RETURNING COALESCE(avatar, '') AS avatar", [$id]);
    if ($lama === null) {
        throw new GalatHttp(404, 'Pengguna tidak ditemukan.');
    }
    bersihkan_foto([$lama['avatar']]);
    kirim_json(['ok' => true]);
}

/* ---------- profil sendiri ---------- */
/* PATCH /api/saya  {nama, telepon, alamat, avatar?} — avatar hanya boleh "" (hapus); unggah lewat POST /saya/avatar */
function saya_ubah(): void
{
    $u = wajib_login();
    $in = baca_json();
    $lama = (string) ($u['avatar'] ?? '');
    $hapus = ($in['avatar'] ?? null) === '';
    $baru = db_satu('UPDATE pengguna SET nama = ?, telepon = ?, alamat = ?, avatar = ? WHERE id = ? RETURNING *',
        [teks_wajib($in, 'nama', 'Nama', 100), teks_opsi($in, 'telepon', 'Telepon', 30),
         teks_opsi($in, 'alamat', 'Alamat', 500), $hapus ? null : ($lama === '' ? null : $lama), $u['id']]);
    if ($hapus && $lama !== '') {
        bersihkan_foto([$lama]);
    }
    kirim_json(['user' => pengguna_publik($baru)]);
}
/* POST /api/saya/avatar — multipart "berkas" */
function saya_avatar(): void
{
    $u = wajib_login();
    $lama = (string) ($u['avatar'] ?? '');
    $nama = simpan_unggahan('berkas', 'foto');
    $baru = db_satu('UPDATE pengguna SET avatar = ? WHERE id = ? RETURNING *', [$nama, $u['id']]);
    bersihkan_foto([$lama]);
    kirim_json(['user' => pengguna_publik($baru)]);
}

/* ---------- toko (admin) ---------- */
/* PUT /api/toko  {nama, alamat, jam, wa, ongkir, logo, rekening:[{bank,nomor,atasNama}]} */
function toko_ubah(): void
{
    wajib_peran('admin');
    $in = baca_json();
    $rek = $in['rekening'] ?? [];
    if (!is_array($rek) || count($rek) > 10) {
        throw new GalatHttp(400, 'Rekening maksimal 10.');
    }
    $lama = (string) (db_satu("SELECT COALESCE(logo, '') AS logo FROM toko WHERE id = 1")['logo'] ?? '');
    $logo = foto_simpanan($in['logo'] ?? '');
    transaksi(function () use ($in, $rek, $logo): void {
        db_semua('UPDATE toko SET nama = ?, alamat = ?, jam = ?, wa = ?, ongkir = ?, logo = ? WHERE id = 1 RETURNING id',
            [teks_wajib($in, 'nama', 'Nama toko', 100), teks_opsi($in, 'alamat', 'Alamat', 300), teks_opsi($in, 'jam', 'Jam buka', 100),
             preg_replace('/\D/', '', (string) ($in['wa'] ?? '')), angka_rentang($in, 'ongkir', 'Ongkir', 0, 10000000),
             $logo === '' ? null : $logo]);
        db_semua('DELETE FROM rekening RETURNING id');
        foreach ($rek as $r) {
            $r = is_array($r) ? $r : [];
            db_semua('INSERT INTO rekening (bank, nomor, atas_nama) VALUES (?, ?, ?) RETURNING id',
                [teks_wajib($r, 'bank', 'Nama bank', 60), teks_opsi($r, 'nomor', 'Nomor rekening', 40), teks_opsi($r, 'atasNama', 'Atas nama', 100)]);
        }
    });
    bersihkan_foto([$lama]);
    toko_baca();
}

/* ---------- denah rak ---------- */
/* PUT /api/rak  {lantai:[{id?, nama, lebar, tinggi, pintu:{sisi,pos}, daftar:[{kode,x,y,w,h}], area:[{nama,x,y,w,h}]}]}
   Menyimpan seluruh denah sekaligus. Mengembalikan {lantai:[id,…]} sesuai urutan kiriman. */
function rak_simpan(): void
{
    wajib_peran('staff', 'admin');
    $lantai = baca_json()['lantai'] ?? null;
    if (!is_array($lantai) || !$lantai || count($lantai) > 10) {
        throw new GalatHttp(400, 'Denah harus berisi 1–10 lantai.');
    }
    $ids = transaksi(function () use ($lantai): array {
        db_semua('LOCK TABLE rak, lantai, area IN SHARE ROW EXCLUSIVE MODE');
        $ids = [];
        $kodeAda = [];
        foreach (array_values($lantai) as $urutan => $l) {
            $l = is_array($l) ? $l : [];
            $pintu = is_array($l['pintu'] ?? null) ? $l['pintu'] : [];
            $sisi = (string) ($pintu['sisi'] ?? '');
            if (!in_array($sisi, ['atas', 'bawah', 'kiri', 'kanan'], true)) {
                throw new GalatHttp(400, 'Sisi pintu tidak valid.');
            }
            $nilai = [teks_wajib($l, 'nama', 'Nama lantai', 60), angka_rentang($l, 'lebar', 'Lebar', 1, 200),
                      angka_rentang($l, 'tinggi', 'Tinggi', 1, 200), $sisi, angka_rentang($pintu, 'pos', 'Posisi pintu', 0, 200), $urutan];
            $id = isset($l['id']) && is_int($l['id']) && db_satu('SELECT 1 FROM lantai WHERE id = ?', [$l['id']]) !== null ? $l['id'] : null;
            if ($id === null) {
                $id = (int) db_satu('INSERT INTO lantai (nama, lebar, tinggi, pintu_sisi, pintu_pos, urutan) VALUES (?, ?, ?, ?, ?, ?) RETURNING id', $nilai)['id'];
            } else {
                db_semua('UPDATE lantai SET nama = ?, lebar = ?, tinggi = ?, pintu_sisi = ?, pintu_pos = ?, urutan = ? WHERE id = ? RETURNING id', [...$nilai, $id]);
            }
            $ids[] = $id;
            foreach ($l['daftar'] ?? [] as $r) {
                $r = is_array($r) ? $r : [];
                $kode = teks_wajib($r, 'kode', 'Kode rak', 20);
                if (isset($kodeAda[$kode])) {
                    throw new GalatHttp(400, "Kode rak {$kode} dipakai dua kali.");
                }
                $kodeAda[$kode] = true;
                db_semua('INSERT INTO rak (kode, lantai_id, x, y, w, h) VALUES (?, ?, ?, ?, ?, ?)
                          ON CONFLICT (kode) DO UPDATE SET lantai_id = EXCLUDED.lantai_id, x = EXCLUDED.x, y = EXCLUDED.y, w = EXCLUDED.w, h = EXCLUDED.h
                          RETURNING kode',
                    [$kode, $id, angka_rentang($r, 'x', 'x', 0, 200), angka_rentang($r, 'y', 'y', 0, 200),
                     angka_rentang($r, 'w', 'Lebar rak', 1, 100), angka_rentang($r, 'h', 'Tinggi rak', 1, 100)]);
            }
        }
        /* rak yang dihapus dari denah: tolak bila masih berisi barang */
        $kode = larik_pg(array_keys($kodeAda));
        $pakai = db_satu('SELECT rak_kode FROM produk WHERE rak_kode IS NOT NULL AND NOT (rak_kode = ANY(?::text[])) LIMIT 1', [$kode]);
        if ($pakai !== null) {
            throw new GalatHttp(409, "Rak {$pakai['rak_kode']} masih berisi barang — pindahkan dulu isinya.");
        }
        db_semua('DELETE FROM rak WHERE NOT (kode = ANY(?::text[])) RETURNING kode', [$kode]);
        db_semua('DELETE FROM lantai WHERE NOT (id = ANY(?::int[])) RETURNING id', ['{' . implode(',', $ids) . '}']);
        db_semua('DELETE FROM area RETURNING id');
        foreach (array_values($lantai) as $i => $l) {
            foreach ($l['area'] ?? [] as $a) {
                $a = is_array($a) ? $a : [];
                db_semua('INSERT INTO area (lantai_id, nama, x, y, w, h) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
                    [$ids[$i], teks_opsi($a, 'nama', 'Nama blok', 60), angka_rentang($a, 'x', 'x', 0, 200), angka_rentang($a, 'y', 'y', 0, 200),
                     angka_rentang($a, 'w', 'Lebar blok', 1, 100), angka_rentang($a, 'h', 'Tinggi blok', 1, 100)]);
            }
        }
        return $ids;
    });
    kirim_json(['lantai' => $ids]);
}
