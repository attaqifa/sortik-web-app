/* Pesanan & riwayat — dipakai pesan.html dan riwayat.html (body[data-status]). */

const AMBIL = { ambil: "Ambil di Tempat", antar: "Antar ke Alamat" };
const mode = document.body.dataset.status || "";
let status = "";

const tampil = (o) => (mode === "Selesai" ? !aktif(o) : aktif(o));
const pesanan = () => pesananku();   /* sudah terurut terbaru dulu dari server */

const baris = (o) => {
  const p = produkById(o.items[0].produk);
  const n = ALUR.indexOf(o.status);
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${esc(p.nama || "-")}${o.items.length > 1 ? ` + ${o.items.length - 1} produk` : ""}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${jumlahItem(o)} unit · ${rp(o.total)}${o.lunas ? "" : " · belum dibayar"}</span>
      <span class="langkah" title="Tahap ${n + 1} dari ${ALUR.length}: ${o.status}">${ALUR.map((s, i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span></div>
    ${tagStatus(o.status)}
  </button>`;
};

/* kartu pengambilan: penutup alur checkout untuk pesanan "ambil di tempat" */
const ambilKartu = (o) => {
  if (o.cara === "antar" || batal(o) || o.status === "Selesai") return "";
  const kasir = !o.lunas && o.bayar === "Bayar di kasir" ? " Bayar sekalian di kasir." : "";
  return o.status === "Siap"
    ? `<div class="ambilkartu siap"><span class="ikon" data-lucide="package-check"></span><div>
        <b>Siap diambil — iki lo barang e!</b>
        <span>Tunjukkan kode <b>${kodePesanan(o)}</b> di kasir ${esc(db.toko.nama)}.${kasir}</span></div></div>`
    : `<div class="ambilkartu"><span class="ikon" data-lucide="store"></span><div>
        <b>Ambil di kasir ${esc(db.toko.nama)}</b>
        <span>Barang sedang kami siapkan. Datang saat status berubah jadi <b>Siap</b>${db.toko.jam ? ` · ${esc(db.toko.jam)}` : ""}.</span></div></div>`;
};

const rincian = (o) => {
  const p = produkById(o.items[0].produk);
  const n = ALUR.indexOf(o.status);
  const transfer = o.bayar === "Transfer ke admin";
  return `<a class="back" href="#">← Kembali ke daftar</a>
  <ol class="steps">${ALUR.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>
  ${ambilKartu(o)}
  ${o.items.map((item) => {
    const produk = produkById(item.produk);
    return `<div class="produk-ringkas">
      <button class="foto" type="button" data-fotoproduk="${produk.id}" title="Perbesar foto produk">${fotoHTML(produk)}</button>
      <div class="ket"><b>${esc(produk.nama || "-")}</b><span>${esc(kat(produk))} · ${item.jumlah} unit</span>${produk.rak ? tagRak(produk.rak) : ""}
      <span>${rp(item.harga * item.jumlah)}</span></div></div>`;
  }).join("")}
  <div class="sum"><span>Nomor pesanan</span><b>${kodePesanan(o)} · ${tglID(o.tanggal)}</b></div>
  <div class="sum"><span>Subtotal</span><b>${rp(o.subtotal)}</b></div>
  <div class="sum"><span>Ongkir</span><b>${rp(o.ongkir)}</b></div>
  <div class="sum"><span>Total pesanan</span><b>${rp(o.total)}</b></div>
  <div class="sum"><span>Pengambilan</span><b>${AMBIL[o.cara] || AMBIL.ambil}${o.alamat ? " — " + esc(o.alamat) : ""}</b></div>
  <div class="sum"><span>Pembayaran</span><b>${esc(o.bayar || "Transfer ke admin")}</b></div>
  <div class="sum"><span>Status bayar</span><b>${tagBayar(o)}</b></div>
  ${batal(o) ? `<div class="sum"><span>Status</span><b>Dibatalkan${o.alasanBatal ? " — " + esc(o.alasanBatal) : ""}</b></div>` : ""}
  ${transfer && !batal(o) ? `<div class="bukti-blok">
    <label class="lbl">Bukti transfer</label>
    ${o.bukti
      ? `<button class="bukti-gambar" type="button" data-lihatbukti="${o.id}" title="Perbesar bukti transfer">
        <img src="${urlGambar(o.bukti)}" alt="Bukti transfer ${kodePesanan(o)}">
      </button>
      <p class="note">Bukti sudah diunggah${o.buktiPada ? " pada " + tglID(o.buktiPada.slice(0, 10)) : ""} — tinggal menunggu konfirmasi staff.</p>`
      : `<p class="note">Belum ada bukti transfer. Unggah foto/screenshot bukti transfer agar pesanan bisa dikonfirmasi.</p>`}
    ${o.lunas || batal(o) ? "" : `<div class="unggah">
      <input type="file" id="buktiFile" accept="image/*" aria-label="Pilih foto bukti transfer">
      <button class="primary garis" id="kirimBukti" type="button">${o.bukti ? "Ganti Bukti Transfer" : "Unggah Bukti Transfer"}</button>
    </div>`}
  </div>` : ""}
  <div class="aksipesan">
    ${o.items.some((x) => (produkById(x.produk).stok || 0) > 0)
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
  const o = pesananku().find((x) => x.id === id);
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
      /* perkecil di browser dulu supaya muat batas 2 MB, lalu unggah ke server */
      const kecil = dataUrlKeBlob(await bacaGambar(berkas, 1400));
      const form = new FormData();
      form.append("bukti", kecil, "bukti.jpg");
      const r = await api.unggah(`/pesanan/${o.id}/bukti`, form);
      if (r.error) { notif(r.error); kirim.disabled = false; return; }
      perbarui(r.data);
      notif("Bukti transfer terkirim — menunggu konfirmasi");
      buka(o.id);
    } catch {
      notif("Gagal membaca gambar. Coba file JPG atau PNG.");
      kirim.disabled = false;
    }
  };

  /* Beli Lagi — item kembali ke keranjang, dibatasi stok */
  const lagi = el("beliLagi");
  if (lagi) lagi.onclick = async () => {
    lagi.disabled = true;
    let ditambah = 0;
    for (const x of o.items) {
      const pr = produkById(x.produk);
      if (!pr.id || pr.stok < 1) continue;
      const r = await keranjangTambah(x.produk, x.jumlah);
      if (!r.error) ditambah++;
    }
    if (!ditambah) { lagi.disabled = false; return notif("Tidak ada barang yang dapat ditambahkan sesuai stok."); }
    notif("Ditambahkan ke keranjang");
    location.href = "checkout.html";
  };

  /* Batalkan — hanya pesanan Menunggu yang belum dibayar */
  const bantal = el("batalkan");
  if (bantal) bantal.onclick = async () => {
    const yakin = await konfirmasi("Batalkan pesanan ini?", `${kodePesanan(o)} beserta ${o.items.length} produk akan dibatalkan.`, "Ya, Batalkan");
    if (!yakin) return;
    const r = await api.post(`/pesanan/${o.id}/batal`, {});
    if (r.error) return notif(r.error);
    perbarui(r.data);
    const pr = await api.get("/produk");   /* stok kembali, muat ulang katalog */
    if (!pr.error) db.produk = pr.data;
    gambarSidebar();
    notif("Pesanan dibatalkan");
    el("detail").hidden = true;
    el("daftar").hidden = false;
    daftar();
  };
}

/* ganti pesanan di cache db dengan versi terbaru dari server */
function perbarui(baru) {
  const i = db.pesanan.findIndex((x) => x.id === baru.id);
  if (i >= 0) db.pesanan[i] = baru; else db.pesanan.unshift(baru);
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
