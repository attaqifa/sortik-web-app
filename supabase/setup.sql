-- ============================================================
-- SORTIK — setup Supabase (jalankan SEKALI di SQL Editor)
-- Isi: skema tabel + data contoh + RLS + storage + trigger profil
-- PERINGATAN: bagian awal mengosongkan schema public — jalankan
-- hanya di project Supabase baru yang belum dipakai.
-- ============================================================

-- ---------- 0. reset schema public (project baru saja!) ----------
drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;

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

-- ---------- 2. data contoh (seed) ----------

insert into public.kategori (id, nama, ikon, lucide, urutan) values
  ('handphone', 'Handphone',     '📱', 'smartphone',       1),
  ('laptop',    'Laptop',        '💻', 'laptop',           2),
  ('washer',    'Washer',        '🫧', 'washing-machine',  3),
  ('wearable',  'Wearable Tech', '⌚', 'watch',            4),
  ('audio',     'Audio',         '🎧', 'headphones',       5);

insert into public.toko (id, nama, alamat, jam, wa, ongkir, rekening) values
  (1, 'Toko SORTIK', 'Jl. Elektronik No. 21, Kota Bandung',
   'Senin–Sabtu, 09.00–20.00 WIB', '6281200001122', 25000,
   '[{"bank":"BCA","nomor":"1234567890","atasNama":"Admin SORTIK"}]'::jsonb);

insert into public.rak_konfig (id, grid, lantai_aktif) values (1, 28, 1);

insert into public.lantai (id, nama, lebar, tinggi, pintu_sisi, pintu_pos, urutan)
OVERRIDING SYSTEM VALUE
values (1, 'Lantai 1', 24, 18, 'bawah', 11, 0);

-- rak A1..F4 (susunan awal SORTIK: 6 baris × 4 kolom)
insert into public.rak (lantai_id, kode, x, y, w, h) values
  (1,'A1', 0, 0,4,2),(1,'A2', 5, 0,4,2),(1,'A3',10, 0,4,2),(1,'A4',15, 0,4,2),
  (1,'B1', 0, 3,4,2),(1,'B2', 5, 3,4,2),(1,'B3',10, 3,4,2),(1,'B4',15, 3,4,2),
  (1,'C1', 0, 6,4,2),(1,'C2', 5, 6,4,2),(1,'C3',10, 6,4,2),(1,'C4',15, 6,4,2),
  (1,'D1', 0, 9,4,2),(1,'D2', 5, 9,4,2),(1,'D3',10, 9,4,2),(1,'D4',15, 9,4,2),
  (1,'E1', 0,12,4,2),(1,'E2', 5,12,4,2),(1,'E3',10,12,4,2),(1,'E4',15,12,4,2),
  (1,'F1', 0,15,4,2),(1,'F2', 5,15,4,2),(1,'F3',10,15,4,2),(1,'F4',15,15,4,2);

insert into public.produk (id, nama, kategori, harga, diskon, stok, rak, ikon, foto, deskripsi)
OVERRIDING SYSTEM VALUE values
  (1,'Samsung Galaxy A26 5G 8GB/256GB','handphone',4999000,0,12,'A1','📱','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=70','Ponsel 5G layar Super AMOLED 6,7 inci, RAM 8 GB, memori 256 GB, dan baterai 5.000 mAh.'),
  (2,'Vivo Y500 4G 8GB/256GB','handphone',5499000,10,8,'A2','📱','https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=600&q=70','Ponsel 4G dengan baterai jumbo 6.500 mAh, pengisian cepat 90W, dan layar 120 Hz.'),
  (3,'Apple iPhone 17 Pro Max','handphone',24499000,0,4,'A3','📱','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=70','Flagship Apple dengan chip A19 Pro, kamera utama 48 MP, dan bodi titanium.'),
  (4,'Xiaomi Redmi Note 14 5G','handphone',3199000,0,15,'A4','📱','https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=600&q=70','Ponsel 5G kelas menengah: layar AMOLED 120 Hz dan kamera 50 MP dengan OIS.'),
  (5,'Asus Vivobook 14 (i3/5)','laptop',6700000,0,6,'B1','💻','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=70','Laptop 14 inci untuk kerja harian dengan Intel Core i3, RAM 8 GB, dan SSD 512 GB.'),
  (6,'Acer Lite AL14 (Intel N100)','laptop',8050000,15,3,'B2','💻','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=70','Laptop ringan 14 inci dengan Intel N100 — hemat daya, cocok untuk sekolah dan kerja ringan.'),
  (7,'Samsung Galaxy Book4','laptop',9999000,5,5,'B3','💻','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=70','Laptop tipis 15,6 inci dengan Intel Core 5, layar anti-glare, dan baterai tahan seharian.'),
  (8,'Bosch Mesin Cuci Front Loading 8 KG','washer',7909000,0,4,'C1','🫧','https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=70','Mesin cuci front loading 8 kg dengan 15 program dan motor inverter yang senyap serta hemat listrik.'),
  (9,'Aqua Mesin Cuci 2 Tabung 8 Kg','washer',2299000,0,7,'C2','🫧','https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=70','Mesin cuci 2 tabung 8 kg dengan pengering 6 kg, tangguh untuk pemakaian harian.'),
  (10,'JBL Live Free 2 TWS','audio',1649500,20,10,'D1','🎧','https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=70','TWS JBL dengan hybrid noise cancelling, suara JBL Signature, dan daya tahan hingga 35 jam.'),
  (11,'Sony Personal Earphone TWS WF-C710N','audio',1509000,0,9,'D2','🎧','https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=70','Earphone TWS ringan dengan noise cancelling dan koneksi multipoint dua perangkat sekaligus.'),
  (12,'Roadmaster Speaker Aktif Partyflash28','audio',3278000,0,5,'D3','🔊','https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=70','Speaker aktif 28 inci dengan lampu LED, bluetooth, USB, dan mikrofon nirkabel untuk acara.'),
  (13,'KJB Passive Speaker 081-PA','audio',1429000,0,6,'D4','🔊','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=70','Speaker pasif 8 inci 150 watt untuk panggung dan ruang serbaguna.'),
  (14,'Roadmaster Speaker Aktif KD-Pro12USBST','audio',2021000,0,3,'E1','🔊','https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=600&q=70','Speaker aktif 12 inci serba bisa: bluetooth, USB/SD, dan dua input mikrofon.'),
  (15,'Polytron Speaker Aktif PAS8BF22','audio',2265000,0,4,'E2','🔊','https://images.unsplash.com/photo-1558537348-c0f8e733989d?auto=format&fit=crop&w=600&q=70','Speaker aktif 8 inci dengan fitur karaoke, bluetooth, dan remote control.'),
  (16,'Apple Watch SE (GPS 40mm)','wearable',3499000,0,6,'F1','⌚','https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=70','Smartwatch GPS 40 mm dengan deteksi detak jantung, pemantau tidur, dan tahan air 50 m.'),
  (17,'Xiaomi Redmi Watch 5','wearable',899000,0,11,'F2','⌚','https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70','Smartwatch layar AMOLED 2,07 inci, baterai hingga 20 hari, dan 150+ mode olahraga.');
select setval(pg_get_serial_sequence('public.produk','id'), 17);

-- pesanan contoh (pembeli_id diisi nanti setelah akun Rina dibuat — lihat bawah)
insert into public.pesanan (id, produk_id, pembeli, jumlah, status, tanggal, cara, bayar, alamat, lunas, staff)
OVERRIDING SYSTEM VALUE values
  (1, 1,'Rina Kartika',1,'Menunggu','2026-09-01','ambil','Transfer ke admin','',false,''),
  (2,10,'Rina Kartika',1,'Diproses','2026-08-27','antar','Transfer ke admin','Jl. Merdeka No. 8, Bandung',true,'Bagas Prasetyo'),
  (3,13,'Rina Kartika',1,'Siap','2026-08-03','ambil','Transfer ke admin','',true,'Bagas Prasetyo'),
  (4,12,'Rina Kartika',1,'Selesai','2026-07-13','ambil','Transfer ke admin','',true,'Bagas Prasetyo');
select setval(pg_get_serial_sequence('public.pesanan','id'), 4);

insert into public.pesan (id, dari, peran, teks, waktu)
OVERRIDING SYSTEM VALUE values
  (1,'Dewi Lestari','admin','Siang tim 👋 Lantai 2 sudah saya buka di Tata Rak — silakan ditata raknya di sana.','2026-10-20T09:12:00+07:00'),
  (2,'Bagas Prasetyo','staff','Siap Pak/Bu. Sore ini saya rapikan stok speaker yang laris ke rak dekat pintu biar gampang dijangkau.','2026-10-20T13:40:00+07:00'),
  (3,'Dewi Lestari','admin','Boleh. Jangan lupa blok dekat tangga jangan tertutup rak ya, itu jalur pelanggan.','2026-10-20T13:55:00+07:00'),
  (4,'Bagas Prasetyo','staff','Aman 👍. Oh iya, pesanan BK-2026-0011 sudah saya proses, tinggal diambil pembesok.','2026-10-21T16:02:00+07:00');
select setval(pg_get_serial_sequence('public.pesan','id'), 4);

insert into public.pengeluaran (id, tanggal, keterangan, kategori, jumlah)
OVERRIDING SYSTEM VALUE values
  (1,'2026-08-05','Listrik & air sebulan','Operasional',820000),
  (2,'2026-08-10','Belanja stok mesin cuci Aqua','Belanja barang',9500000),
  (3,'2026-08-28','Gaji staff Agustus','Gaji',6500000),
  (4,'2026-09-07','Sewa ruko September','Sewa',4500000),
  (5,'2026-09-15','Iklan media sosial','Pemasaran',350000),
  (6,'2026-09-30','Gaji staff September','Gaji',6500000);
select setval(pg_get_serial_sequence('public.pengeluaran','id'), 6);

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

-- katalog & denah: boleh dibaca siapa pun (termasuk belum login);
-- hanya staff/admin yang boleh mengubah.
create policy "katalog baca publik" on public.kategori   for select to anon, authenticated using (true);
create policy "denah baca publik"   on public.rak_konfig for select to anon, authenticated using (true);
create policy "lantai baca publik"  on public.lantai     for select to anon, authenticated using (true);
create policy "rak baca publik"     on public.rak        for select to anon, authenticated using (true);
create policy "blok baca publik"    on public.blok       for select to anon, authenticated using (true);
create policy "produk baca publik"  on public.produk     for select to anon, authenticated using (true);
create policy "toko baca publik"    on public.toko       for select to anon, authenticated using (true);

create policy "kategori tulis staf" on public.kategori   for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "toko tulis staf"     on public.toko       for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "konfig tulis staf"   on public.rak_konfig for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "lantai tulis staf"   on public.lantai     for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "rak tulis staf"      on public.rak        for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "blok tulis staf"     on public.blok       for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "produk tulis staf"   on public.produk     for all to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());

-- pesanan: pembeli hanya melihat & membuat pesanan miliknya;
-- staff/admin melihat semuanya dan bisa mengubah status/pembayaran;
-- pembeli boleh menghapus pesanannya sendiri selama masih Menunggu & belum lunas.
create policy "pesanan lihat milik sendiri" on public.pesanan for select to authenticated
  using (pembeli_id = auth.uid() or public.staf_atau_admin());
create policy "pesanan buat sendiri" on public.pesanan for insert to authenticated
  with check (pembeli_id = auth.uid() or public.staf_atau_admin());
create policy "pesanan ubah staf" on public.pesanan for update to authenticated
  using (public.staf_atau_admin()) with check (public.staf_atau_admin());
create policy "pesanan hapus sendiri saat menunggu" on public.pesanan for delete to authenticated
  using (
    (pembeli_id = auth.uid() and status = 'Menunggu' and lunas = false)
    or public.staf_atau_admin()
  );

-- pesan grup: hanya admin & staff (obrolan internal toko)
create policy "pesan baca staf"   on public.pesan for select to authenticated using (public.staf_atau_admin());
create policy "pesan kirim staf"  on public.pesan for insert to authenticated with check (public.staf_atau_admin());
create policy "pesan ubah admin"  on public.pesan for update to authenticated using (public.hanya_admin()) with check (public.hanya_admin());
create policy "pesan hapus admin" on public.pesan for delete to authenticated using (public.hanya_admin());

-- keuangan: staff/admin penuh
create policy "pengeluaran baca staf"  on public.pengeluaran for select to authenticated using (public.staf_atau_admin());
create policy "pengeluaran tulis staf" on public.pengeluaran for all    to authenticated using (public.staf_atau_admin()) with check (public.staf_atau_admin());

-- profil: pemilik melihat & memperbarui profilnya; admin melihat semua,
-- mengubah role/status, dan menghapus akun. (baris dibuat otomatis oleh trigger)
create policy "profil lihat sendiri" on public.profil for select to authenticated
  using (id = auth.uid() or public.staf_atau_admin());
create policy "profil ubah sendiri"  on public.profil for update to authenticated
  using (id = auth.uid() or public.staf_atau_admin())
  with check (id = auth.uid() or public.staf_atau_admin());
create policy "profil hapus admin"   on public.profil for delete to authenticated
  using (public.hanya_admin());

-- ---------- 6. storage foto (produk & avatar) ----------
insert into storage.buckets (id, name, public)
values ('foto', 'foto', true)
on conflict (id) do nothing;

create policy "foto baca publik" on storage.objects
  for select to anon, authenticated using (bucket_id = 'foto');

-- folder produk/ → hanya staff & admin yang unggah/ganti
create policy "foto unggah produk" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'foto'
    and (storage.foldername(name))[1] = 'produk'
    and public.staf_atau_admin()
  );
create policy "foto ganti produk" on storage.objects
  for update to authenticated using (
    bucket_id = 'foto'
    and (storage.foldername(name))[1] = 'produk'
    and public.staf_atau_admin()
  );

-- folder avatar/<uid>/ → tiap pengguna unggah avatar miliknya sendiri
create policy "avatar unggah sendiri" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'foto'
    and (storage.foldername(name))[1] = 'avatar'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy "avatar ganti sendiri" on storage.objects
  for update to authenticated using (
    bucket_id = 'foto'
    and (storage.foldername(name))[1] = 'avatar'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ---------- 7. realtime untuk pesan grup (obrolan langsung) ----------
do $$
begin
  alter publication supabase_realtime add table public.pesan;
exception when duplicate_object then null;
end $$;
