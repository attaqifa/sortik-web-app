/* Pesanan & riwayat — dipakai pesan.html dan riwayat.html (body[data-status]). */

const AMBIL = { ambil: "Ambil di Tempat", antar: "Antar ke Alamat" };
const mode = document.body.dataset.status || "";
let status = "";

const tampil = (o) => (mode === "Selesai" ? o.status === "Selesai" : o.status !== "Selesai");
const pesanan = () => transaksi([...pesananku()]).sort((a, b) => b.tanggal.localeCompare(a.tanggal));

const baris = (o) => {
  const p = produkById(o.produk);
  const n = ALUR.indexOf(o.status);
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${esc(p.nama || "-")}${itemPesanan(o).length > 1 ? ` + ${itemPesanan(o).length - 1} produk` : ""}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${itemPesanan(o).reduce((n, x) => n + x.jumlah, 0)} unit · ${rp(totalTransaksi(o))}${o.lunas ? "" : " · belum dibayar"}</span>
      <span class="langkah" title="Tahap ${n + 1} dari ${ALUR.length}: ${o.status}">${ALUR.map((s, i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span></div>
    ${tagStatus(o.status)}
  </button>`;
};

const rincian = (o) => {
  const p = produkById(o.produk);
  const n = ALUR.indexOf(o.status);
  const transfer = o.bayar === "Transfer ke admin";
  return `<a class="back" href="#">← Kembali ke daftar</a>
  <ol class="steps">${ALUR.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>
  ${itemPesanan(o).map((item) => {
    const produk = produkById(item.produk);
    return `<div class="produk-ringkas">
      <button class="foto" type="button" data-fotoproduk="${produk.id}" title="Perbesar foto produk">${fotoHTML(produk)}</button>
      <div class="ket"><b>${esc(produk.nama || "-")}</b><span>${esc(kat(produk))} · ${item.jumlah} unit · Rak ${esc(produk.rak || "-")}</span>
      <span>${rp(subtotalPesanan(item))}</span></div></div>`;
  }).join("")}
  <div class="sum"><span>Nomor pesanan</span><b>${kodePesanan(o)} · ${tglID(o.tanggal)}</b></div>
  <div class="sum"><span>Subtotal</span><b>${rp(itemPesanan(o).reduce((n, x) => n + subtotalPesanan(x), 0))}</b></div>
  <div class="sum"><span>Ongkir</span><b>${rp(itemPesanan(o).reduce((n, x) => n + (+x.ongkir || 0), 0))}</b></div>
  <div class="sum"><span>Total pesanan</span><b>${rp(totalTransaksi(o))}</b></div>
  <div class="sum"><span>Pengambilan</span><b>${AMBIL[o.cara] || AMBIL.ambil}${o.alamat ? " — " + esc(o.alamat) : ""}</b></div>
  <div class="sum"><span>Pembayaran</span><b>${esc(o.bayar || "Transfer ke admin")}</b></div>
  <div class="sum"><span>Status bayar</span><b>${tagBayar(o)}</b></div>
  ${transfer ? `<div class="bukti-blok">
    <label class="lbl">Bukti transfer</label>
    ${o.bukti
      ? `<button class="bukti-gambar" type="button" data-lihatbukti="${o.id}" title="Perbesar bukti transfer">
        <img src="${urlGambar(o.bukti)}" alt="Bukti transfer ${kodePesanan(o)}">
      </button>
      <p class="note">Bukti sudah diunggah${o.buktiPada ? " pada " + tglID(o.buktiPada.slice(0, 10)) : ""} — tinggal menunggu konfirmasi staff.</p>`
      : `<p class="note">Belum ada bukti transfer. Unggah foto/screenshot bukti transfer agar pesanan bisa dikonfirmasi.</p>`}
    ${o.lunas ? "" : `<div class="unggah">
      <input type="file" id="buktiFile" accept="image/*" aria-label="Pilih foto bukti transfer">
      <button class="primary garis" id="kirimBukti" type="button">${o.bukti ? "Ganti Bukti Transfer" : "Unggah Bukti Transfer"}</button>
    </div>`}
  </div>` : ""}
  <div class="aksipesan">
    ${itemPesanan(o).some((x) => (produkById(x.produk).stok || 0) > 0)
      ? `<button class="primary garis" id="beliLagi" type="button">Beli Lagi</button>`
      : `<button class="primary" id="beliLagi" type="button" disabled>Beli Lagi — stok habis</button>`}
    ${o.status === "Menunggu" && o.lunas !== true ? `<button class="btn danger" id="batalkan" type="button">Batalkan Pesanan</button>` : ""}
    <a class="btn" href="https://wa.me/${String(db.toko.wa || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Halo, saya mau tanya pesanan ${kodePesanan(o)} — ${p.nama || "-"}`)}" target="_blank" rel="noopener">Tanya via WhatsApp</a>
  </div>
  <p class="note">Pembayaran dan status pesanan dikonfirmasi oleh staff ${esc(db.toko.nama)}. Hubungi
    <a href="https://wa.me/${String(db.toko.wa || "").replace(/\D/g, "")}" target="_blank" rel="noopener">+${esc(db.toko.wa)}</a> bila ada pertanyaan.</p>`;
};

function daftar() {
  const hasil = pesanan().filter((o) => tampil(o) && (!status || o.status === status));
  isi("list", hasil.length ? hasil.map(baris).join("")
    : status
      ? pesanKosong("receipt", `Belum ada pesanan berstatus ${status}.`)
      : pesanKosong("receipt", "Belum ada pesanan di sini.", ["cari.html", "Mulai belanja"]));
}

function buka(id) {
  const baris = pesananku().find((x) => x.id === id);
  const o = baris && (pesanan().find((x) => x.id === id || (baris.pesananId && x.pesananId === baris.pesananId)));
  if (!o) return;
  el("daftar").hidden = true;
  el("detail").hidden = false;
  isi("detail", rincian(o));
  el("detail").scrollIntoView();

  const kirim = el("kirimBukti");
  if (kirim) kirim.onclick = async () => {
    const berkas = el("buktiFile").files[0];
    if (!berkas) {
      notif("Pilih foto bukti transfer dulu.");
      return el("buktiFile").focus();
    }
    kirim.disabled = true;
    try {
      const foto = await bacaGambar(berkas, 1000);
      const lama = { bukti: o.bukti, buktiPada: o.buktiPada };
      o.bukti = foto;
      o.buktiPada = new Date().toISOString();
      if (!await simpan("pesanan")) {
        Object.assign(o, lama);
        kirim.disabled = false; return;
      }
      notif("Bukti transfer terkirim — menunggu konfirmasi");
      buka(o.id);
    } catch {
      notif("Gagal membaca gambar. Coba file JPG atau PNG.");
      kirim.disabled = false;
    }
  };

  /* Beli Lagi — item kembali ke keranjang, dibatasi stok */
  const lagi = el("beliLagi");
  if (lagi) lagi.onclick = () => {
    const sebelum = keranjang.map((x) => ({ ...x }));
    let ditambah = 0;
    itemPesanan(o).forEach((x) => {
      const pr = produkById(x.produk);
      if (!pr.id || pr.stok < 1) return;
      const item = keranjang.find((i) => i.produk === x.produk);
      const awal = item ? item.jumlah : 0;
      const jumlah = Math.min(pr.stok, awal + x.jumlah);
      if (item) item.jumlah = jumlah;
      else keranjang.push({ produk: x.produk, jumlah });
      ditambah += jumlah - awal;
    });
    if (!ditambah) return notif("Tidak ada barang yang dapat ditambahkan sesuai stok.");
    if (!simpanKeranjang()) { keranjang.splice(0, keranjang.length, ...sebelum); return; }
    notif("Ditambahkan ke keranjang");
    location.href = "checkout.html";
  };

  /* Batalkan — hanya pesanan Menunggu yang belum dibayar */
  const bantal = el("batalkan");
  if (bantal) bantal.onclick = async () => {
    const items = itemPesanan(o);
    if (items.some((x) => x.status !== "Menunggu" || x.lunas)) return notif("Pesanan tidak dapat dibatalkan setelah diproses atau dibayar.");
    const yakin = await konfirmasi("Batalkan pesanan ini?", `${kodePesanan(o)} beserta ${items.length} produk akan dibatalkan.`);
    if (!yakin) return;
    /* Checkout versi lama belum dikelola sebagai satu transaksi. */
    const lain = !o.pesananId && o.checkoutId && o.ongkir && db.pesanan.filter((x) => x !== o && x.checkoutId === o.checkoutId);
    const penerima = lain && lain.find((x) => !x.lunas);
    if (lain && lain.length && !penerima) return notif("Ongkir terkait pesanan yang sudah lunas. Hubungi toko untuk pembatalan.");
    if (penerima) penerima.ongkir = (+penerima.ongkir || 0) + o.ongkir;
    const sebelumnya = [...db.pesanan];
    db.pesanan = db.pesanan.filter((x) => !items.includes(x));
    if (!await simpan("pesanan")) { db.pesanan = sebelumnya; if (penerima) penerima.ongkir -= o.ongkir; return; }
    gambarSidebar();
    notif("Pesanan dibatalkan");
    el("detail").hidden = true;
    el("daftar").hidden = false;
    daftar();
  };
}

if (el("chips")) {
  /* semua tahap berjalan tampil walau sedang kosong, masing-masing dengan ikonnya */
  const tahap = ALUR.filter((s) => s !== "Selesai");
  chipSaring("chips", [["", "Semua"], ...tahap.map((s) => [s, `${ikonStatus(s)}${s}`])],
    (v) => { status = v; daftar(); }, status);
}

el("list").addEventListener("click", (e) => {
  const b = e.target.closest(".row");
  if (b) buka(+b.dataset.id);
});
el("detail").addEventListener("click", (e) => {
  const foto = e.target.closest("[data-fotoproduk]");
  if (foto) {
    const pr = produkById(+foto.dataset.fotoproduk);
    const sumber = galeriProduk(pr)[0];
    if (sumber) lihatGambar(sumber, pr.nama);
    else notif("Produk ini belum punya foto.");
    return;
  }
  const lihat = e.target.closest("[data-lihatbukti]");
  if (lihat) {
    const o = pesanan().find((x) => x.id === +lihat.dataset.lihatbukti);
    if (o && o.bukti) lihatGambar(o.bukti, `Bukti transfer ${kodePesanan(o)}`);
    return;
  }
  if (e.target.closest(".back")) {
    e.preventDefault();
    el("detail").hidden = true;
    el("daftar").hidden = false;
  }
});

daftar();

/* ?id= langsung buka detail; ?baru=1 → notif sukses */
const saring = new URLSearchParams(location.search);
const masuk = +saring.get("id");
if (masuk) {
  const o = pesananku().find((x) => x.id === masuk);
  if (o) {
    buka(masuk);
    if (saring.get("baru")) notif(`Pesanan ${kodePesanan(o)} dibuat — unggah bukti bila transfer`);
  }
}
