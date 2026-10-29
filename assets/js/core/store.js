/* SORTIK — sesi Supabase, data permanen, dan sidebar. */
const VERSI = "sortik2:";
const KOLEKSI = ["kategori", "toko", "rak", "produk", "pesanan", "pengguna", "pesan", "keuangan"];
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const TUJUAN_PERAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";

/* ---------- penyimpanan ke Supabase ----------
   Halaman tetap memakai pola lama: ubah db[k] di memori, lalu simpan(k).
   simpan() membandingkan isi db[k] dengan snapshot terakhir (dataAwal),
   lalu menulis selisihnya (tambah / ubah / hapus) ke tabel Supabase.
   Tiap koleksi punya antrean sendiri agar penulisan tidak saling tabrakan. */
const dataAwal = {};
const salinData = (nilai) => JSON.parse(JSON.stringify(nilai ?? null));
const bekukanData = () => {
  ["kategori", "toko", "rak", "produk", "pesanan", "pengguna", "pesan", "keuangan", "akun"]
    .forEach((k) => { dataAwal[k] = salinData(db[k]); });
};

/* koleksi → tabel Supabase */
const TABEL = {
  kategori: "kategori", toko: "toko", produk: "produk", pesanan: "pesanan",
  pesan: "pesan", pengguna: "profil", keuangan: "pengeluaran"
};

/* kolom yang benar-benar ada di tabel — payload dibatasi daftar ini,
   jadi kolom lama milik versi demo tidak ikut terkirim. */
const KOLOM = {
  kategori: ["id", "nama", "ikon", "lucide", "urutan"],
  toko: ["id", "nama", "alamat", "jam", "wa", "ongkir", "rekening", "logo"],
  produk: ["nama", "kategori", "harga", "diskon", "stok", "rak", "ikon", "foto", "deskripsi", "galeri"],
  pesanan: ["produk_id", "pembeli_id", "pembeli", "jumlah", "status", "tanggal", "cara", "bayar", "alamat", "lunas", "staff", "harga", "bukti", "bukti_pada"],
  pesan: ["user_id", "dari", "peran", "teks", "waktu"],
  pengeluaran: ["tanggal", "keterangan", "kategori", "jumlah"],
  profil: ["nama", "role", "status", "telepon", "alamat", "avatar", "ikon"]
};
const pilih = (baris, kolom) => Object.fromEntries(
  kolom.filter((c) => baris[c] !== undefined).map((c) => [c, baris[c]]));

/* payload per koleksi; kolom id tidak dikirim untuk tabel identity
   (id dibuat database), kecuali kategori (id = slug teks) dan toko. */
const payload = (k, r) => {
  const tabel = TABEL[k];
  if (k === "pesanan") {
    return {
      ...pilih(r, KOLOM.pesanan),
      produk_id: r.produk_id ?? r.produk ?? null,
      pembeli_id: r.pembeli_id ?? db.akun?.id ?? null
    };
  }
  if (k === "pengguna") return pilih(r, KOLOM.profil);   /* email & id tidak boleh berubah */
  return pilih(r, KOLOM[tabel]);
};

const barisDari = (sumber, k) =>
  k === "keuangan" ? (sumber?.keuangan?.pengeluaran ?? []) : (sumber?.[k] ?? []);

const pesanGalat = (e) => {
  const m = String(e?.message || e || "");
  if (/PGRST204|column .* does not exist|schema cache/i.test(m))
    return "Struktur database belum diperbarui — jalankan supabase/aktifkan-tulis.sql di SQL Editor.";
  if (/row-level security|permission denied|42501|violates row-level/i.test(m))
    return "Izin tulis belum aktif — jalankan supabase/aktifkan-tulis.sql di SQL Editor.";
  if (/duplicate key/i.test(m)) return "Data dengan kode/id sama sudah ada.";
  if (/foreign key|violates .*constraint/i.test(m))
    return "Data merujuk barang atau akun yang tidak ada — periksa isian Anda.";
  if (e?.status === 401 || /jwt|not authenticated/i.test(m))
    return "Sesi Anda sudah berakhir — silakan masuk kembali.";
  return m;
};

/* tulis selisih satu koleksi kolektif → Supabase */
async function tulisKoleksi(k) {
  const tabel = TABEL[k];
  if (!tabel) return;

  /* pengaturan toko: satu baris (id = 1) */
  if (k === "toko") {
    const { error } = await sb.from("toko").upsert(pilih(db.toko, KOLOM.toko), { onConflict: "id" });
    if (error) throw error;
    dataAwal.toko = salinData(db.toko);
    return;
  }

  const lokal = barisDari(db, k);
  const kini = salinData(lokal);                       /* keadaan yang akan dikirim */
  const lama = barisDari(dataAwal, k);
  const petaLama = new Map(lama.map((r) => [String(r.id), r]));
  const adaLama = new Set(lama.map((r) => String(r.id)));

  /* 1. baris yang dihapus dari daftar */
  for (const r of lama) {
    if (kini.some((c) => String(c.id) === String(r.id))) continue;
    const { error } = await sb.from(tabel).delete().eq("id", r.id);
    if (error) throw error;
  }

  /* 2. baris baru — id diserahkan ke database */
  for (let i = 0; i < kini.length; i++) {
    if (adaLama.has(String(kini[i].id))) continue;
    const { data, error } = await sb.from(tabel).insert(payload(k, kini[i])).select().single();
    if (error) throw error;
    kini[i].id = data.id;
    if (lokal[i]) lokal[i].id = data.id;               /* rujukan lokal ikut diperbarui */
  }

  /* 3. baris yang berubah isinya */
  for (let i = 0; i < kini.length; i++) {
    const l = petaLama.get(String(kini[i].id));
    if (!l) continue;
    const baru = payload(k, kini[i]);
    const lama2 = payload(k, l);
    if (JSON.stringify(baru) === JSON.stringify(lama2)) continue;
    const { error } = await sb.from(tabel).update(baru).eq("id", kini[i].id);
    if (error) throw error;
  }

  dataAwal[k] = kini;                                  /* snapshot = keadaan terkirim */
}

/* tulis denah toko: rak_konfig + lantai + rak + blok */
async function tulisDenah() {
  const r = db.rak;
  const lama = dataAwal.rak?.lantai || [];

  const idAktif = r.lantai[r.aktif]?.id;
  const { error: ek } = await sb.from("rak_konfig").upsert(
    { id: 1, grid: r.grid || 28, lantai_aktif: idAktif || 1 }, { onConflict: "id" });
  if (ek) throw ek;

  /* lantai: tambah, ubah, urutkan */
  for (let i = 0; i < r.lantai.length; i++) {
    const L = r.lantai[i];
    const baris = {
      nama: L.nama, lebar: L.lebar, tinggi: L.tinggi,
      pintu_sisi: L.pintu?.sisi || "bawah", pintu_pos: L.pintu?.pos || 0, urutan: i
    };
    if (L.id != null && lama.some((x) => x.id === L.id)) {
      const { error } = await sb.from("lantai").update(baris).eq("id", L.id);
      if (error) throw error;
    } else {
      const { data, error } = await sb.from("lantai").insert(baris).select().single();
      if (error) throw error;
      L.id = data.id;
    }
  }
  for (const l of lama) {
    if (l.id == null || r.lantai.some((x) => x.id === l.id)) continue;
    const { error } = await sb.from("lantai").delete().eq("id", l.id);
    if (error) throw error;                            /* rak & blok ikut terhapus (cascade) */
  }

  const rakLama = lama.flatMap((l) => (l.daftar || []).map((x) => ({ ...x, lantai_id: l.id })));
  const blokLama = lama.flatMap((l) => (l.area || []).map((x) => ({ ...x, lantai_id: l.id })));
  const idLantaiKini = new Set(r.lantai.map((l) => l.id));

  /* rak & blok: tambah, ubah posisi/ukuran */
  for (const L of r.lantai) {
    for (const rk of L.daftar || []) {
      const baris = { lantai_id: L.id, kode: rk.kode, x: rk.x, y: rk.y, w: rk.w, h: rk.h };
      const l = rakLama.find((o) => o.id === rk.id);
      if (l) {
        const sama = ["kode", "x", "y", "w", "h"].every((f) => l[f] === rk[f]) && l.lantai_id === L.id;
        if (sama) continue;                            /* tidak berubah — tidak dikirim */
        const { error } = await sb.from("rak").update(baris).eq("id", rk.id);
        if (error) throw error;
      } else {
        const { data, error } = await sb.from("rak").insert(baris).select().single();
        if (error) throw error;
        rk.id = data.id;
      }
    }
    for (const a of L.area || []) {
      const idAngka = Number(a.id);
      const baris = { lantai_id: L.id, nama: a.nama || "", x: a.x, y: a.y, w: a.w, h: a.h };
      const l = blokLama.find((o) => Number(o.id) === idAngka);
      if (l) {
        const sama = ["nama", "x", "y", "w", "h"].every((f) => l[f] === baris[f]) && l.lantai_id === L.id;
        if (sama) continue;
        const { error } = await sb.from("blok").update(baris).eq("id", idAngka);
        if (error) throw error;
      } else {
        const { data, error } = await sb.from("blok").insert(baris).select().single();
        if (error) throw error;
        a.id = String(data.id);
      }
    }
  }

  /* hapus rak & blok yang hilang (lantai yang sudah dihapus dilewati — cascade) */
  for (const rk of rakLama) {
    if (!idLantaiKini.has(rk.lantai_id)) continue;
    const L = r.lantai.find((x) => x.id === rk.lantai_id);
    if ((L?.daftar || []).some((x) => x.id === rk.id)) continue;
    const { error } = await sb.from("rak").delete().eq("id", rk.id);
    if (error) throw error;
  }
  for (const b of blokLama) {
    if (!idLantaiKini.has(b.lantai_id)) continue;
    const L = r.lantai.find((x) => x.id === b.lantai_id);
    if ((L?.area || []).some((x) => String(x.id) === String(b.id))) continue;
    const { error } = await sb.from("blok").delete().eq("id", b.id);
    if (error) throw error;
  }

  dataAwal.rak = salinData(r);
}

/* antrean per koleksi: simpan() boleh dipanggil berkali-kali berturut-turut */
const antreTulis = {};
const simpan = (k) => {
  if (!db.akun?.id) {
    notif("Masuk dulu dengan akun Anda untuk menyimpan perubahan.");
    return Promise.resolve(false);
  }
  const hasil = (antreTulis[k] || Promise.resolve())
    .then(() => (k === "rak" ? tulisDenah() : tulisKoleksi(k)).then(() => true))
    .catch((error) => {
      console.error("Gagal menyimpan " + k + ":", error);
      notif("Gagal menyimpan — " + pesanGalat(error));
      return false;
    });
  antreTulis[k] = hasil;                 /* tidak pernah reject — antrean tetap jalan */
  return hasil;                          /* true = tersimpan, false = gagal */
};
/* localStorage hanya untuk keranjang belanja (status sementara per browser);
   seluruh data bisnis datang dari Supabase, bukan dari localStorage. */
const baca = (k, nilaiKosong = []) => {
  if (k !== "keranjang") return nilaiKosong;
  try { return JSON.parse(localStorage.getItem(VERSI + k)) ?? nilaiKosong; } catch { return nilaiKosong; }
};

const formatRak = (konfig, lantai, rak, blok) => {
  const urut = [...lantai].sort((a, b) => a.urutan - b.urutan);
  return {
    grid: konfig?.grid || 28,
    aktif: Math.max(0, urut.findIndex((l) => l.id === konfig?.lantai_aktif)),
    lantai: urut.map((l) => ({
      id: l.id, nama: l.nama, lebar: l.lebar, tinggi: l.tinggi,
      pintu: { sisi: l.pintu_sisi, pos: l.pintu_pos },
      daftar: rak.filter((r) => r.lantai_id === l.id).map(({ id, kode, x, y, w, h }) => ({ id, kode, x, y, w, h })),
      area: blok.filter((b) => b.lantai_id === l.id).map(({ id, nama, x, y, w, h }) => ({ id: String(id), nama, x, y, w, h }))
    }))
  };
};

async function muatData() {
  const [{ data: kategori, error: ek }, { data: toko, error: et },
    { data: konfig, error: ec }, { data: lantai, error: elantai },
    { data: rak, error: er }, { data: blok, error: eb },
    { data: produk, error: ep }] = await Promise.all([
    sb.from("kategori").select("*").order("urutan"),
    sb.from("toko").select("*").maybeSingle(),
    sb.from("rak_konfig").select("*").maybeSingle(),
    sb.from("lantai").select("*").order("urutan"),
    sb.from("rak").select("*"),
    sb.from("blok").select("*"),
    sb.from("produk").select("*").order("id")
  ]);
  const error = ek || et || ec || elantai || er || eb || ep;
  if (error) throw error;

  db.kategori = kategori || [];
  db.toko = toko || { id: 1, nama: "", alamat: "", jam: "", wa: "", ongkir: 0, rekening: [] };
  db.rak = formatRak(konfig, lantai || [], rak || [], blok || []);
  db.produk = (produk || []).map((p) => ({ ...p, kategori: p.kategori || "", galeri: Array.isArray(p.galeri) ? p.galeri : [] }));

  const { data: sesi } = await sb.auth.getSession();
  const user = sesi?.session?.user;
  if (!user) {
    if (peran !== "pembeli") {
      location.replace("../auth/login.html");
      return;
    }
    db.akun = { id: null, nama: "Pengunjung", role: peran, email: "", telepon: "", alamat: "", avatar: "", ikon: "🧑" };
    db.pesanan = [];
    db.pengguna = [];
    db.pesan = [];
    db.keuangan = { pengeluaran: [] };
    bekukanData();
    return;
  }

  const { data: profil, error: eprofil } = await sb.from("profil").select("*").eq("id", user.id).single();
  if (eprofil || !profil) throw eprofil || new Error("Profil akun tidak ditemukan.");
  if (profil.status !== "aktif") {
    await sb.auth.signOut();
    location.replace("../auth/login.html");
    throw new Error("Akun dinonaktifkan.");
  }
  if (profil.role !== peran) {
    location.replace(TUJUAN_PERAN[profil.role] || TUJUAN_PERAN.pembeli);
    throw new Error("Peran akun tidak sesuai halaman.");
  }
  db.akun = { ...profil, peran };

  if (["staff", "admin"].includes(peran)) {
    const [{ data: pesanan, error: eo }, { data: pengguna, error: eu },
      { data: pesan, error: em }, { data: pengeluaran, error: epg }] = await Promise.all([
      sb.from("pesanan").select("*").order("tanggal", { ascending: false }),
      sb.from("profil").select("*").order("nama"),
      sb.from("pesan").select("*").order("waktu"),
      sb.from("pengeluaran").select("*").order("tanggal", { ascending: false })
    ]);
    const err = eo || eu || em || epg;
    if (err) throw err;
    db.pesanan = (pesanan || []).map((o) => ({ ...o, produk: o.produk_id }));
    db.pengguna = pengguna || [];
    db.pesan = pesan || [];
    db.keuangan = { pengeluaran: pengeluaran || [] };
  } else {
    const { data: pesanan, error: eo } = await sb.from("pesanan").select("*").eq("pembeli_id", user.id).order("tanggal", { ascending: false });
    if (eo) throw eo;
    db.pesanan = (pesanan || []).map((o) => ({ ...o, produk: o.produk_id }));
    db.pengguna = [];
    db.pesan = [];
    db.keuangan = { pengeluaran: [] };
  }
  bekukanData();
}

/* { produk: id, jumlah } hanya keranjang sementara, bukan sumber data bisnis. */
const keranjang = baca("keranjang", []);
const jmlKeranjang = () => keranjang.reduce((n, i) => n + i.jumlah, 0);
const simpanKeranjang = () => {
  try { localStorage.setItem(VERSI + "keranjang", JSON.stringify(keranjang)); } catch {}
  const badge = el("jml");
  if (badge) badge.textContent = jmlKeranjang() || "";
};

const labelPeran = (r) => PERAN[r] || r;
const inisial = (nama) => String(nama || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const avatarHTML = (u) => (u.avatar ? `<img src="${u.avatar}" alt="">` : (u.ikon || inisial(u.nama)));
const pesananku = () => db.pesanan.filter((o) => o.pembeli_id === db.akun.id);
const nTunggu = () => db.pesanan.filter((o) => o.status === "Menunggu").length;
const nPesanBaru = () => 0;

const MENU = {
  pembeli: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["search", "Cari Produk & Rak", "cari.html", "", "Cari"],
    ["shopping-cart", "Keranjang", "checkout.html", `<b class="badge" id="jml">${jmlKeranjang() || ""}</b>`, "Keranjang"],
    ["clipboard-list", "Pesan & Booking", "pesan.html", "", "Pesan"],
    ["history", "Riwayat", "riwayat.html", "", "Riwayat"]
  ],
  staff: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
    ["message-square", "Pesan Grup", "pesan.html", "", "Pesan"],
    ["wallet", "Keuangan", "keuangan.html", "", "Uang"]
  ],
  admin: [
    ["house", "Beranda", "index.html", "", "Beranda"],
    ["warehouse", "Tata Rak", "rak.html", "", "Rak"],
    ["package", "Kelola Barang", "produk.html", "", "Barang"],
    ["clipboard-check", "Kelola Pesanan", "pesanan.html", `<b class="badge">${nTunggu() || ""}</b>`, "Pesanan"],
    ["message-square", "Pesan Grup", "pesan.html", "", "Pesan"],
    ["wallet", "Keuangan", "keuangan.html", "", "Uang"],
    ["users", "Kelola Pengguna", "pengguna.html", "", "Pengguna"],
    ["settings", "Pengaturan Toko", "pengaturan.html", "", "Toko"]
  ]
};

const LUCIDE = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
function muatLucide() {
  if (window.lucide) return gambarIkon();
  const s = document.createElement("script");
  s.src = LUCIDE;
  s.onload = gambarIkon;
  document.head.append(s);
}
function gambarSidebar() {
  const side = el("side");
  if (!side) return;
  const berkas = location.pathname.split("/").pop() || "index.html";
  const akun = db.akun || { nama: "Memuat…", role: peran, ikon: "🧑" };
  const tautanProfil = (html) => `<a class="profil" href="akun.html" title="Akun saya">${html}</a>`;
  isi("side", `<a class="logo" href="index.html">
  <img src="../assets/img/favicon.svg" alt="" width="34"><span class="namatoko"><b>${esc(db.toko.nama || "SORTIK")}</b><i>with SORTIK</i></span>
</a>
<nav>${MENU[peran].map(([ikon, label, href, ekstra = "", singkat = label]) =>
    `<a${href === berkas ? ' class="on"' : ""} href="${href}"><span class="ikon" data-lucide="${ikon}"></span><span class="lengkap">${label}</span><span class="pendek">${singkat}</span> ${ekstra}</a>`).join("")}</nav>
<div class="me">${tautanProfil(`<div class="avatar">${avatarHTML(akun)}</div><div class="siapa"><b>${esc(akun.nama)}</b><span>${labelPeran(akun.role)}</span></div>`)}
<a class="keluar" href="../auth/login.html" title="Keluar"><span class="ikon" data-lucide="log-out"></span><span class="lengkap">Keluar</span></a></div>`);
}

async function mulaiAplikasi(mulai) {
  gambarSidebar();
  muatLucide();
  try {
    await muatData();
    gambarSidebar();
    mulai();
  } catch (error) {
    console.error("Gagal memuat data Supabase:", error);
    document.querySelector("main")?.replaceChildren(Object.assign(document.createElement("p"), {
      className: "kosong",
      textContent: "Data Supabase gagal dimuat. Periksa koneksi dan izin database, lalu muat ulang halaman."
    }));
  }
}
