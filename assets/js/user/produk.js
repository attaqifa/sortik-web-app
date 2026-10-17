/* Deskripsi produk — produk.html?id=<id produk>. */

const p = produkById(+new URLSearchParams(location.search).get("id"));

function gambar(p) {
  const habis = p.stok < 1;
  isi("detail", `<div class="pimg big">${p.ikon || "📦"}</div>
  <div>
    <span class="pcat">${kat(p)}</span>
    <h2>${p.nama}</h2>
    <b class="harga">${rp(p.harga)}</b>
    <p class="desc">${p.deskripsi || "Belum ada deskripsi produk."}</p>

    <ul class="spec">
      <li><span>Kode produk</span><b>PRD-${String(p.id).padStart(3, "0")}</b></li>
      <li><span>Kategori</span><b>${kat(p)}</b></li>
      <li><span>Lokasi rak</span><b>${p.rak} · ${db.toko.nama}</b></li>
      <li><span>Stok tersedia</span><b>${p.stok} unit</b></li>
      <li><span>Pengambilan</span><b>Ambil di tempat / antar</b></li>
      <li><span>Pembayaran</span><b>Transfer ke admin / bayar di kasir</b></li>
    </ul>

    <div class="beli">
      <div class="qty">
        <button type="button" id="kurang">−</button><b id="jumlah">1</b><button type="button" id="tambah">＋</button>
      </div>
      <button class="primary" id="keranjang" type="button"${habis ? " disabled" : ""}>${habis ? "Stok Habis" : "Tambah ke Keranjang"}</button>
      <button class="primary garis" id="beli" type="button"${habis ? " disabled" : ""}>Beli Sekarang</button>
    </div>
  </div>`);

  let n = 1;
  const batas = (v) => Math.max(1, Math.min(p.stok, v));
  const tampil = () => (el("jumlah").textContent = n);
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

  const serupa = db.produk.filter((x) => x.kategori === p.kategori && x.id !== p.id).slice(0, 3);
  isi("serupa", serupa.length ? serupa.map(kartu).join("") : `<p class="kosong">Belum ada produk lain di kategori ini.</p>`);
  el("serupaWrap").hidden = !serupa.length;
}

if (p.id) {
  el("judul").textContent = p.nama;
  gambar(p);
} else {
  el("serupaWrap").hidden = true;
  isi("detail", `<p class="kosong">Produk tidak ditemukan. <a href="cari.html">Kembali ke pencarian</a>.</p>`);
}
