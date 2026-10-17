/* Keranjang & checkout. */

const ongkir = db.toko.ongkir;
const state = { cara: "ambil", bayar: "Transfer ke admin" };
const subtotal = () => keranjang.reduce((n, i) => n + (produkById(i.produk).harga || 0) * i.jumlah, 0);

/* buang barang yang sudah dihapus staff dan batasi jumlah ke stok terkini */
keranjang.forEach((i) => (i.jumlah = Math.min(i.jumlah, produkById(i.produk).stok || 0)));
const tersedia = keranjang.filter((i) => i.jumlah > 0);
if (tersedia.length !== keranjang.length) {
  keranjang.length = 0;
  keranjang.push(...tersedia);
}
simpanKeranjang();

const item = (i) => {
  const p = produkById(i.produk);
  return `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama}</b><span>${rp(p.harga)} · Rak ${p.rak}</span></div>
    <div class="qty">
      <button type="button" data-kurang="${p.id}">−</button><b>${i.jumlah}</b><button type="button" data-tambah="${p.id}">＋</button>
      <button type="button" class="x" data-hapus="${p.id}" title="Hapus">✕</button>
    </div>
  </div>`;
};

function render() {
  const kosong = !keranjang.length;
  isi("items", kosong
    ? `<p class="kosong">Keranjang masih kosong. <a href="cari.html">Cari produk dulu</a>.</p>`
    : keranjang.map(item).join(""));

  const ong = state.cara === "antar" ? ongkir : 0;
  isi("sub", rp(subtotal()));
  isi("ong", ong ? rp(ong) : "Gratis");
  isi("tot", rp(subtotal() + ong));
  el("antar").hidden = state.cara !== "antar";

  const transfer = state.bayar === "Transfer ke admin";
  el("transfer").hidden = !transfer;
  el("kasir").hidden = transfer;
  el("buat").disabled = kosong;
}

isi("jam", db.toko.jam);
isi("infoOngkir", rp(ongkir) + " dalam kota");
el("wa").href = "https://wa.me/" + db.toko.wa;
el("wa").textContent = "+" + db.toko.wa;
isi("toko", `${db.toko.nama} — ${db.toko.alamat}`);
isi("rek", db.toko.rekening.map((r) => `<li><b>${r.bank}</b><span>${r.nomor}</span><span>a.n. ${r.atasNama}</span></li>`).join(""));
isi("kasirToko", `<li><b>Kasir ${db.toko.nama}</b><span>${db.toko.alamat}</span><span>${db.toko.jam}</span></li>`);

el("items").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const id = +(b.dataset.tambah || b.dataset.kurang || b.dataset.hapus);
  const i = keranjang.find((x) => x.produk === id);
  if (b.dataset.hapus) keranjang.splice(keranjang.indexOf(i), 1);
  else if (b.dataset.tambah) i.jumlah = Math.min(produkById(id).stok, i.jumlah + 1);
  else i.jumlah = Math.max(1, i.jumlah - 1);
  simpanKeranjang();
  render();
});

document.querySelectorAll('input[name="cara"], input[name="bayar"]').forEach((r) => (r.onchange = () => {
  state[r.name] = r.value;
  render();
}));

el("buat").onclick = () => {
  if (state.cara === "antar" && !el("alamat").value.trim()) return el("alamat").focus();
  const mulai = Math.max(0, ...db.pesanan.map((o) => o.id)) + 1;
  db.pesanan.push(...keranjang.map((i, n) => ({
    id: mulai + n,
    produk: i.produk,
    pembeli: db.akun.nama,
    jumlah: i.jumlah,
    status: "Menunggu",
    tanggal: new Date().toISOString().slice(0, 10),
    cara: state.cara,
    bayar: state.bayar,
    alamat: state.cara === "antar" ? el("alamat").value.trim() : "",
    lunas: false,
    staff: ""
  })));
  simpan("pesanan");
  keranjang.length = 0;
  simpanKeranjang();
  location.href = "pesan.html";
};

render();
