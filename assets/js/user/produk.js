/* Deskripsi produk — produk.html?id=<id>. */

const p = produkById(+new URLSearchParams(location.search).get("id"));

function gambar(p) {
  const habis = p.stok < 1;
  /* ikon cadangan tampil bila foto gagal (onerror) */
  const foto = (src) => `${ikonCadangan(p)}<img src="${src}" alt="${p.nama}" onerror="this.remove()">`;

  /* galeri: foto utama + thumbnail */
  const semua = galeriProduk(p);
  if (semua.length) {
    isi("galeri", `<div class="galeri-utama" id="galeriGambar" title="Klik untuk memperbesar">${foto(semua[0])}</div>` +
      (semua.length > 1 ? `<div class="galeri-thumb" id="galeriThumb">${semua.map((s, i) =>
        `<button type="button" data-src="${s}" class="${i ? "" : "on"}" title="Foto ${i + 1}">${foto(s)}</button>`).join("")}</div>` : ""));
    const utama = el("galeriGambar");
    utama.onclick = () => lihatGambar(semua[0], p.nama);

    const thumb = el("galeriThumb");
    if (thumb) thumb.onclick = (e) => {
      const b = e.target.closest("button[data-src]");
      if (!b) return;
      isi("galeriGambar", foto(b.dataset.src));
      utama.onclick = () => lihatGambar(b.dataset.src, p.nama);
      thumb.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    };
  } else {
    isi("galeri", `<div class="galeri-utama">${ikonCadangan(p)}</div>`);
  }

  isi("info", `<h2>${p.nama}</h2>
  <b class="harga">${rp(p.harga)}</b>

  <div class="chipstat">
    <span class="stok${habis ? " habis" : ""}"><span class="ikon" data-lucide="${habis ? "triangle-alert" : "package"}"></span>${habis ? "Stok habis" : `Stok ${p.stok} unit`}</span>
    <a href="cari.html?rak=${encodeURIComponent(p.rak)}" title="Lihat produk di rak ini"><span class="ikon" data-lucide="warehouse"></span>Rak ${p.rak}</a>
    <a href="cari.html?kat=${p.kategori}" title="Lihat kategori ini"><span class="ikon" data-lucide="layout-grid"></span>${kat(p)}</a>
  </div>

  <p class="desc">${p.deskripsi || "Belum ada deskripsi produk."}</p>

  <ul class="spec">
    <li><span>Kode produk</span><b>PRD-${String(p.id).padStart(3, "0")}</b></li>
    <li><span>Lokasi toko</span><b>${db.toko.nama}</b></li>
    <li><span>Pengambilan</span><b>Ambil di tempat / antar</b></li>
    <li><span>Pembayaran</span><b>Transfer ke admin / bayar di kasir</b></li>
  </ul>

  <div class="beli">
    <div class="beli-atas">
      <div class="qty">
        <button type="button" id="kurang" aria-label="Kurangi jumlah">−</button><b id="jumlah">1</b><button type="button" id="tambah" aria-label="Tambah jumlah">＋</button>
      </div>
      <div class="totalbeli"><span>Total</span><b id="totalBeli">${rp(p.harga)}</b></div>
    </div>
    <div class="beli-aksi">
      <button class="primary" id="keranjang" type="button"${habis ? " disabled" : ""}>${habis ? "Stok Habis" : "Tambah ke Keranjang"}</button>
      <button class="primary garis" id="beli" type="button"${habis ? " disabled" : ""}>Beli Sekarang</button>
    </div>
  </div>`);

  let n = 1;
  const batas = (v) => Math.max(1, Math.min(p.stok, v));
  /* jumlah & total beli berubah bersama */
  const tampil = () => {
    el("jumlah").textContent = n;
    el("totalBeli").textContent = rp(p.harga * n);
  };
  const masuk = () => {
    const item = keranjang.find((i) => i.produk === p.id);
    if (item) item.jumlah = batas(item.jumlah + n);
    else keranjang.push({ produk: p.id, jumlah: n });
    simpanKeranjang();
  };

  el("kurang").onclick = () => { n = batas(n - 1); tampil(); };
  el("tambah").onclick = () => { n = batas(n + 1); tampil(); };
  el("keranjang").onclick = () => { masuk(); el("keranjang").textContent = "✓ Masuk keranjang"; };
  el("beli").onclick = () => { masuk(); location.href = "checkout.html"; };

  const serupa = db.produk.filter((x) => x.kategori === p.kategori && x.id !== p.id).slice(0, 4);
  isi("serupa", serupa.length ? serupa.map(kartu).join("") : pesanKosong("package", "Belum ada produk lain di kategori ini."));
  el("serupaWrap").hidden = !serupa.length;
}

if (p.id) {
  document.title = p.nama + " — SORTIK";
  isi("remah", `<a href="index.html">Beranda</a><span>/</span><a href="cari.html?kat=${p.kategori}">${kat(p)}</a><span>/</span><b>${p.nama}</b>`);
  gambar(p);
} else {
  isi("remah", `<a href="index.html">Beranda</a><span>/</span><b>Produk tidak ditemukan</b>`);
  el("serupaWrap").hidden = true;
  isi("detail", pesanKosong("search-x", "Produk tidak ditemukan.", ["cari.html", "Kembali ke pencarian"]));
}
