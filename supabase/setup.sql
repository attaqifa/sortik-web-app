-- ============================================================
-- SORTIK — setup Supabase (jalankan SEKALI di SQL Editor)
-- Isi: skema tabel kosong + RLS baca-saja + storage + trigger profil
-- PERINGATAN: bagian awal mengosongkan schema public — jalankan
-- hanya di project Supabase baru yang belum dipakai.
-- ============================================================

-- ---------- 0. reset schema public (project baru saja!) ----------
drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all tables in schema public to postgres, service_role;

-- ---------- 1. tabel utama ----------

-- kategori produk (id = slug text, mis. "handphone")
create table public.kategori (
  id     text primary key,
  nama   text not null,
  ikon   text not null default '',      -- emoji
  lucide text not null default '',      -- nama ikon lucide
  urutan int  not null default 0
);

-- pengaturan toko — SATU baris (id selalu 1)
create table public.toko (
  id        int primary key default 1 check (id = 1),
  nama      text    not null default 'Toko SORTIK',
  alamat    text    not null default '',
  jam       text    not null default '',
  wa        text    not null default '',           -- format 62...
  ongkir    numeric not null default 0,
  rekening  jsonb   not null default '[]'          -- [{bank, nomor, atasNama}]
);

-- denah toko: konfigurasi global rak
create table public.rak_konfig (
  id           int primary key default 1 check (id = 1),
  grid         int not null default 28,            -- ukuran kotak (px)
  lantai_aktif bigint not null default 1
);

-- denah toko: lantai
create table public.lantai (
  id         bigint generated always as identity primary key,
  nama       text not null default 'Lantai 1',
  lebar      int  not null default 24,             -- satuan kotak grid
  tinggi     int  not null default 18,
  pintu_sisi text not null default 'bawah' check (pintu_sisi in ('atas','bawah','kiri','kanan')),
  pintu_pos  int  not null default 0,
  urutan     int  not null default 0
);

-- denah toko: rak dalam satu lantai
create table public.rak (
  id        bigint generated always as identity primary key,
  lantai_id bigint not null references public.lantai(id) on delete cascade,
  kode      text not null,                          -- mis. "A1"
  x         int not null default 0,
  y         int not null default 0,
  w         int not null default 4,
  h         int not null default 2,
  unique (lantai_id, kode)
);

-- denah toko: blok/halangan (kasir, lift, tembok, ...)
create table public.blok (
  id        bigint generated always as identity primary key,
  lantai_id bigint not null references public.lantai(id) on delete cascade,
  nama      text not null default '',
  x         int not null default 0,
  y         int not null default 0,
  w         int not null default 4,
  h         int not null default 2
);

-- produk — rak disimpan sebagai kode text (desain lama dipertahankan)
create table public.produk (
  id        bigint generated always as identity primary key,
  nama      text    not null,
  kategori  text    references public.kategori(id) on delete set null,
  harga     numeric not null default 0,
  diskon    int     not null default 0,            -- persen; 0 = tanpa diskon
  stok      int     not null default 0,
  rak       text    not null default '',
  ikon      text    not null default '',           -- emoji fallback
  foto      text    not null default '',           -- URL (storage atau internet)
  deskripsi text    not null default ''
);

-- profil pengguna — menempel ke akun Supabase Auth
create table public.profil (
  id       uuid primary key references auth.users(id) on delete cascade,
  nama     text not null default '',
  email    text not null default '',
  role     text not null default 'pembeli' check (role in ('pembeli','staff','admin')),
  status   text not null default 'aktif' check (status in ('aktif','nonaktif')),
  telepon  text not null default '',
  alamat   text not null default '',
  avatar   text not null default '',               -- path di storage bucket "foto"
  ikon     text not null default '🧑',
  dibuat   timestamptz not null default now()
);

-- pesanan
create table public.pesanan (
  id         bigint generated always as identity primary key,
  produk_id  bigint not null references public.produk(id) on delete restrict,
  pembeli_id uuid   references auth.users(id) on delete set null,   -- penghubung akun
  pembeli    text   not null default '',        -- snapshot nama untuk tampilan
  jumlah     int    not null default 1,
  status     text   not null default 'Menunggu'
             check (status in ('Menunggu','Diproses','Siap','Selesai')),
  tanggal    date   not null default current_date,
  cara       text   not null default 'ambil' check (cara in ('ambil','antar')),
  bayar      text   not null default '',
  alamat     text   not null default '',
  lunas      boolean not null default false,
  staff      text   not null default ''
);

-- pesan grup (obrolan admin & staff)
create table public.pesan (
  id     bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  dari   text not null default '',             -- nama pengirim
  peran  text not null default 'staff' check (peran in ('pembeli','staff','admin')),
  teks   text not null,
  waktu  timestamptz not null default now()
);

-- keuangan: pengeluaran manual (pendapatan dihitung dari pesanan lunas)
create table public.pengeluaran (
  id         bigint generated always as identity primary key,
  tanggal    date    not null default current_date,
  keterangan text    not null,
  kategori   text    not null default 'Operasional',
  jumlah     numeric not null default 0
);

-- indeks kecil untuk query yang sering dipakai
create index on public.pesanan (pembeli_id);
create index on public.pesanan (status);
create index on public.pesan (waktu);
create index on public.produk (kategori);

-- ---------- 2. tabel sengaja dibuat kosong ----------
-- Isi data toko sendiri lewat Supabase Table Editor setelah setup selesai.

-- ---------- 3. profil otomatis untuk tiap pendaftar ----------
-- setiap akun baru di Supabase Auth langsung dapat baris profil (role pembeli)
create or replace function public.buat_profil_baru()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profil (id, nama, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
          new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.buat_profil_baru();

-- ---------- 4. fungsi bantu peran (dipakai kebijakan RLS) ----------
create or replace function public.peran_saya()
returns text language sql stable as $$
  select role from public.profil where id = auth.uid()
$$;

create or replace function public.staf_atau_admin()
returns boolean language sql stable as $$
  select coalesce(public.peran_saya() in ('staff','admin'), false)
$$;

create or replace function public.hanya_admin()
returns boolean language sql stable as $$
  select coalesce(public.peran_saya() = 'admin', false)
$$;

-- ---------- 5. keamanan: aktifkan RLS + kebijakan ----------

alter table public.kategori     enable row level security;
alter table public.toko         enable row level security;
alter table public.rak_konfig   enable row level security;
alter table public.lantai       enable row level security;
alter table public.rak          enable row level security;
alter table public.blok         enable row level security;
alter table public.produk       enable row level security;
alter table public.profil       enable row level security;
alter table public.pesanan      enable row level security;
alter table public.pesan        enable row level security;
alter table public.pengeluaran  enable row level security;

-- katalog & denah: boleh dibaca siapa pun (termasuk belum login).
-- Penulisan dilakukan manual lewat Dashboard Supabase, bukan aplikasi.
create policy "katalog baca publik" on public.kategori   for select to anon, authenticated using (true);
create policy "denah baca publik"   on public.rak_konfig for select to anon, authenticated using (true);
create policy "lantai baca publik"  on public.lantai     for select to anon, authenticated using (true);
create policy "rak baca publik"     on public.rak        for select to anon, authenticated using (true);
create policy "blok baca publik"    on public.blok       for select to anon, authenticated using (true);
create policy "produk baca publik"  on public.produk     for select to anon, authenticated using (true);
create policy "toko baca publik"    on public.toko       for select to anon, authenticated using (true);
-- Website aplikasi sengaja hanya-baca. Data toko dikelola lewat Table Editor
-- memakai akun pemilik project Supabase.

-- pesanan: pembeli hanya melihat pesanan miliknya; staff/admin dapat melihat semua.
-- Aplikasi tidak memiliki izin insert/update/delete.
create policy "pesanan lihat milik sendiri" on public.pesanan for select to authenticated
  using (pembeli_id = auth.uid() or public.staf_atau_admin());
-- pesan grup: hanya admin & staff (obrolan internal toko)
create policy "pesan baca staf"   on public.pesan for select to authenticated using (public.staf_atau_admin());
-- Keuangan internal: hanya dapat dibaca staff/admin.
create policy "pengeluaran baca staf" on public.pengeluaran for select to authenticated using (public.staf_atau_admin());

-- profil: pemilik dapat melihat profilnya; admin melihat semua.
-- Profil baru dibuat otomatis oleh trigger; penulisan manual lewat Dashboard.
create policy "profil lihat sendiri" on public.profil for select to authenticated
  using (id = auth.uid() or public.staf_atau_admin());
-- ---------- 6. storage foto (produk & avatar) ----------
insert into storage.buckets (id, name, public)
values ('foto', 'foto', true)
on conflict (id) do nothing;

create policy "foto baca publik" on storage.objects
  for select to anon, authenticated using (bucket_id = 'foto');

-- Tidak ada policy unggah/ganti: storage juga baca-saja dari aplikasi.

-- ---------- 7. realtime untuk pesan grup (obrolan langsung) ----------
do $$
begin
  alter publication supabase_realtime add table public.pesan;
exception when duplicate_object then null;
end $$;

-- ---------- 8. grant ulang ----------
-- Bagian awal skrip menjalankan GRANT sebelum tabel ada (jadi nihil) dan
-- drop schema sempat menghapus izin bawaan. Ulangi grant di sini, setelah
-- semua tabel + kolom id identity sudah terbentuk.
grant usage on schema public to postgres, anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;

-- izin untuk tabel yang dibuat nanti (mis. saat rebuild)
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant all on tables to postgres, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, service_role;
alter default privileges in schema public
  grant all on functions to postgres, service_role;
