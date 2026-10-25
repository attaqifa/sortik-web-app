/* SORTIK — mesin kelola: daftar + form tambah/ubah + hapus.
   kolom = [[field, label, jenis, opsi]]; jenis: text|angka|email|pilih|area|foto|galeri.
   baru(data) boleh null untuk menolak; cek(item) mengembalikan pesan penolakan. */

function kelola({ wadah, kunci, nama, kolom, baris, kode = "", petunjuk = "Cari...", cari, urut, baru, cek }) {
  el(wadah).innerHTML = `<div class="formblok" id="${wadah}-blok" hidden>
  <h2 id="${wadah}-judul"></h2>
  <form class="form" id="${wadah}-form"></form>
</div>
<div class="toolbar">
  <input type="search" id="${wadah}-q" class="grow" placeholder="${petunjuk}" autocomplete="off">
  <button class="btn" type="button" data-tambah>+ Tambah ${nama}</button>
</div>
<p class="hasil" id="${wadah}-hasil"></p>
<div id="${wadah}-list"></div>`;

  let tampil = [];
  let ubah = null; /* baris yang sedang diubah; null = mode tambah */
  let foto = {}; /* foto utama yang sedang diedit: { namaField: dataURL/tautan } */
  let galeri = {}; /* foto detail (array) yang sedang diedit: { namaField: [src, ...] } */

  const TIPE = { angka: "number", email: "email" };
  const medan = ([f, label, jenis, opsi = []]) => {
    const id = `${wadah}-${f}`;
    const pilihan = typeof opsi === "function" ? opsi() : opsi;
    const kontrol = jenis === "pilih"
      ? `<select id="${id}" data-f="${f}">${pilihan.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`
      : jenis === "area" ? `<textarea id="${id}" data-f="${f}" rows="3"></textarea>`
        : jenis === "foto" ? `<div class="medanfoto">
        <div class="pratinjau" id="${id}-pratinjau"></div>
        <div class="pilihfoto">
          <input id="${id}-url" data-fotourl="${f}" type="url" placeholder="https://contoh.com/foto-produk.jpg" autocomplete="off">
          <div class="barisfoto">
            <input id="${id}" data-foto="${f}" type="file" accept="image/*">
            <button class="btn danger" type="button" data-hapusfoto="${f}" hidden>Hapus foto</button>
          </div>
          <span class="petunjuk">Tempel tautan gambar dari internet, atau unggah berkas JPG/PNG (otomatis diperkecil).</span>
        </div>
      </div>`
        : jenis === "galeri" ? `<div class="medangaleri">
        <div class="daftarfoto" id="${id}-daftar"></div>
        <div class="pilihfoto">
          <input id="${id}-url" data-galeriurl="${f}" type="url" placeholder="https://contoh.com/foto-detail.jpg" autocomplete="off">
          <div class="barisfoto">
            <button class="btn" type="button" data-tambahgaleri="${f}">+ Tambah dari tautan</button>
            <input id="${id}" data-galeri="${f}" type="file" accept="image/*" multiple>
          </div>
          <span class="petunjuk">Boleh beberapa foto: tempel tautan lalu klik tambah, atau pilih beberapa berkas sekaligus.</span>
        </div>
      </div>`
          : `<input id="${id}" data-f="${f}" type="${TIPE[jenis] || "text"}">`;
    return `<div${jenis === "area" || jenis === "foto" || jenis === "galeri" ? ' class="full"' : ""}><label class="lbl" for="${id}">${label}</label>${kontrol}</div>`;
  };

  function pratinjauFoto(f) {
    const kotak = el(`${wadah}-${f}-pratinjau`);
    if (!kotak) return;
    kotak.innerHTML = foto[f] ? `<img src="${foto[f]}" alt="Pratinjau foto">` : `<span>Belum ada foto</span>`;
    const hapus = el(`${wadah}-${f}`).closest(".medanfoto").querySelector("[data-hapusfoto]");
    if (hapus) hapus.hidden = !foto[f];
  }

  function renderGaleri(f) {
    const kotak = el(`${wadah}-${f}-daftar`);
    if (!kotak) return;
    const daftar = galeri[f] || [];
    kotak.innerHTML = daftar.length
      ? daftar.map((s, i) => `<div class="minifoto">
        <img src="${s}" alt="Foto detail ${i + 1}">
        <button type="button" class="x" data-hapusgaleri="${f}" data-i="${i}" title="Hapus foto">✕</button>
      </div>`).join("")
      : `<span class="petunjuk">Belum ada foto detail.</span>`;
  }

  function buka(x = null) {
    ubah = x;
    foto = {};
    galeri = {};
    isi(`${wadah}-judul`, x ? `Ubah ${nama} · ${kode}${String(x.id).padStart(3, "0")}` : `Tambah ${nama}`);
    isi(`${wadah}-form`, kolom.map(medan).join("") +
      `<div class="btns full"><button class="primary" type="submit">Simpan</button>
      <button class="btn" type="button" data-batal>Batal</button></div>`);
    kolom.forEach(([f, , jenis]) => {
      if (jenis === "foto") {
        foto[f] = (x && x[f]) || "";
        pratinjauFoto(f);
        const url = el(`${wadah}-${f}-url`);
        if (url) url.value = /^data:/.test(foto[f]) ? "" : foto[f];
        return;
      }
      if (jenis === "galeri") {
        galeri[f] = [...((x && x[f]) || [])];
        renderGaleri(f);
        return;
      }
      const x2 = el(`${wadah}-${f}`);
      if (x2 && x && x[f] != null) x2.value = x[f];
    });
    el(`${wadah}-blok`).hidden = false;
    el(`${wadah}-blok`).scrollIntoView();
    el(`${wadah}-${kolom[0][0]}`).focus();
  }

  function simpanBaris() {
    const data = {};
    el(`${wadah}-form`).querySelectorAll("[data-f]").forEach((x) => {
      data[x.dataset.f] = x.type === "number" ? +x.value || 0 : x.value.trim();
    });
    kolom.forEach(([f, , jenis]) => {
      if (jenis === "foto") data[f] = foto[f] || "";
      if (jenis === "galeri") data[f] = galeri[f] || [];
    });
    const pertama = el(`${wadah}-${kolom[0][0]}`);
    if (!data[kolom[0][0]]) return pertama.focus();
    if (ubah) Object.assign(ubah, data);
    else {
      const x = baru ? baru(data) : { id: Math.max(0, ...db[kunci].map((y) => y.id)) + 1, ...data };
      if (!x) return;
      db[kunci].push(x);
    }
    simpan(kunci);
    notif(`${nama} ${ubah ? "diperbarui" : "ditambahkan"}`);
    el(`${wadah}-blok`).hidden = true;
    gambar();
  }

  async function hapus(i) {
    const x = tampil[i];
    const salah = cek && cek(x);
    if (salah) return notif(salah);
    const yakin = await konfirmasi(
      `Hapus ${nama.toLowerCase()} ini?`,
      `"${x[kolom[0][0]]}" akan dihapus permanen dari daftar ${nama.toLowerCase()}. Tindakan ini tidak bisa dibatalkan.`
    );
    if (!yakin) return;
    if (x === ubah) el(`${wadah}-blok`).hidden = true;
    db[kunci].splice(db[kunci].indexOf(x), 1);
    simpan(kunci);
    notif(`${nama} dihapus`);
    gambar();
  }

  function gambar() {
    const kata = el(`${wadah}-q`).value.trim().toLowerCase();
    tampil = db[kunci].filter((x) => String(cari ? cari(x) : Object.values(x).join(" ")).toLowerCase().includes(kata));
    if (urut) tampil.sort(urut);
    isi(`${wadah}-hasil`, `${tampil.length} dari ${db[kunci].length} ${nama.toLowerCase()}`);
    isi(`${wadah}-list`, tampil.length ? tampil.map((x, i) => `<div class="row">${baris(x, i)}
  <div class="btns">
    <button class="btn" type="button" data-ubah="${i}">Ubah</button>
    <button class="btn danger" type="button" data-hapus="${i}">Hapus</button>
  </div>
</div>`).join("") : pesanKosong("search-x", `Belum ada ${nama.toLowerCase()} yang cocok — ubah kata kunci atau tambah baru.`));
  }

  el(wadah).addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.hapusfoto != null) {
      const f = b.dataset.hapusfoto;
      foto[f] = "";
      const url = el(`${wadah}-${f}-url`);
      if (url) url.value = "";
      const berkas = el(`${wadah}-${f}`);
      if (berkas) berkas.value = "";
      pratinjauFoto(f);
      return;
    }
    if (b.dataset.tambahgaleri != null) {
      const f = b.dataset.tambahgaleri;
      const url = el(`${wadah}-${f}-url`);
      const nilai = url.value.trim();
      if (!nilai) return url.focus();
      galeri[f] = [...(galeri[f] || []), nilai];
      url.value = "";
      renderGaleri(f);
      return;
    }
    if (b.dataset.hapusgaleri != null) {
      const f = b.dataset.hapusgaleri;
      (galeri[f] = galeri[f] || []).splice(+b.dataset.i, 1);
      renderGaleri(f);
      return;
    }
    if (b.dataset.ubah != null) return buka(tampil[+b.dataset.ubah]);
    if (b.dataset.hapus != null) return hapus(+b.dataset.hapus);
    if (b.dataset.tambah != null) return buka();
    if (b.dataset.batal != null) el(`${wadah}-blok`).hidden = true;
  });
  el(`${wadah}-form`).addEventListener("submit", (e) => { e.preventDefault(); simpanBaris(); });
  el(`${wadah}-form`).addEventListener("input", (e) => {
    const url = e.target.closest("input[data-fotourl]");
    if (!url) return;
    foto[url.dataset.fotourl] = url.value.trim();
    pratinjauFoto(url.dataset.fotourl);
  });
  el(`${wadah}-form`).addEventListener("change", async (e) => {
    if (e.target.matches("input[data-galeri]")) {
      const f = e.target.dataset.galeri;
      const berkas = [...(e.target.files || [])];
      if (!berkas.length) return;
      try {
        const hasil = await Promise.all(berkas.map((b) => bacaGambar(b, 800)));
        galeri[f] = [...(galeri[f] || []), ...hasil];
        renderGaleri(f);
      } catch {
        alert("Ada berkas yang tidak bisa dibaca. Pilih gambar JPG atau PNG.");
      }
      e.target.value = "";
      return;
    }
    const masukan = e.target.closest("input[data-foto]");
    if (!masukan || !masukan.files[0]) return;
    const f = masukan.dataset.foto;
    try {
      foto[f] = await bacaGambar(masukan.files[0], 800);
      const url = el(`${wadah}-${f}-url`);
      if (url) url.value = "";
      pratinjauFoto(f);
    } catch {
      alert("Berkas tidak bisa dibaca. Pilih gambar JPG atau PNG.");
      masukan.value = "";
    }
  });
  el(`${wadah}-q`).addEventListener("input", gambar);

  gambar();

  const awal = +new URLSearchParams(location.search).get("id");
  if (awal) { const x = tampil.find((y) => y.id === awal); if (x) buka(x); }
}

/* Esc menutup form/detail/lightbox yang terbuka */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const kotak = el("lightbox");
  if (kotak && !kotak.hidden) kotak.hidden = true;
  document.querySelectorAll(".formblok:not([hidden])").forEach((x) => (x.hidden = true));
  const detail = el("detail");
  if (detail && !detail.hidden) {
    detail.hidden = true;
    const daftar = el("daftar");
    if (daftar) daftar.hidden = false;
  }
});
