/* Jelajah toko, pembeli memilih toko yang akan dikunjungi. */

/* Kota diambil dari alamat setelah koma terakhir. */
const kotaToko = (t) => (t.alamat || "").split(",").pop().trim() || "Kota belum diisi";
/* sama dengan terlaris produk: pesanan batal tidak dihitung */
const unitToko = (t) => (t.pesanan || []).reduce((n, o) => n + (o.status === "Selesai" && o.lunas ? o.jumlah : 0), 0);
console.assert(kotaToko({ alamat: "Jl. Merdeka No. 12, Malang" }) === "Malang"
  && kotaToko({ alamat: "" }) === "Kota belum diisi", "pembacaan kota toko salah");

const state = { q: "", kota: "", urut: "" };

const kartuToko = (t) => {
  const ini = t.id === db.aktifToko;
  const kat = (t.kategori || []).slice(0, 3)
    .map((k) => `<span>${esc(k.nama)}</span>`).join("")
    + ((t.kategori || []).length > 3 ? `<span>+${t.kategori.length - 3}</span>` : "");
  const sampul = t.foto || t.logo;
  return `<article class="stoko${ini ? " on" : ""}">
    ${sampul ? `<div class="ssampul"><img src="${esc(sampul)}" alt="Foto ${esc(t.nama)}" loading="lazy" onerror="this.parentElement.remove()"></div>` : ""}
    <div class="stoko-top">
      <div class="slogo">${t.logo ? `<img src="${esc(t.logo)}" alt="">` : esc((t.nama || "T").charAt(0))}</div>
      <div>
        <h2>${esc(t.nama)}</h2>
        <span>${esc(t.alamat)}</span>
      </div>
    </div>
    <div class="smeta">
      <span>${esc(t.jam || "Jam belum diisi")}</span>
      <span>${(t.produk || []).length} produk</span>
      <span>${unitToko(t)} terjual</span>
      <span>Ongkir ${rp(t.ongkir)}</span>
    </div>
    <div class="scats">${kat}</div>
    <button class="pilih" type="button" data-pilih="${esc(t.id)}">${ini ? "Lanjut belanja di sini" : "Kunjungi toko"}</button>
  </article>`;
};

function gambar() {
  const kata = state.q.trim().toLowerCase();
  const hasil = semuaToko.filter((t) =>
    `${t.nama} ${t.alamat} ${(t.kategori || []).map((k) => k.nama).join(" ")}`.toLowerCase().includes(kata) &&
    (!state.kota || kotaToko(t) === state.kota));

  const daftar = state.urut === "laris" ? [...hasil].sort((a, b) => unitToko(b) - unitToko(a))
    : state.urut === "murah" ? [...hasil].sort((a, b) => (+a.ongkir || 0) - (+b.ongkir || 0))
    : state.urut === "lengkap" ? [...hasil].sort((a, b) => (b.produk || []).length - (a.produk || []).length)
    : state.urut === "kota" ? [...hasil].sort((a, b) => kotaToko(a).localeCompare(kotaToko(b)) || (a.nama || "").localeCompare(b.nama || ""))
    : hasil;

  isi("hasil", `${daftar.length} toko${state.kota ? ` di ${esc(state.kota)}` : kata ? " cocok" : " terdaftar"}, pilih satu untuk mulai belanja.`);
  isi("toko", daftar.length ? daftar.map(kartuToko).join("")
    : pesanKosong("store", `${state.kota ? `Belum ada toko di ${esc(state.kota)}.` : "Toko tidak ditemukan."} Ubah kata kunci, lepas filter kota, atau buka toko baru.`));
}

el("q").addEventListener("input", (e) => { state.q = e.target.value; gambar(); });
el("urut").addEventListener("change", (e) => { state.urut = e.target.value; gambar(); });
/* chip kota dibuat sekali dari seluruh toko, supaya pilihan tidak hilang saat satu kota dipilih */
chipSaring("kota", [...new Set(semuaToko.map(kotaToko))].sort().map((k) => [k, esc(k)]), (v) => { state.kota = v; gambar(); });
el("toko").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pilih]");
  if (!b) return;
  pilihToko(b.dataset.pilih);
  location.href = "index.html";
});

gambar();
