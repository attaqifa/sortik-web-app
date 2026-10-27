/* Tata rak (staff & admin) — atur denah toko multi-lantai & pindahkan barang antar rak.
   Lantai bisa ditambah / dihapus / dinamai ulang; luasnya diubah lewat kotak isian
   atau dengan menarik titik di pojok kanan bawah papan; arah pintu masuk tiap
   lantai diputar lewat daftar pilihan atau digeser langsung di tepi papan.
   Ada mode atur (rak bisa diseret) dan mode lihat (denah beku, rak bisa diklik),
   zoom (tombol maupun Ctrl+gulir) serta geser papan dengan menarik area kosong.
   Rak selalu menempel ke grid, tidak keluar lantai, dan tidak boleh saling menimpa. */

let sel = "";      /* kode rak terpilih */
let selArea = "";  /* id blok/halangan terpilih */
let atur = true; /* true = mode atur, false = mode lihat */
let zum = 1;     /* tingkat zoom sekarang: pengali ukuran kotak grid */
let zumI = 4;    /* indeks tingkat zoom pada DAFTAR_ZUM (zum = DAFTAR_ZUM[zumI]) */
const DAFTAR_ZUM = [0.4, 0.55, 0.7, 0.85, 1, 1.25, 1.5, 1.75, 2];
const PINTU_LEBAR = 3; /* lebar pintu masuk, dalam kotak grid */

const petaRak = () => db.produk.reduce((m, p) => {
  (m[p.rak] = m[p.rak] || []).push(p);
  return m;
}, {});

/* CONTOH_BLOK: saran nama blok/halangan di denah (datalist) */
const CONTOH_BLOK = ["Bagian kasir", "Lift", "Tangga", "Toilet", "Tembok", "Halangan", "Gudang", "Ruang staf", "Pintu keluar"];

/* ukuran kotak grid di layar = grid dasar × zoom */
const pikselZum = () => Math.round(db.rak.grid * zum);

/* luas minimal lantai: semua rak & blok harus muat di dalamnya (plus 1 kotak) */
const batas = (f, daftar) => (daftar.length ? Math.max(...daftar.map(f)) : 0);
const lebarMin = (L) => Math.max(8, batas((r) => r.x + r.w, L.daftar), batas((a) => a.x + a.w, L.area || [])) + 1;
const tinggiMin = (L) => Math.max(6, batas((r) => r.y + r.h, L.daftar), batas((a) => a.y + a.h, L.area || [])) + 1;

function gambar() {
  const L = lantaiIni();
  const peta = petaRak();
  /* jumlah per rak + kategorinya (kategori produk pertama) → warna rak per kategori */
  const jumlah = {};
  Object.entries(peta).forEach(([kode, daftar]) => {
    jumlah[kode] = { n: daftar.length, kategori: daftar[0].kategori };
  });
  denahToko("denah", jumlah, { aktif: sel, aktifArea: selArea, sunting: atur, piksel: pikselZum() });

  /* tab lantai milik editor: pindah lantai, hapus, dan tambah */
  isi("lantaiTab", db.rak.lantai.map((l, i) => `<span class="tab${i === db.rak.aktif ? " on" : ""}">
      <button type="button" data-ke="${i}" title="Tampilkan ${esc(l.nama)}">${esc(l.nama)}</button>
      ${db.rak.lantai.length > 1 ? `<button type="button" class="x" data-hapuslantai="${i}" title="Hapus ${esc(l.nama)}">✕</button>` : ""}
    </span>`).join("") + `<button type="button" class="tab tambah" data-tambahlantai title="Tambah lantai baru">＋ Lantai</button>`);

  /* pengaturan lantai aktif: nama, luas, arah pintu masuk */
  isi("lantaiSet", `<label>Nama lantai <input type="text" id="namaLantai" value="${esc(L.nama)}" maxlength="24" ${atur ? "" : "disabled"}></label>
    <label>Luas <input type="number" id="lebarLantai" value="${L.lebar}" min="${lebarMin(L)}" max="200" ${atur ? "" : "disabled"}> ×
    <input type="number" id="tinggiLantai" value="${L.tinggi}" min="${tinggiMin(L)}" max="200" ${atur ? "" : "disabled"}> kotak</label>
    <label>Pintu masuk <select id="sisiPintu" ${atur ? "" : "disabled"}>${["bawah", "atas", "kiri", "kanan"].map((s) =>
    `<option${L.pintu.sisi === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>
    <span class="petunjuk">Pintu juga bisa digeser langsung di tepi papan.</span>`);

  isi("info", `${db.produk.length} barang · ${L.daftar.length} rak & ${(L.area || []).length} blok di ${esc(L.nama)} · ${db.rak.lantai.length} lantai · zoom ${Math.round(zum * 100)}%.
    ${atur ? "Tarik rak/blok untuk menatanya; klik untuk mengaturnya." : "Mode lihat — klik rak untuk melihat isinya."}`);

  el("modeAtur").textContent = atur ? "✏ Mode atur" : "👁 Mode lihat";
  el("modeAtur").classList.toggle("on", atur);
  el("zumNilai").textContent = Math.round(zum * 100) + "%";

  /* legenda: keadaan rak + blok + warna per kategori */
  isi("legenda", `<span class="k">Kosong</span><span class="a">Ada barang</span><span class="o">Sedang dipilih</span>
    <span class="p">Pintu masuk</span><span class="b">Blok / halangan</span>` +
    db.kategori.map((k, i) => `<span class="ka kat${i % 8}">${esc(k.nama)}</span>`).join(""));

  el("panel").hidden = !sel && !selArea;

  /* panel blok/halangan: nama bebas (kasir, lift, tembok, ...) */
  if (selArea) {
    const a = (L.area || []).find((x) => x.id === selArea);
    if (!a) { selArea = ""; return; }
    isi("panelJudul", `Blok ${a.nama ? "— " + esc(a.nama) : "(tanpa nama)"}`);
    isi("panelIsi", `<label class="barisnama">Nama blok
      <input type="text" data-namaarea value="${esc(a.nama)}" maxlength="24" list="contohBlok"
        placeholder="mis. Bagian kasir, Lift, Tembok"></label>
      <datalist id="contohBlok">${CONTOH_BLOK.map((n) => `<option value="${n}">`).join("")}</datalist>
      <p class="petunjuk">Rak tidak boleh ditaruh menimpa blok ini. Nama boleh dikosongkan — bloknya tetap terlihat sebagai halangan.</p>`);
    return;
  }

  if (!sel) return;
  const daftar = peta[sel] || [];
  isi("panelJudul", `Rak ${sel} — ${daftar.length} barang`);
  isi("panelIsi", daftar.length ? daftar.map((p) => `<div class="row">
    <div class="thumb">${fotoHTML(p)}</div>
    <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok}</span></div>
    <select data-pindah="${p.id}" title="Pindahkan ke rak">${semuaRak().map((r) => `<option value="${r}"${r === p.rak ? " selected" : ""}>${esc(labelRak(r))}</option>`).join("")}</select>
  </div>`).join("") : pesanKosong("package", `Rak ${sel} masih kosong. Pilih rak lain di denah, lalu pindahkan barangnya ke sini.`));
}

/* klik rak/blok (tanpa menggeser) = pilih untuk dilihat/diatur */
let baruGeser = false;
el("denah").addEventListener("click", (e) => {
  if (baruGeser) return;
  const rak = e.target.closest(".prak");
  const blok = e.target.closest(".parea");
  if (rak) { sel = sel === rak.dataset.rak ? "" : rak.dataset.rak; selArea = ""; gambar(); }
  else if (blok) { selArea = selArea === blok.dataset.area ? "" : blok.dataset.area; sel = ""; gambar(); }
});

el("panel").addEventListener("change", (e) => {
  const s = e.target.closest("[data-pindah]");
  if (s) {
    const p = produkById(+s.dataset.pindah);
    p.rak = s.value;
    simpan("produk");
    notif(`${p.nama} → rak ${labelRak(s.value)}`);
    gambar();
    return;
  }
  /* ganti nama blok/halangan */
  const n = e.target.closest("[data-namaarea]");
  if (n) {
    const a = lantaiIni().area.find((x) => x.id === selArea);
    if (!a) return;
    dorong(potret());
    a.nama = n.value.trim();
    simpan("rak");
    gambar();
    notif(a.nama ? `Blok dinamai "${a.nama}".` : "Nama blok dikosongkan.");
  }
});

/* ---------- urungkan ----------
   Sebelum denah berubah, keadaan lamanya disimpan dulu (maks. 50 langkah).
   Urungkan memasang kembali keadaan yang paling baru tersimpan — termasuk
   perubahan lantai: tambah/hapus/nama/luas/posisi pintu. */
const riwayat = [];
const potret = () => JSON.stringify({ grid: db.rak.grid, aktif: db.rak.aktif, lantai: db.rak.lantai });
const dorong = (s) => { riwayat.push(s); if (riwayat.length > 50) riwayat.shift(); el("urungkan").disabled = false; };

function urungkan() {
  if (!riwayat.length) return;
  const s = JSON.parse(riwayat.pop());
  db.rak.grid = s.grid;
  db.rak.aktif = Math.min(s.aktif || 0, s.lantai.length - 1);
  db.rak.lantai = s.lantai;
  if (!lantaiIni().daftar.some((r) => r.kode === sel)) sel = "";
  if (!(lantaiIni().area || []).some((a) => a.id === selArea)) selArea = "";
  simpan("rak");
  gambar();
  el("urungkan").disabled = !riwayat.length;
  notif("Perubahan denah dikembalikan.");
}

el("urungkan").onclick = urungkan;

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); urungkan(); return; }
  if (e.target.matches("input, select, textarea")) return;
  if (e.key === "Escape" && (sel || selArea)) { sel = ""; selArea = ""; gambar(); }
  if ((e.key === "Delete" || e.key === "Backspace") && (sel || selArea) && atur) { e.preventDefault(); el("hapusRak").click(); }
});

/* ---------- geser & ubah ukuran rak / blok ---------- */
/* dua kotak saling menimpa? (kotak itu sendiri tidak dihitung) */
const tumbuk = (a, b) => a !== b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
/* rak menimpa rak lain ATAU blok/halangan */
const menimpaRak = (r) => {
  const L = lantaiIni();
  return L.daftar.some((o) => tumbuk(r, o)) || (L.area || []).some((a) => tumbuk(r, a));
};
/* blok menimpa rak ATAU blok lain */
const menimpaArea = (a) => {
  const L = lantaiIni();
  return L.daftar.some((o) => tumbuk(a, o)) || (L.area || []).some((o) => o.id !== a.id && tumbuk(a, o));
};

/* pasang posisi/ukuran kotak pada elemennya di layar; merah bila menimpa */
function tempat(elKotak, r, jenis) {
  const g = pikselZum();
  elKotak.style.left = r.x * g + "px";
  elKotak.style.top = r.y * g + "px";
  elKotak.style.width = r.w * g + "px";
  elKotak.style.height = r.h * g + "px";
  elKotak.classList.toggle("tabrak", jenis === "area" ? menimpaArea(r) : menimpaRak(r));
}

let tarik = null; /* seretan yang sedang berjalan: rak / pintu / luas / papan */

el("denah").addEventListener("pointerdown", (e) => {
  /* mode lihat: tidak ada seretan — papan tetap bisa digulir seperti biasa */
  if (!atur) return;

  const elPintu = e.target.closest(".ppintu");
  const elLuas = e.target.closest(".ukur-lantai");
  const elKotak = e.target.closest(".prak, .parea");

  /* tarik area kosong papan = geser (pan) denah */
  if (!elKotak && !elPintu && !elLuas) {
    const d = el("denah");
    tarik = { pan: true, sx: e.clientX, sy: e.clientY, sl: d.scrollLeft, st: d.scrollTop };
    d.setPointerCapture(e.pointerId);
    e.preventDefault();
    return;
  }

  const L = lantaiIni();
  const pot = potret();

  if (elPintu) {
    tarik = { pintu: true, papan: elPintu.parentElement, potret: pot };
    elPintu.setPointerCapture(e.pointerId);
    return;
  }
  if (elLuas) {
    tarik = { luas: true, papan: elLuas.parentElement, potret: pot };
    elLuas.setPointerCapture(e.pointerId);
    return;
  }

  /* rak atau blok? cari kotaknya di daftar masing-masing */
  const jenis = elKotak.classList.contains("parea") ? "area" : "rak";
  const r = jenis === "area"
    ? L.area.find((x) => x.id === elKotak.dataset.area)
    : L.daftar.find((x) => x.kode === elKotak.dataset.rak);
  const kot = elKotak.getBoundingClientRect();
  tarik = {
    jenis, r, elKotak,
    papan: elKotak.parentElement,
    ukur: !!e.target.closest(".ukur"), /* pegang titik pojok = ubah ukuran */
    asal: { ...r },   /* posisi awal — dipasang kembali bila hasilnya menimpa */
    potret: pot,      /* denah sebelum berubah — untuk urungkan */
    geser: false,
    ofsX: e.clientX - kot.left, /* titik pegang: kotak mengikuti dari titik ini */
    ofsY: e.clientY - kot.top
  };
  elKotak.setPointerCapture(e.pointerId);
});

el("denah").addEventListener("pointermove", (e) => {
  if (!tarik) return;
  const L = lantaiIni();
  const g = pikselZum();

  /* geser papan */
  if (tarik.pan) {
    const d = el("denah");
    d.scrollLeft = tarik.sl - (e.clientX - tarik.sx);
    d.scrollTop = tarik.st - (e.clientY - tarik.sy);
    tarik.jalan = true;
    return;
  }

  /* geser pintu masuk di sepanjang sisi lantainya */
  if (tarik.pintu) {
    const p = tarik.papan.getBoundingClientRect();
    const pt = L.pintu;
    const maks = Math.max(0, (pt.sisi === "kiri" || pt.sisi === "kanan" ? L.tinggi : L.lebar) - PINTU_LEBAR);
    pt.pos = pt.sisi === "kiri" || pt.sisi === "kanan"
      ? Math.max(0, Math.min(maks, Math.floor((e.clientY - p.top) / g)))
      : Math.max(0, Math.min(maks, Math.floor((e.clientX - p.left) / g)));
    tarik.jalan = true;
    tarik.papan.querySelector(".ppintu").style.cssText = gayaPintu(L, g).gaya;
    return;
  }

  /* tarik pojok papan = ubah luas lantai (tidak boleh lebih kecil dari raknya) */
  if (tarik.luas) {
    const p = tarik.papan.getBoundingClientRect();
    L.lebar = Math.max(lebarMin(L), Math.min(200, Math.ceil((e.clientX - p.left) / g)));
    L.tinggi = Math.max(tinggiMin(L), Math.min(200, Math.ceil((e.clientY - p.top) / g)));
    tarik.jalan = true;
    tarik.papan.style.width = L.lebar * g + "px";
    tarik.papan.style.height = L.tinggi * g + "px";
    return;
  }

  /* geser / ubah ukuran rak atau blok */
  const { jenis, r, elKotak, papan, ofsX, ofsY, ukur } = tarik;
  const p = papan.getBoundingClientRect();
  if (!tarik.geser) { tarik.geser = true; elKotak.classList.add("geser"); }

  if (ukur) {
    /* pojok kanan bawah: tepi kanan & bawah mengikuti tetikus, tepi kiri & atas tetap */
    r.w = Math.max(1, Math.min(L.lebar - r.x, Math.floor((e.clientX - p.left) / g) - r.x));
    r.h = Math.max(1, Math.min(L.tinggi - r.y, Math.floor((e.clientY - p.top) / g) - r.y));
  } else {
    r.x = Math.max(0, Math.min(L.lebar - r.w, Math.floor((e.clientX - p.left - ofsX) / g)));
    r.y = Math.max(0, Math.min(L.tinggi - r.h, Math.floor((e.clientY - p.top - ofsY) / g)));
  }
  tempat(elKotak, r, jenis);
});

el("denah").addEventListener("pointerup", () => {
  if (!tarik) return;
  const t = tarik;
  tarik = null;

  /* klik area kosong (tanpa menggeser) = lepas pilihan rak */
  if (t.pan) { if (!t.jalan && sel) { sel = ""; gambar(); } return; }

  /* pintu / luas lantai berubah */
  if (t.pintu || t.luas) {
    if (t.jalan) { dorong(t.potret); simpan("rak"); gambar(); }
    return;
  }

  /* rak / blok */
  t.elKotak.classList.remove("geser");
  if (!t.geser) return; /* klik biasa — dikerjakan listener click */
  baruGeser = true;
  setTimeout(() => (baruGeser = false)); /* click menyusul sebelum timer ini */
  const { jenis, r, asal } = t;
  const berubah = ["x", "y", "w", "h"].some((f) => r[f] !== asal[f]);
  const tabrak = jenis === "area" ? menimpaArea(r) : menimpaRak(r);
  if (tabrak) {
    Object.assign(r, asal);
    gambar();
    notif(jenis === "area"
      ? "Blok tidak boleh menimpa rak atau blok lain — posisi dikembalikan."
      : "Rak tidak boleh menimpa rak atau blok — posisi dikembalikan.");
  } else if (berubah) {
    dorong(t.potret);
    simpan("rak");
    gambar();
  }
});

/* seretan batal di tengah jalan (mis. notifikasi HP masuk) — kembalikan keadaan awal */
el("denah").addEventListener("pointercancel", () => {
  if (!tarik) return;
  const t = tarik;
  tarik = null;
  if (t.pan) return;
  if (t.pintu || t.luas) {
    const s = JSON.parse(t.potret);
    db.rak.aktif = s.aktif;
    db.rak.lantai = s.lantai;
    gambar();
    return;
  }
  Object.assign(t.r, t.asal);
  gambar();
});

/* ---------- tempat kosong (dipakai rak & blok) ----------
   Tidak boleh menimpa rak, blok/halangan, dan tidak keluar lantai. */
function tempatKosong(w, h) {
  const L = lantaiIni();
  const ambil = (x, y) => ({ x, y, w, h });
  for (let y = 0; y <= L.tinggi - h; y++)
    for (let x = 0; x <= L.lebar - w; x++)
      if (!L.daftar.some((o) => tumbuk(ambil(x, y), o)) && !(L.area || []).some((a) => tumbuk(ambil(x, y), a)))
        return { x, y };
  return null; /* lantai penuh */
}

/* id blok yang belum terpakai di lantai ini */
function idBlokBaru(L) {
  let i = 1;
  while (L.area.some((a) => a.id === "b" + i)) i++;
  return "b" + i;
}

/* ---------- mode atur / lihat ---------- */
el("modeAtur").onclick = () => {
  atur = !atur;
  gambar();
  notif(atur
    ? "Mode atur: rak bisa digeser, luas & pintu lantai bisa diubah."
    : "Mode lihat: denah beku — rak hanya bisa diklik untuk dilihat.");
};

/* ---------- zoom ----------
   mengubah ukuran kotak di layar saja; susunan rak (satuan kotak) tidak tersentuh */
function zumKe(i) {
  const iBaru = Math.max(0, Math.min(DAFTAR_ZUM.length - 1, i));
  if (iBaru === zumI) return;
  const lama = zum; /* zoom lama — untuk mengunci titik tengah layar */
  zum = DAFTAR_ZUM[iBaru];
  zumI = iBaru;
  /* pertahankan titik tengah layar setelah denah digambar ulang */
  const d = el("denah");
  const px = (d.scrollLeft + d.clientWidth / 2) / lama;
  const py = (d.scrollTop + d.clientHeight / 2) / lama;
  gambar();
  d.scrollLeft = Math.max(0, px * zum - d.clientWidth / 2);
  d.scrollTop = Math.max(0, py * zum - d.clientHeight / 2);
}
el("zumBesar").onclick = () => zumKe(zumI + 1);
el("zumKecil").onclick = () => zumKe(zumI - 1);

/* pas lebar: pilih zoom agar denah muat selebar wadah */
el("zumPasar").onclick = () => {
  const d = el("denah");
  const L = lantaiIni();
  zum = Math.max(0.4, Math.min(2, Math.floor(((d.clientWidth - 24) / (L.lebar * db.rak.grid)) * 20) / 20));
  zumI = Math.max(0, DAFTAR_ZUM.indexOf(zum));
  gambar();
  d.scrollLeft = 0;
  d.scrollTop = 0;
};

/* Ctrl + gulir tetikus / cubitan dua jari di papan = zoom */
el("denah").addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  zumKe(zumI + (e.deltaY < 0 ? 1 : -1));
}, { passive: false });

/* ---------- tab lantai: pindah, hapus, tambah ---------- */
el("lantaiTab").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b) return;

  /* pindah lantai */
  if (b.dataset.ke != null) {
    if (+b.dataset.ke === db.rak.aktif) return;
    db.rak.aktif = +b.dataset.ke;
    sel = ""; selArea = "";
    simpan("rak");
    gambar();
    return;
  }

  /* hapus lantai */
  if (b.dataset.hapuslantai != null) {
    const i = +b.dataset.hapuslantai;
    const L = db.rak.lantai[i];
    const kode = L.daftar.map((r) => r.kode);
    if (db.produk.some((p) => kode.includes(p.rak)))
      return notif(`${L.nama} masih berisi barang di raknya — pindahkan dulu barangnya.`);
    if (!(await konfirmasi(`Hapus ${L.nama}?`, `${L.daftar.length} rak di lantai ini ikut terhapus.`))) return;
    dorong(potret());
    db.rak.lantai.splice(i, 1);
    db.rak.aktif = Math.max(0, Math.min(db.rak.aktif, db.rak.lantai.length - 1));
    sel = ""; selArea = "";
    simpan("rak");
    gambar();
    notif(`${L.nama} dihapus.`);
    return;
  }

  /* tambah lantai baru: luas standar, kosong */
  if (b.dataset.tambahlantai != null) {
    dorong(potret());
    const L = lantaiAwal([]);
    L.nama = "Lantai " + (db.rak.lantai.length + 1);
    db.rak.lantai.push(L);
    db.rak.aktif = db.rak.lantai.length - 1;
    sel = ""; selArea = "";
    simpan("rak");
    gambar();
    notif(`${L.nama} ditambahkan — atur luasnya, letakkan pintu, lalu susun raknya.`);
  }
});

/* ---------- pengaturan lantai: nama, luas, pintu ---------- */
el("lantaiSet").addEventListener("change", (e) => {
  const L = lantaiIni();
  const awal = potret();
  let pesan = "";

  if (e.target === el("namaLantai")) {
    const nama = el("namaLantai").value.trim();
    if (nama && nama !== L.nama) { L.nama = nama; pesan = `Lantai dinamai ${nama}.`; }
  } else if (e.target === el("lebarLantai") || e.target === el("tinggiLantai")) {
    const f = e.target === el("lebarLantai") ? "lebar" : "tinggi";
    const minimal = f === "lebar" ? lebarMin(L) : tinggiMin(L);
    let v = Math.min(200, Math.round(+e.target.value || 0));
    if (v < minimal) { v = minimal; pesan = `${f === "lebar" ? "Lebar" : "Tinggi"} lantai minimal ${minimal} kotak agar semua rak muat. `; }
    L[f] = v;
    pesan += `Luas ${L.nama}: ${L.lebar}×${L.tinggi} kotak.`;
  } else if (e.target === el("sisiPintu")) {
    L.pintu.sisi = el("sisiPintu").value;
    const maks = Math.max(0, (L.pintu.sisi === "kiri" || L.pintu.sisi === "kanan" ? L.tinggi : L.lebar) - PINTU_LEBAR);
    L.pintu.pos = Math.max(0, Math.min(L.pintu.pos, maks));
    pesan = `Pintu masuk ${L.nama} dipindah ke sisi ${L.pintu.sisi}.`;
  } else return;

  dorong(awal);
  simpan("rak");
  gambar();
  if (pesan) notif(pesan);
});

/* ---------- tambah & hapus rak ---------- */
/* kode rak yang belum terpakai di lantai mana pun, dijajaki urut dari A1 sampai Z9 */
function kodeRakBaru() {
  const terpakai = new Set(db.rak.lantai.flatMap((l) => (l.daftar || []).map((r) => r.kode)));
  for (const b of "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    for (let i = 1; i <= 9; i++)
      if (!terpakai.has(b + i)) return b + i;
  return "RK" + terpakai.size;
}

/* ---------- tambah rak ---------- */
el("tambahRak").onclick = () => {
  const L = lantaiIni();
  const t = tempatKosong(4, 2);
  if (!t) return notif(`Tidak ada tempat kosong 4×2 di ${L.nama} — perluas luas lantai atau rapikan rak lain.`);
  dorong(potret());
  const r = { kode: kodeRakBaru(), w: 4, h: 2, ...t };
  L.daftar.push(r);
  sel = r.kode;
  selArea = "";
  simpan("rak");
  gambar();
  notif(`Rak ${r.kode} ditambahkan di ${L.nama} — geser ke posisinya.`);
};

/* ---------- tambah & hapus blok / halangan ---------- */
el("tambahBlok").onclick = () => {
  const L = lantaiIni();
  const t = tempatKosong(4, 2);
  if (!t) return notif(`Tidak ada tempat kosong 4×2 di ${L.nama} — perluas luas lantai.`);
  dorong(potret());
  const a = { id: idBlokBaru(L), nama: "", w: 4, h: 2, ...t };
  L.area.push(a);
  selArea = a.id;
  sel = "";
  simpan("rak");
  gambar();
  notif("Blok ditambahkan — beri namanya (mis. Bagian kasir, Lift, Tembok).");
};

el("hapusRak").onclick = () => {
  const L = lantaiIni();
  /* blok yang terpilih? hapus bloknya */
  if (selArea) {
    dorong(potret());
    L.area = L.area.filter((a) => a.id !== selArea);
    selArea = "";
    simpan("rak");
    gambar();
    return notif("Blok dihapus dari " + L.nama + ".");
  }
  if (!sel) return notif("Pilih dulu rak atau blok yang mau dihapus di denah.");
  if (db.produk.some((p) => p.rak === sel)) return notif(`Rak ${sel} masih berisi barang — pindahkan dulu isinya.`);
  if (L.daftar.length <= 1) return notif(`${L.nama} minimal harus punya satu rak.`);
  dorong(potret());
  L.daftar = L.daftar.filter((r) => r.kode !== sel);
  sel = "";
  simpan("rak");
  gambar();
  notif(`Rak dihapus dari ${L.nama}.`);
};

gambar();
