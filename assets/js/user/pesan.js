/* Pesanan & riwayat, dipakai pesan.html dan riwayat.html (body[data-status]).
   Daftar ini gabungan semua toko, jadi satu pembeli tetap melihat seluruh
   pesannya walau sedang membuka toko lain. */

const AMBIL = { ambil: "Ambil di Tempat", antar: "Antar ke Alamat" };
const mode = document.body.dataset.status || "";
let status = "";

/* Riwayat = yang sudah tidak berjalan (selesai atau dibatalkan) */
const tampil = (o) => (mode === "Selesai" ? !pesananJalan(o) : pesananJalan(o));
const pesanan = () => [...pesananku()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

const baris = (o) => {
  const p = produkPesanan(o);
  const n = ALUR.indexOf(o.status);
  /* nama toko hanya perlu bila pesanan itu bukan dari toko yang sedang dibuka */
  const dari = o.toko === db.aktifToko ? "" : esc(labelToko(o.toko)) + " · ";
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${dari}${tglID(o.tanggal)} · ${o.jumlah} item · ${rp(nilaiPesanan(o))}${o.lunas ? "" : " · belum dibayar"}</span>
      <span class="langkah" title="Tahap ${n + 1} dari ${ALUR.length}: ${o.status}">${ALUR.map((s, i) => `<i${i <= n ? ' class="on"' : ""}></i>`).join("")}</span></div>
    ${tagStatus(o.status)}
  </button>`;
};

const rincian = (o) => {
  const p = produkPesanan(o);
  const t = tokoById(o.toko);
  const n = ALUR.indexOf(o.status);
  const transfer = o.bayar === "Transfer ke admin";
  return `<a class="back" href="#">← Kembali ke daftar</a>
  ${o.status === BATAL
    ? `<p class="note"><b>Pesanan ini dibatalkan.</b> Barisnya tidak dihapus, hanya statusnya yang berubah.</p>`
    : `<ol class="steps">${ALUR.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>`}
  <div class="produk-ringkas">
    <button class="foto" type="button" data-fotoproduk="${o.id}" title="Perbesar foto produk">${fotoHTML(p)}</button>
    <div class="ket">
      <b>${p.nama || "-"}</b>
      <span>${kodePesanan(o)} · ${esc(labelToko(o.toko))} · ${tglID(o.tanggal)}</span>
      <span>${kat(p)} · ${o.jumlah} unit · Rak ${p.rak || "-"}</span>
      ${tagStatus(o.status)}
    </div>
  </div>
  <div class="sum"><span>Subtotal</span><b>${rp(nilaiBarang(o))}</b></div>
  ${o.ongkir ? `<div class="sum"><span>Ongkir</span><b>${rp(o.ongkir)}</b></div>` : ""}
  <div class="sum tot"><span>Total</span><b>${rp(nilaiPesanan(o))}</b></div>
  <div class="sum"><span>Pengambilan</span><b>${AMBIL[o.cara] || AMBIL.ambil}${o.alamat ? ", " + esc(o.alamat) : ""}</b></div>
  <div class="sum"><span>Pembayaran</span><b>${esc(o.bayar || "Transfer ke admin")}</b></div>
  <div class="sum"><span>Status bayar</span><b>${tagBayar(o)}</b></div>
  ${transfer && o.status !== BATAL ? `<div class="bukti-blok">
    <label class="lbl">Bukti transfer</label>
    ${o.bukti
      ? `<button class="bukti-gambar" type="button" data-lihatbukti="${o.id}" title="Perbesar bukti transfer">
        <img src="${o.bukti}" alt="Bukti transfer ${kodePesanan(o)}">
      </button>
      <p class="note">Bukti sudah diunggah${o.buktiPada ? " pada " + tglID(o.buktiPada.slice(0, 10)) : ""}, tinggal menunggu konfirmasi staff.</p>`
      : `<p class="note">Belum ada bukti transfer. Unggah foto/screenshot bukti transfer agar pesanan bisa dikonfirmasi.</p>`}
    ${o.lunas ? "" : `<div class="unggah">
      <input type="file" id="buktiFile" accept="image/*" aria-label="Pilih foto bukti transfer">
      <button class="primary garis" id="kirimBukti" type="button">${o.bukti ? "Ganti Bukti Transfer" : "Unggah Bukti Transfer"}</button>
    </div>`}
  </div>` : ""}
  <div class="aksipesan">
    ${(p.stok || 0) > 0
      ? `<button class="primary garis" id="beliLagi" type="button">Beli Lagi${o.toko !== db.aktifToko ? " di " + esc(t.nama || "toko ini") : ""}</button>`
      : `<button class="primary" id="beliLagi" type="button" disabled>Beli Lagi, stok habis</button>`}
    ${o.status === "Menunggu" && o.lunas !== true ? `<button class="btn danger" id="batalkan" type="button">Batalkan Pesanan</button>` : ""}
    <a class="btn" href="https://wa.me/${t.wa || db.toko.wa}?text=${encodeURIComponent(`Halo, saya mau tanya pesanan ${kodePesanan(o)}, ${p.nama || "-"}`)}" target="_blank" rel="noopener">Tanya via WhatsApp</a>
  </div>
  <p class="note">Pembayaran dan status pesanan dikonfirmasi oleh staff ${esc(t.nama || db.toko.nama)}. Hubungi
    <a href="https://wa.me/${t.wa || db.toko.wa}" target="_blank" rel="noopener">+${esc(t.wa || db.toko.wa)}</a> bila ada pertanyaan.</p>`;
};

function daftar() {
  const hasil = pesanan().filter((o) => tampil(o) && (!status || o.status === status));
  isi("list", hasil.length ? hasil.map(baris).join("")
    : status
      ? pesanKosong("receipt", `Belum ada pesanan berstatus ${status}.`)
      : pesanKosong("receipt", "Belum ada pesanan di sini.", ["cari.html", "Mulai belanja"]));
}

function buka(id) {
  const o = pesanan().find((x) => x.id === id);
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
      o.bukti = await bacaGambar(berkas, 1000);
      o.buktiPada = new Date().toISOString();
      simpanPesanan(o);
      notif("Bukti transfer terkirim, menunggu konfirmasi");
      buka(o.id);
    } catch {
      notif("Gagal membaca gambar. Coba file JPG atau PNG.");
      kirim.disabled = false;
    }
  };

  /* Beli Lagi, item kembali ke keranjang, dibatasi stok.
     Pesanan dari toko lain masuk ke keranjang toko itu, lalu tokonya dibuka. */
  const lagi = el("beliLagi");
  if (lagi) lagi.onclick = () => {
    const pr = produkPesanan(o);
    if ((pr.stok || 0) < 1) return notif("Stok produk ini habis.");
    const n = Math.min(pr.stok, o.jumlah);
    if (o.toko && o.toko !== db.aktifToko) {
      tambahKeranjangToko(o.toko, o.produk, n);
      pilihToko(o.toko);
      location.href = "checkout.html";
      return;
    }
    const item = keranjang.find((i) => i.produk === o.produk);
    if (item) item.jumlah = Math.min(pr.stok, item.jumlah + n);
    else keranjang.push({ produk: o.produk, jumlah: n });
    simpanKeranjang();
    notif("Ditambahkan ke keranjang");
    location.href = "checkout.html";
  };

  /* Batalkan, hanya pesanan Menunggu yang belum dibayar; barisnya tetap ada */
  const bantal = el("batalkan");
  if (bantal) bantal.onclick = async () => {
    const pr = produkPesanan(o);
    const yakin = await konfirmasi("Batalkan pesanan ini?",
      `${kodePesanan(o)}, ${pr.nama || "-"} (${rp(nilaiPesanan(o))}) ditandai dibatalkan dan pindah ke Riwayat.`,
      "Ya, Batalkan");
    if (!yakin) return;
    o.status = BATAL;
    simpanPesanan(o);
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
    const o = pesanan().find((x) => x.id === +foto.dataset.fotoproduk);
    const pr = o ? produkPesanan(o) : {};
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
    if (saring.get("baru")) notif(`Pesanan ${kodePesanan(o)} dibuat, unggah bukti bila transfer`);
  }
}
