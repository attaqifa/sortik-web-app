/* SORTIK — cari produk & rak (filter di atas `db` di app.js) */

const namaKat = Object.fromEntries(db.kategori.map((k) => [k.id, k.nama])); /* id -> nama */
const kat = (p) => namaKat[p.kategori] || p.kategori;
const state = { q: "", kat: "", rak: "" };

/* chip kategori, "" = tanpa filter */
const chips = [["", "Semua", "🔎"], ...db.kategori.map((k) => [k.id, k.nama, k.ikon])];
isi("chips", chips.map(([id, nama, ikon]) => `<button type="button" data-kat="${id}">${ikon} ${nama}</button>`).join(""));

/* denah rak A1…J6 dibangun dari db.rak */
const denah = el("denah");
denah.style.gridTemplateColumns = `auto repeat(${db.rak.kolom}, minmax(0, 1fr))`;
isi("denah", db.rak.baris.split("").map((b) =>
  `<span class="rlbl">Rak ${b}</span>` +
  Array.from({ length: db.rak.kolom }, (_, i) => `<button type="button" class="rcell" data-rak="${b}${i + 1}">${b}${i + 1}</button>`).join("")
).join(""));

/* satu kartu produk */
const kartu = (p) => `<article class="pcard">
  <div class="pimg">${p.ikon || "📦"}</div>
  <div>
    <h3>${p.nama}</h3>
    <span class="pcat">${kat(p)}</span>
    <b>${rp(p.harga)}</b>
    <span class="pstok">Stok: ${p.stok} unit · Rak ${p.rak}</span>
  </div>
</article>`;

function render() {
  const kata = state.q.trim().toLowerCase();
  const hasil = db.produk.filter((p) =>
    `${p.nama} ${kat(p)} rak ${p.rak}`.toLowerCase().includes(kata) &&
    (!state.kat || p.kategori === state.kat) && (!state.rak || p.rak === state.rak)
  );
  const rakAda = new Set(hasil.map((p) => p.rak));

  isi("hasil", `${hasil.length} dari ${db.produk.length} produk${state.rak ? ` di rak ${state.rak}` : ""}`);
  isi("produk", hasil.length ? hasil.map(kartu).join("") : `<p class="kosong">Produk tidak ditemukan. Coba kata kunci, kategori, atau rak lain.</p>`);

  /* tandai rak yang berisi hasil filter, dan rak yang sedang dipilih */
  document.querySelectorAll(".rcell").forEach((c) =>
    c.className = "rcell" + (rakAda.has(c.dataset.rak) ? " ada" : "") + (c.dataset.rak === state.rak ? " on" : "")
  );
  document.querySelectorAll("#chips button").forEach((b) => b.classList.toggle("on", b.dataset.kat === state.kat));
}

/* filter: ketik, klik chip kategori, klik sel rak */
el("q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
el("chips").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) { state.kat = state.kat === b.dataset.kat ? "" : b.dataset.kat; render(); }
});
denah.addEventListener("click", (e) => {
  const c = e.target.closest(".rcell");
  if (c) { state.rak = state.rak === c.dataset.rak ? "" : c.dataset.rak; render(); }
});

render();
