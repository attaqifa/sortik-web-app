/* Pesan & booking — dipakai pesan.html dan riwayat.html (body[data-status]). */

const AMBIL = { ambil: "Ambil di Tempat", antar: "Antar ke Alamat" };
const mode = document.body.dataset.status || "";
let status = "";

const tampil = (o) => (mode === "Selesai" ? o.status === "Selesai" : o.status !== "Selesai");
const pesanan = () => [...pesananku()].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

const baris = (o) => {
  const p = produkById(o.produk);
  return `<button class="row" data-id="${o.id}">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama || "-"}</b><span>${kodePesanan(o)} · ${tglID(o.tanggal)} · ${o.jumlah} item · ${rp(nilaiPesanan(o))}${o.lunas ? "" : " · belum dibayar"}</span></div>
    <em class="${STATUS[o.status] || ""}">${o.status}</em>
  </button>`;
};

const rincian = (o) => {
  const p = produkById(o.produk);
  const n = ALUR.indexOf(o.status);
  const transfer = o.bayar === "Transfer ke admin";
  return `<a class="back" href="#">← Kembali ke daftar</a>
  <ol class="steps">${ALUR.map((s, i) => `<li data-n="${i + 1}"${i <= n ? ' class="on"' : ""}>${s}</li>`).join("")}</ol>
  <div class="produk-ringkas">
    <button class="foto" type="button" data-fotoproduk="${p.id}" title="Perbesar foto produk">${fotoHTML(p)}</button>
    <div class="ket">
      <b>${p.nama || "-"}</b>
      <span>${kodePesanan(o)} · ${tglID(o.tanggal)}</span>
      <span>${kat(p)} · ${o.jumlah} unit · Rak ${p.rak || "-"}</span>
      <em class="${STATUS[o.status] || ""}">${o.status}</em>
    </div>
  </div>
  <div class="sum"><span>Subtotal</span><b>${rp(nilaiPesanan(o))}</b></div>
  <div class="sum"><span>Pengambilan</span><b>${AMBIL[o.cara] || AMBIL.ambil}${o.alamat ? " — " + o.alamat : ""}</b></div>
  <div class="sum"><span>Pembayaran</span><b>${o.bayar || "Transfer ke admin"}</b></div>
  <div class="sum"><span>Status bayar</span><b>${tagBayar(o)}</b></div>
  ${transfer ? `<div class="bukti-blok">
    <label class="lbl">Bukti transfer</label>
    ${o.bukti
      ? `<button class="bukti-gambar" type="button" data-lihatbukti="${o.id}" title="Perbesar bukti transfer">
        <img src="${o.bukti}" alt="Bukti transfer ${kodePesanan(o)}">
      </button>
      <p class="note">Bukti sudah diunggah${o.buktiPada ? " pada " + tglID(o.buktiPada.slice(0, 10)) : ""} — tinggal menunggu konfirmasi staff.</p>`
      : `<p class="note">Belum ada bukti transfer. Unggah foto/screenshot bukti transfer agar pesanan bisa dikonfirmasi.</p>`}
    ${o.lunas ? "" : `<div class="unggah">
      <input type="file" id="buktiFile" accept="image/*" aria-label="Pilih foto bukti transfer">
      <button class="primary garis" id="kirimBukti" type="button">${o.bukti ? "Ganti Bukti Transfer" : "Unggah Bukti Transfer"}</button>
    </div>`}
  </div>` : ""}
  <p class="note">Pembayaran dan status pesanan dikonfirmasi oleh staff ${db.toko.nama}. Hubungi
    <a href="https://wa.me/${db.toko.wa}" target="_blank" rel="noopener">+${db.toko.wa}</a> bila ada pertanyaan.</p>`;
};

function daftar() {
  const hasil = pesanan().filter((o) => tampil(o) && (!status || o.status === status));
  isi("list", hasil.length ? hasil.map(baris).join("") : `<p class="kosong">Belum ada pesanan di sini.</p>`);
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
      simpan("pesanan");
      notif("Bukti transfer terkirim — menunggu konfirmasi");
      buka(o.id);
    } catch {
      notif("Gagal membaca gambar. Coba file JPG atau PNG.");
      kirim.disabled = false;
    }
  };
}

if (el("chips")) {
  const ada = [...new Set(pesananku().filter(tampil).map((o) => o.status))].sort((a, b) => ALUR.indexOf(a) - ALUR.indexOf(b));
  chipSaring("chips", [["", "Semua"], ...ada.map((s) => [s, s])], (v) => { status = v; daftar(); });
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
