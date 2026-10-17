/* Cari produk & rak — filter kata kunci, kategori, dan denah rak. */

const state = { q: "", kat: "", rak: "" };

function render() {
  const kata = state.q.trim().toLowerCase();
  const hasil = db.produk.filter((p) =>
    `${p.nama} ${kat(p)} rak ${p.rak}`.toLowerCase().includes(kata) &&
    (!state.kat || p.kategori === state.kat) &&
    (!state.rak || p.rak === state.rak)
  );

  isi("hasil", `${hasil.length} dari ${db.produk.length} produk${state.rak ? ` di rak ${state.rak}` : ""}`);
  isi("produk", hasil.length ? hasil.map(kartu).join("") : `<p class="kosong">Produk tidak ditemukan. Coba kata kunci, kategori, atau rak lain.</p>`);

  const jumlah = {};
  hasil.forEach((p) => (jumlah[p.rak] = (jumlah[p.rak] || 0) + 1));
  denahRak("denah", jumlah, { aktif: state.rak });
}

el("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });

chipSaring("chips", [["", "🔎 Semua"], ...db.kategori.map((k) => [k.id, `${k.ikon} ${k.nama}`])], (v) => {
  state.kat = v;
  render();
});

el("denah").addEventListener("click", (e) => {
  const c = e.target.closest(".rcell");
  if (c) { state.rak = state.rak === c.dataset.rak ? "" : c.dataset.rak; render(); }
});

render();
