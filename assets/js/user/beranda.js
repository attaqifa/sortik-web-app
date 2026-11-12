/* Beranda pembeli — etalase depan, pil kategori, dan pesanan milik akun. */

/* ---------- etalase depan: sapaan + nama toko + produk unggulan ---------- */
const terjual = {};
db.pesanan.forEach((o) => (terjual[o.produk] = (terjual[o.produk] || 0) + o.jumlah));
const adaStok = db.produk.filter((p) => p.stok > 0)
  .sort((a, b) => (terjual[b.id] || 0) - (terjual[a.id] || 0) || b.id - a.id);
/* slide banner: produk diskon dulu, dilanjutkan terlaris — maks 3, wajib punya foto */
const slideBanner = [...adaStok.filter((p) => p.diskon > 0), ...adaStok.filter((p) => !p.diskon)]
  .filter((p) => galeriProduk(p)[0]).slice(0, 3);

isi("hero", `<div class="heroTeks">
  <span class="label">Selamat datang kembali 👋 <b>${esc(db.akun.nama)}</b></span>
  <h2>${esc(db.toko.nama)}</h2>
  <p>${esc(db.toko.jam || "Setiap hari buka")}. Belanja elektronik santai — lihat denah raknya, pesan, lalu ambil di tempat atau diantar ke alamat Anda.</p>
  <div class="aksi">
    <a class="btn putih" href="cari.html">Mulai belanja</a>
    <a class="btn putih garis" href="pesan.html">Pesanan saya</a>
  </div>
</div>
${slideBanner.length ? `<div class="heroBanner" id="heroBanner">
  ${slideBanner.map((p, i) => `<a class="slide${i ? "" : " on"}" href="produk.html?id=${p.id}" title="Lihat ${esc(p.nama)}">
    <img src="${galeriProduk(p)[0]}" alt="${esc(p.nama)}">
    <div class="heroTag"><span>${p.diskon ? `Diskon ${p.diskon}%` : "Pilihan toko"}</span><b>${esc(p.nama)}</b><em>${rp(hargaJual(p))}${p.diskon ? ` <s>${rp(p.harga)}</s>` : ""}</em></div>
  </a>`).join("")}
  ${slideBanner.length > 1 ? `<div class="dots">${slideBanner.map((_, i) =>
    `<button type="button" data-n="${i}" aria-label="Banner ${i + 1}"></button>`).join("")}</div>` : ""}
</div>` : ""}`);

/* rotasi banner: ganti slide tiap 4 detik, berhenti saat kursor di atasnya */
const banner = el("heroBanner");
if (banner && slideBanner.length > 1) {
  const slide = banner.querySelectorAll(".slide");
  const dot = banner.querySelectorAll(".dots button");
  let n = 0, timer;
  const ganti = (i) => {
    n = (i + slide.length) % slide.length;
    slide.forEach((s, k) => s.classList.toggle("on", k === n));
    dot.forEach((d, k) => d.classList.toggle("on", k === n));
  };
  const jalanTimer = () => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      timer = setInterval(() => ganti(n + 1), 4000);
  };
  const berhenti = () => clearInterval(timer);
  banner.onmouseenter = berhenti;
  banner.onmouseleave = jalanTimer;
  dot.forEach((d) => (d.onclick = () => { berhenti(); ganti(+d.dataset.n); jalanTimer(); }));
  jalanTimer();
}

/* ---------- etalase sedang diskon: paling besar diskon dulu ---------- */
const promo = db.produk.filter((p) => p.diskon > 0).sort((a, b) => b.diskon - a.diskon);
el("promoWrap").hidden = !promo.length;
isi("promo", promo.map(kartu).join(""));

/* ---------- ringkasan akun ---------- */
const punyaku = pesananku();
const jalan = punyaku.filter((o) => o.status !== "Selesai").sort((a, b) => b.tanggal.localeCompare(a.tanggal));

isi("stats", [
  ["shopping-cart", "Pesanan aktif", jalan.length],
  ["clock", "Belum dibayar", jalan.filter((o) => !o.lunas).length],
  ["package", "Siap diambil", punyaku.filter((o) => o.status === "Siap").length]
].map(([ikon, label, nilai]) => `<div><span class="ikon" data-lucide="${ikon}"></span><b>${nilai}</b><span>${label}</span></div>`).join(""));

/* pesanan selesai ada di Riwayat */
isi("pesanan", jalan.map((o) => {
  const p = produkById(o.produk);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${o.jumlah} item · ${rp(nilaiPesanan(o))}</span>${tagBayar(o)}</div>
    ${tagStatus(o.status)}
  </div>`;
}).join("") || pesanKosong("shopping-cart", "Belum ada pesanan berjalan.", ["cari.html", "Mulai belanja"]));

/* ---------- pil kategori: saring produk langsung di beranda ---------- */
let katPilih = "";
function gambarBaru() {
  const daftar = [...db.produk].reverse().filter((p) => !katPilih || p.kategori === katPilih).slice(0, 8);
  const k = db.kategori.find((x) => x.id === katPilih);
  isi("judulBaru", katPilih ? `Kategori: ${k ? esc(k.nama) : esc(katPilih)}` : "Produk Terbaru");
  isi("baru", daftar.map(kartu).join("")
    || pesanKosong("package", "Belum ada produk di kategori ini.", ["cari.html", "Buka pencarian"]));
}
chipSaring("pilKat", [["", "Semua"], ...db.kategori.map((k) => [k.id, `${ikonKategori(k)}<span>${esc(k.nama)}</span>`])],
  (nilai) => { katPilih = nilai; gambarBaru(); });
gambarBaru();

/* ---------- kategori (papan penuh, tautan ke pencarian) ---------- */
isi("kategori", db.kategori.map((k) => `<a class="cat" href="cari.html?kat=${k.id}">${ikonKategori(k)}<span>${k.nama}</span></a>`).join(""));
