/* SORTIK — staff: tata rak
   Denah dibangun dari db.rak (app.js), isi tiap rak dari db.produk. Semua
   perubahan disimpan lewat tulis("produk"/"rak"). Saat database siap:
     PATCH /api/produk/<id> { rak }   -> memindahkan barang
     PUT   /api/rak      { baris, kolom } */

let sel = ""; /* rak yang sedang dibuka, "" = tidak ada */

/* barang per rak: { A1: [produk, ...], ... } */
const isiRak = () => db.produk.reduce((m, p) => ((m[p.rak] = [...(m[p.rak] || []), p]), m), {});

function gambar() {
  const peta = isiRak(); /* { rak: [produk, ...] } */
  el("denah").style.gridTemplateColumns = `auto repeat(${db.rak.kolom}, minmax(0, 1fr))`;
  isi("denah", db.rak.baris.split("").map((b) =>
    `<span class="rlbl">Rak ${b}</span>` +
    Array.from({ length: db.rak.kolom }, (_, i) => {
      const kode = `${b}${i + 1}`, n = (peta[kode] || []).length;
      return `<button type="button" class="rcell${n ? " ada" : ""}${kode === sel ? " on" : ""}" data-rak="${kode}">${kode}<i>${n || ""}</i></button>`;
    }).join("")
  ).join(""));

  isi("info", `${db.produk.length} barang tersebar di ${Object.keys(peta).length} dari ${semuaRak().length} rak. Klik rak untuk melihat dan memindahkan isinya.`);

  /* panel isi rak terpilih: tiap barang punya pilihan rak tujuan */
  el("panel").hidden = !sel;
  if (!sel) return;
  const daftar = peta[sel] || [];
  isi("panelJudul", `Rak ${sel} — ${daftar.length} barang`);
  isi("panelIsi", daftar.length ? daftar.map((p) => `<div class="row">
    <div class="thumb">${p.ikon || "📦"}</div>
    <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok}</span></div>
    <select data-pindah="${p.id}" title="Pindahkan ke rak">${semuaRak().map((r) => `<option${r === p.rak ? " selected" : ""}>${r}</option>`).join("")}</select>
  </div>`).join("") : `<p class="kosong">Rak ini kosong. Pilih rak lain di denah, lalu pindahkan barangnya ke ${sel}.</p>`);
}

/* klik sel rak = buka/tutup isinya */
el("denah").addEventListener("click", (e) => {
  const c = e.target.closest(".rcell");
  if (c) { sel = sel === c.dataset.rak ? "" : c.dataset.rak; gambar(); }
});

/* pindahkan barang: nilai select = rak tujuan */
el("panel").addEventListener("change", (e) => {
  const s = e.target.closest("[data-pindah]");
  if (!s) return;
  produkById(+s.dataset.pindah).rak = s.value;
  tulis("produk", db.produk); /* DB: PATCH /api/produk/<id> { rak } */
  gambar();
});

/* susunan rak: jumlah kolom + tambah/hapus baris (baris kosong saja yang boleh dihapus) */
el("kolom").value = db.rak.kolom;
el("kolom").onchange = () => {
  db.rak.kolom = Math.max(1, Math.min(12, +el("kolom").value || 1));
  el("kolom").value = db.rak.kolom;
  tulis("rak", db.rak); /* DB: PUT /api/rak */
  sel = "";
  gambar();
};

el("tambahBaris").onclick = () => {
  const berikut = String.fromCharCode(db.rak.baris.charCodeAt(db.rak.baris.length - 1) + 1);
  if (berikut > "Z") return alert("Baris rak sudah mencapai huruf Z.");
  db.rak.baris += berikut;
  tulis("rak", db.rak);
  gambar();
};

el("hapusBaris").onclick = () => {
  const akhir = db.rak.baris.slice(-1);
  if (db.rak.baris.length < 2) return alert("Minimal satu baris rak.");
  if (db.produk.some((p) => p.rak.startsWith(akhir))) return alert(`Rak ${akhir} masih berisi barang — pindahkan dulu isinya.`);
  db.rak.baris = db.rak.baris.slice(0, -1);
  sel = "";
  tulis("rak", db.rak);
  gambar();
};

gambar();
