/* SORTIK — keranjang & checkout (checkout.html)
    */

const ongkir = db.toko.ongkir;
const state = { cara: "ambil", bayar: "Transfer ke admin" };
const subtotal = () => keranjang.reduce((n, i) => n + (produkById(i.produk).harga || 0) * i.jumlah, 0);

/* satu baris barang: jumlah bisa diubah, bisa dihapus */
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

  /* ringkasan: ongkir hanya muncul kalau memilih antar */
  const ong = state.cara === "antar" ? ongkir : 0;
  isi("sub", rp(subtotal()));
  isi("ong", ong ? rp(ong) : "Gratis");
  isi("tot", rp(subtotal() + ong));
  el("antar").hidden = state.cara !== "antar";

  /* info pembayaran yang tampil mengikuti metode yang dipilih */
  const transfer = state.bayar === "Transfer ke admin";
  el("transfer").hidden = !transfer;
  el("kasir").hidden = transfer;

  el("buat").disabled = kosong;
}

/* statis: info toko, ongkir, rekening admin, dan lokasi kasir */
isi("jam", db.toko.jam);
isi("infoOngkir", rp(ongkir) + " dalam kota");
el("wa").href = "https://wa.me/" + db.toko.wa;
el("wa").textContent = "+" + db.toko.wa;
isi("toko", `${db.toko.nama} — ${db.toko.alamat}`);
isi("rek", db.toko.rekening.map((r) => `<li><b>${r.bank}</b><span>${r.nomor}</span><span>a.n. ${r.atasNama}</span></li>`).join(""));
isi("kasirToko", `<li><b>Kasir ${db.toko.nama}</b><span>${db.toko.alamat}</span><span>${db.toko.jam}</span></li>`);

/* ubah jumlah / hapus barang */
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

/* pilih cara pengambilan (ambil/antar) & metode bayar (transfer/kasir) */
document.querySelectorAll('input[name="cara"], input[name="bayar"]').forEach((r) => (r.onchange = () => { state[r.name] = r.value; render(); }));

/* buat pesanan: satu baris pesanan per barang, status awal "Menunggu" (menunggu pembayaran) */
el("buat").onclick = () => {
  if (state.cara === "antar" && !el("alamat").value.trim()) return el("alamat").focus();
  const mulai = Math.max(0, ...db.pesanan.map((o) => o.id)) + 1;
  const baru = keranjang.map((i, n) => ({
    id: mulai + n,
    produk: i.produk,
    pembeli: db.akun.nama,
    jumlah: i.jumlah,
    status: "Menunggu",
    tanggal: new Date().toISOString().slice(0, 10),
    cara: state.cara,
    bayar: state.bayar,
    alamat: state.cara === "antar" ? el("alamat").value.trim() : "",
    lunas: false,   /* ditandai staff/admin saat pembayaran diterima */
    staff: ""
  }));
  db.pesanan.push(...baru);
  tulis("pesanan", db.pesanan);   /* DB: POST /api/pesanan */
  keranjang.length = 0;
  simpanKeranjang();
  location.href = "pesan.html";
};

render();
