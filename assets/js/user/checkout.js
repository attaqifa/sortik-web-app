/* Keranjang & checkout. */

const ongkir = db.toko.ongkir;
const state = { cara: "ambil", bayar: "Transfer ke admin" };
const subtotal = () => keranjang.reduce((n, i) => n + hargaJual(produkById(i.produk)) * i.jumlah, 0);

/* buang barang yang sudah tidak ada, batasi jumlah ke stok */
keranjang.forEach((i) => (i.jumlah = Math.min(i.jumlah, produkById(i.produk).stok || 0)));
const tersedia = keranjang.filter((i) => i.jumlah > 0);
if (tersedia.length !== keranjang.length) {
  keranjang.length = 0;
  keranjang.push(...tersedia);
}
simpanKeranjang();

const item = (i) => {
  const p = produkById(i.produk);
  const penuh = i.jumlah >= (p.stok || 0);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama}</b><span>${rp(hargaJual(p))}${p.diskon ? ` <s>${rp(p.harga)}</s>` : ""} · Rak ${p.rak}${penuh ? ` · <b class="maks">Maks ${p.stok} unit</b>` : ""}</span></div>
    <div class="qty">
      <button type="button" data-kurang="${p.id}" aria-label="Kurangi jumlah">−</button><b>${i.jumlah}</b><button type="button" data-tambah="${p.id}" aria-label="Tambah jumlah"${penuh ? " disabled" : ""}>＋</button>
      <button type="button" class="x" data-hapus="${p.id}" title="Hapus" aria-label="Hapus dari keranjang">✕</button>
    </div>
  </div>`;
};

function render() {
  const kosong = !keranjang.length;
  isi("items", kosong
    ? pesanKosong("shopping-cart", "Keranjang masih kosong — pilih barang dulu.", ["cari.html", "Cari Produk"])
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

/* alamat terisi dari profil akun */
el("alamat").value = db.akun.alamat || "";

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

/* salah alamat hilang saat mengetik */
el("alamat").addEventListener("input", () => {
  el("alamat").classList.remove("salah");
  el("pesan-alamat").hidden = true;
});

el("buat").onclick = async () => {
  /* validasi alamat inline */
  const tanpaAlamat = state.cara === "antar" && !el("alamat").value.trim();
  el("pesan-alamat").hidden = !tanpaAlamat;
  el("alamat").classList.toggle("salah", tanpaAlamat);
  if (tanpaAlamat) return el("alamat").focus();

  if (!db.akun.id) {
    notif("Masuk dulu dengan akun Anda untuk membuat pesanan.");
    location.href = "../auth/login.html";
    return;
  }

  const mulai = Math.max(0, ...db.pesanan.map((o) => o.id)) + 1;
  const dibuat = keranjang.map((i, n) => ({
    id: mulai + n,
    produk: i.produk,
    pembeli: db.akun.nama,
    jumlah: i.jumlah,
    /* harga jual dikunci saat dipesan — diskon belakangan tidak mengubah riwayat */
    harga: hargaJual(produkById(i.produk)),
    status: "Menunggu",
    tanggal: new Date().toISOString().slice(0, 10),
    cara: state.cara,
    bayar: state.bayar,
    alamat: state.cara === "antar" ? el("alamat").value.trim() : "",
    lunas: false,
    staff: ""
  }));
  db.pesanan.push(...dibuat);

  const tombol = el("buat");
  const labelTombol = tombol.textContent;
  tombol.disabled = true;
  tombol.textContent = "Menyimpan pesanan…";

  const tersimpan = await simpan("pesanan");
  if (!tersimpan) {
    /* pembatalan: buang baris optimis agar tidak dobel saat dicoba lagi */
    db.pesanan = db.pesanan.filter((o) => !dibuat.includes(o));
    tombol.disabled = false;
    tombol.textContent = labelTombol;
    render();
    return;                                        /* pesan galat sudah tampil */
  }

  /* id final dari database → kode pesan di grup memakai nomor yang benar */
  db.pesan = db.pesan || [];
  dibuat.forEach((o) => {
    const p = produkById(o.produk);
    db.pesan.push({
      dari: "SORTIK Bot",
      peran: "bot",
      teks: `Pesanan baru ${kodePesanan(o)} — ${o.pembeli}, ${p.nama || "barang"} ×${o.jumlah}. `
        + `${o.bayar === "Bayar di kasir" ? "Akan dibayar di kasir." : "Tunggu konfirmasi transfer."}`,
      waktu: new Date().toISOString()
    });
  });
  await simpan("pesan");

  keranjang.length = 0;
  simpanKeranjang();
  /* ?baru=1 → notif sukses di pesan.html */
  location.href = "pesan.html?id=" + dibuat[0].id + "&baru=1";
};

render();
