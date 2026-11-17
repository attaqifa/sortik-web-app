/* Cari produk & rak — filter kata kunci, kategori, dan denah rak. */

const state = {
  q: new URLSearchParams(location.search).get("q") || "",
  kat: new URLSearchParams(location.search).get("kat") || "",
  rak: new URLSearchParams(location.search).get("rak") || "",
  urut: ""
};

function render() {
  const kata = state.q.trim().toLowerCase();
  const hasil = db.produk.filter((p) =>
    `${p.nama} ${kat(p)} rak ${p.rak}`.toLowerCase().includes(kata) &&
    /* kat = "promo" → khusus barang yang sedang diskon */
    (!state.kat || (state.kat === "promo" ? p.diskon > 0 : p.kategori === state.kat)) &&
    (!state.rak || p.rak === state.rak)
  );

  /* urutan harga jual (diskon diperhitungkan); relevan = urutan asli */
  const daftar = state.urut === "murah" ? [...hasil].sort((a, b) => hargaJual(a) - hargaJual(b))
    : state.urut === "mahal" ? [...hasil].sort((a, b) => hargaJual(b) - hargaJual(a))
    : state.urut === "laris" ? [...hasil].sort((a, b) => jmlTerjual(b.id) - jmlTerjual(a.id))
    : hasil;

  isi("hasil", `${hasil.length} dari ${db.produk.length} produk${state.rak ? ` di rak ${esc(labelRak(state.rak))}` : ""}`);
  isi("produk", daftar.length ? daftar.map(kartu).join("") : pesanKosong("search-x", "Waduh, barang e durung ketemu. Coba kata kunci, kategori, atau rak lain.", ["index.html", "Kembali ke Beranda"]));

  /* baris filter aktif: ✕ melepas satu, Reset semua */
  const nameKat = state.kat === "promo" ? "Sedang Diskon"
    : (db.kategori.find((k) => k.id === state.kat) || {}).nama || state.kat;
  isi("filter", (state.kat || state.rak)
    ? `<span>Filter aktif:</span>
      ${state.kat ? `<button type="button" class="chipx" data-lepas="kat">${esc(nameKat)} <b>✕</b></button>` : ""}
      ${state.rak ? `<button type="button" class="chipx" data-lepas="rak">Rak ${esc(state.rak)} <b>✕</b></button>` : ""}
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
  /* ukuran petak menyesuaikan lebar kolom denah agar tidak perlu digeser */
  const lebarKolom = el("denah").clientWidth || 440;
  const piksel = Math.max(12, Math.min(22, Math.floor((lebarKolom - 2) / (lantaiIni().lebar || 24))));
  denahToko("denah", jumlah, { aktif: state.rak, piksel, tab: true });
}

/* denah yang baru dibuka / layar berubah ukuran → gambar ulang dengan petak yang pas */
el("denahWrap").addEventListener("toggle", () => { if (el("denahWrap").open) render(); });
let jedaUkur;
addEventListener("resize", () => { clearTimeout(jedaUkur); jedaUkur = setTimeout(render, 150); });

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

el("q").value = state.q; /* ?q=kata mengisi kolom cari */
el("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
el("urut").addEventListener("change", (e) => { state.urut = e.target.value; render(); });

chipSaring("chips", [["", `<span class="ikon" data-lucide="layout-grid"></span> Semua`], ...db.kategori.map((k) => [k.id, `${ikonKategori(k)} ${esc(k.nama)}`]), ["promo", `<span class="ikon" data-lucide="tag"></span> Sedang Diskon`]], (v) => {
  state.kat = v;
  render();
}, state.kat);

el("denah").addEventListener("click", (e) => {
  const c = e.target.closest(".prak");
  if (c) { state.rak = state.rak === c.dataset.rak ? "" : c.dataset.rak; render(); }
});

/* kursor/fokus di kartu produk → rak tempatnya menyala di denah */
const sorotRak = (kode) => {
  el("denah").querySelectorAll(".prak.sorot").forEach((r) => r.classList.remove("sorot"));
  if (kode) el("denah").querySelector(`.prak[data-rak="${CSS.escape(kode)}"]`)?.classList.add("sorot");
};
const rakKartu = (t) => {
  const a = t.closest && t.closest(".kartu a.pcard");
  const id = a && +new URL(a.href).searchParams.get("id");
  return id ? produkById(id).rak : "";
};
["mouseover", "focusin"].forEach((ev) => el("produk").addEventListener(ev, (e) => sorotRak(rakKartu(e.target))));
el("produk").addEventListener("mouseleave", () => sorotRak(""));

/* layar sempit: denah dilipat dulu agar hasil langsung terlihat */
if (matchMedia("(max-width: 1100px)").matches) el("denahWrap").open = false;

render();
