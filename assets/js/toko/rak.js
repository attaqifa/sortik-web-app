/* Tata rak — pindahkan barang antar rak dan atur susunan rak.
   Skrip bersama: dipakai staff/rak.html dan admin/rak.html. Jangan menaruh
   logika khusus peran di sini; peran hanya memengaruhi menu di core/store.js. */

let sel = "";

const petaRak = () => db.produk.reduce((m, p) => {
  (m[p.rak] = m[p.rak] || []).push(p);
  return m;
}, {});

function gambar() {
  const peta = petaRak();
  const jumlah = Object.fromEntries(Object.entries(peta).map(([kode, daftar]) => [kode, daftar.length]));
  denahRak("denah", jumlah, { aktif: sel });
  isi("info", `${db.produk.length} barang di ${Object.keys(peta).length} dari ${semuaRak().length} rak. Klik rak untuk melihat dan memindahkan isinya.`);

  el("panel").hidden = !sel;
  if (!sel) return;
  const daftar = peta[sel] || [];
  isi("panelJudul", `Rak ${sel} — ${daftar.length} barang`);
  isi("panelIsi", daftar.length ? daftar.map((p) => `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok}</span></div>
    <select data-pindah="${p.id}" title="Pindahkan ke rak">${semuaRak().map((r) => `<option${r === p.rak ? " selected" : ""}>${r}</option>`).join("")}</select>
  </div>`).join("") : `<p class="kosong">Rak ini kosong. Pilih rak lain di denah, lalu pindahkan barangnya ke ${sel}.</p>`);
}

el("denah").addEventListener("click", (e) => {
  const c = e.target.closest(".rcell");
  if (c) { sel = sel === c.dataset.rak ? "" : c.dataset.rak; gambar(); }
});

el("panel").addEventListener("change", (e) => {
  const s = e.target.closest("[data-pindah]");
  if (!s) return;
  const p = produkById(+s.dataset.pindah);
  p.rak = s.value;
  simpan("produk");
  notif(`${p.nama} → rak ${s.value}`);
  gambar();
});

el("kolom").value = db.rak.kolom;
el("kolom").onchange = () => {
  db.rak.kolom = Math.max(1, Math.min(12, +el("kolom").value || 1));
  el("kolom").value = db.rak.kolom;
  simpan("rak");
  sel = "";
  gambar();
};

el("tambahBaris").onclick = () => {
  const akhir = db.rak.baris.slice(-1);
  if (akhir >= "Z") return alert("Baris rak sudah mencapai huruf Z.");
  db.rak.baris += String.fromCharCode(akhir.charCodeAt(0) + 1);
  simpan("rak");
  gambar();
};

el("hapusBaris").onclick = () => {
  const akhir = db.rak.baris.slice(-1);
  if (db.rak.baris.length < 2) return alert("Minimal satu baris rak.");
  if (db.produk.some((p) => p.rak.startsWith(akhir))) return alert(`Rak ${akhir} masih berisi barang — pindahkan dulu isinya.`);
  db.rak.baris = db.rak.baris.slice(0, -1);
  sel = "";
  simpan("rak");
  gambar();
};

gambar();
