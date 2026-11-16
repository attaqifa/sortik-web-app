/* Keranjang & checkout. */

const ongkir = db.toko.ongkir;
const state = { cara: "ambil", bayar: "Transfer ke admin" };
const subtotal = () => db.keranjang.reduce((n, i) => n + hargaJual(produkById(i.produk)) * i.jumlah, 0);

const item = (i) => {
  const p = produkById(i.produk);
  const penuh = i.jumlah >= (p.stok || 0);
  const habis = !(p.stok > 0);
  return `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${esc(p.nama)}</b><span>${rp(hargaJual(p))}${p.diskon ? ` <s>${rp(p.harga)}</s>` : ""}${p.rak ? " " + tagRak(p.rak) : ""}${habis ? ` · <b class="maks">Stok habis</b>` : penuh ? ` · <b class="maks">Maks ${p.stok} unit</b>` : ""}</span><b class="subbaris">${rp(hargaJual(p) * i.jumlah)}</b></div>
    <div class="qty">
      <button type="button" data-kurang="${p.id}" aria-label="Kurangi jumlah">−</button><b>${i.jumlah}</b><button type="button" data-tambah="${p.id}" aria-label="Tambah jumlah"${penuh ? " disabled" : ""}>＋</button>
      <button type="button" class="x" data-hapus="${p.id}" title="Hapus" aria-label="Hapus dari keranjang">✕</button>
    </div>
  </div>`;
};

function render() {
  const kosong = !db.keranjang.length;
  isi("items", kosong
    ? pesanKosong("shopping-cart", "Keranjang masih kosong — ayo golek barang e dulu.", ["cari.html", "Cari Produk"])
    : db.keranjang.map(item).join(""));

  const ong = state.cara === "antar" ? ongkir : 0;
  isi("sub", rp(subtotal()));
  isi("ong", ong ? rp(ong) : "Gratis");
  isi("tot", rp(subtotal() + ong));
  el("antar").hidden = state.cara !== "antar";

  const transfer = state.bayar === "Transfer ke admin";
  el("transfer").hidden = !transfer;
  el("kasir").hidden = transfer;
  el("buat").disabled = kosong || db.keranjang.some((i) => !(produkById(i.produk).stok > 0));
}

el("jam").textContent = db.toko.jam;
isi("infoOngkir", rp(ongkir) + " dalam kota");
el("wa").href = "https://wa.me/" + String(db.toko.wa || "").replace(/\D/g, "");
el("wa").textContent = "+" + db.toko.wa;
isi("toko", `${esc(db.toko.nama)} — ${esc(db.toko.alamat)}`);
isi("rek", db.toko.rekening.map((r) => `<li><b>${esc(r.bank)}</b><span>${esc(r.nomor)}</span><span>a.n. ${esc(r.atasNama)}</span></li>`).join(""));
isi("kasirToko", `<li><b>Kasir ${esc(db.toko.nama)}</b><span>${esc(db.toko.alamat)}</span><span>${esc(db.toko.jam)}</span></li>`);

/* alamat terisi dari profil akun */
el("alamat").value = db.akun.alamat || "";
isi("jmlKeranjang", nKeranjang() || "");

el("items").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled) return;
  const id = +(b.dataset.tambah || b.dataset.kurang || b.dataset.hapus);
  const i = db.keranjang.find((x) => x.produk === id);
  if (!i) return;
  const jumlah = b.dataset.hapus ? 0 : b.dataset.tambah ? i.jumlah + 1 : Math.max(1, i.jumlah - 1);
  const r = await keranjangAtur(id, jumlah);
  if (r.error) notif(r.error);
  gambarSidebar();
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

  /* konfirmasi sebelum pesanan benar-benar dibuat */
  const yakin = await konfirmasi("Buat pesanan ini?",
    `${nKeranjang()} item — total ${rp(subtotal() + (state.cara === "antar" ? ongkir : 0))}`
    + (state.cara === "antar" ? " (termasuk ongkir)." : "."), "Ya, Buat Pesanan");
  if (!yakin) return;

  const tombol = el("buat");
  const labelTombol = tombol.textContent;
  tombol.disabled = true;
  tombol.textContent = "Menyimpan pesanan…";

  /* harga, stok, dan ongkir dihitung ulang oleh server dari keranjang tersimpan */
  const r = await api.post("/pesanan", { cara: state.cara, bayar: state.bayar, alamat: el("alamat").value.trim() });
  if (r.error) {
    notif(r.error);
    /* stok mungkin berubah: muat ulang katalog + keranjang agar tampilan sesuai */
    const [pr, kr] = await Promise.all([api.get("/produk"), api.get("/keranjang")]);
    if (!pr.error) db.produk = pr.data;
    if (!kr.error) db.keranjang = kr.data;
    tombol.textContent = labelTombol;
    gambarSidebar();
    render();
    return;
  }
  /* ?baru=1 → notif sukses di pesan.html */
  location.href = "pesan.html?id=" + r.data.id + "&baru=1";
};

render();
