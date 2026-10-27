/* Cari produk & rak — filter kata kunci, kategori, dan denah rak. */

const state = {
  q: "",
  kat: new URLSearchParams(location.search).get("kat") || "",
  rak: new URLSearchParams(location.search).get("rak") || "",
  urut: ""
};

function render() {
  const kata = state.q.trim().toLowerCase();
  const hasil = db.produk.filter((p) =>
    `${p.nama} ${kat(p)} rak ${p.rak}`.toLowerCase().includes(kata) &&
    (!state.kat || p.kategori === state.kat) &&
    (!state.rak || p.rak === state.rak)
  );

  /* urutan harga; relevan = urutan asli */
  const daftar = state.urut === "murah" ? [...hasil].sort((a, b) => a.harga - b.harga)
    : state.urut === "mahal" ? [...hasil].sort((a, b) => b.harga - a.harga)
    : hasil;

  isi("hasil", `${hasil.length} dari ${db.produk.length} produk${state.rak ? ` di rak ${labelRak(state.rak)}` : ""}`);
  isi("produk", daftar.length ? daftar.map(kartu).join("") : pesanKosong("search-x", "Produk tidak ditemukan. Coba kata kunci, kategori, atau rak lain."));

  /* baris filter aktif: ✕ melepas satu, Reset semua */
  const nameKat = (db.kategori.find((k) => k.id === state.kat) || {}).nama || state.kat;
  isi("filter", (state.kat || state.rak)
    ? `<span>Filter aktif:</span>
      ${state.kat ? `<button type="button" class="chipx" data-lepas="kat">${nameKat} <b>✕</b></button>` : ""}
      ${state.rak ? `<button type="button" class="chipx" data-lepas="rak">Rak ${state.rak} <b>✕</b></button>` : ""}
      <button type="button" class="btn" data-reset>Reset</button>`
    : "");

  const jumlah = {};
  hasil.forEach((p) => {
    /* { n, kategori } → warna rak mengikuti kategori barangnya */
    const h = jumlah[p.rak] = jumlah[p.rak] || { n: 0, kategori: p.kategori };
    h.n++;
  });
  /* rak hasil cari mungkin di lantai lain — tampilkan lantai tempat rak terpilih */
  if (state.rak) { const i = lantaiDari(state.rak); if (i >= 0) db.rak.aktif = i; }
  /* denah mini: kotak grid lebih kecil, rak berisi hasil cari ikut tersorot,
     ada tab lantai bila tokonya beberapa lantai */
  denahToko("denah", jumlah, { aktif: state.rak, piksel: 20, tab: true });
}

el("filter").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  /* atribut kosong itu falsy — bandingkan dengan != null */
  if (b.dataset.reset != null) { state.kat = ""; state.rak = ""; }
  else if (b.dataset.lepas) state[b.dataset.lepas] = "";
  else return;
  /* sinkron sorotan chip & denah */
  el("chips").querySelectorAll("button").forEach((c) => c.classList.toggle("on", c.dataset.nilai === state.kat));
  render();
});

el("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
el("urut").addEventListener("change", (e) => { state.urut = e.target.value; render(); });

chipSaring("chips", [["", `<span class="ikon" data-lucide="layout-grid"></span> Semua`], ...db.kategori.map((k) => [k.id, `${ikonKategori(k)} ${k.nama}`])], (v) => {
  state.kat = v;
  render();
}, state.kat);

el("denah").addEventListener("click", (e) => {
  const c = e.target.closest(".prak");
  if (c) { state.rak = state.rak === c.dataset.rak ? "" : c.dataset.rak; render(); }
});

render();
