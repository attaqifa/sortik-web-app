/* SORTIK — sesi Supabase, data permanen, dan sidebar. */
const VERSI = "sortik2:";
const KOLEKSI = ["kategori", "toko", "rak", "produk", "pesanan", "pengguna", "pesan", "keuangan"];
const PERAN = { pembeli: "Pembeli", staff: "Staff Toko", admin: "Admin Toko" };
const FOLDER = { user: "pembeli", staff: "staff", admin: "admin" };
const TUJUAN_PERAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };
const peran = FOLDER[(location.pathname.match(/\/(user|staff|admin)\//) || [])[1]] || "pembeli";

/* UI lama yang belum dialihkan ke Supabase hanya boleh membaca data.
   Snapshot ini juga membatalkan perubahan sementara di memori browser. */
const dataAwal = {};
const salinData = (nilai) => JSON.parse(JSON.stringify(nilai));
const bekukanData = () => {
  ["kategori", "toko", "rak", "produk", "pesanan", "pengguna", "pesan", "keuangan", "akun"]
    .forEach((k) => { dataAwal[k] = salinData(db[k]); });
};
const simpan = (k) => {
  if (Object.prototype.hasOwnProperty.call(dataAwal, k)) db[k] = salinData(dataAwal[k]);
  if (k === "pengguna" && dataAwal.akun) db.akun = salinData(dataAwal.akun);
  window.__sortikBacaSaja = true;
  setTimeout(() => { window.__sortikBacaSaja = false; }, 0);
  notif("Aplikasi hanya-baca. Tambahkan atau ubah data melalui Supabase Table Editor.");
  return false;
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
      daftar: rak.filter((r) => r.lantai_id === l.id).map(({ kode, x, y, w, h }) => ({ kode, x, y, w, h })),
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
