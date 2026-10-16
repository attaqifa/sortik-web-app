/* SORTIK — staff: kelola barang (tambah, ubah, hapus)
   Satu form dipakai untuk tambah & ubah: mengubah barang tidak menyalin data ke
   variabel lain, cukup mengisi input lalu menyimpan kembali ke baris yang sama.
   Semua perubahan disimpan lewat tulis("produk"). Saat database siap:
     GET    /api/produk            -> isi db.produk
     POST   /api/produk            -> tambah (id dari server, bukan Math.max di bawah)
     PUT    /api/produk/<id>       -> ubah
     DELETE /api/produk/<id>       -> hapus                                       */

const state = { q: "", edit: 0 }; /* edit = 0 berarti mode tambah */

const urut = (daftar) => [...daftar].sort((a, b) => a.nama.localeCompare(b.nama));

const baris = (p) => `<div class="row">
  <div class="thumb">${p.ikon || "📦"}</div>
  <div><b>${p.nama}</b><span>${kat(p)} · ${rp(p.harga)} · stok ${p.stok} · rak ${p.rak}</span></div>
  <div class="btns">
    <button class="btn" type="button" data-ubah="${p.id}">Ubah</button>
    <button class="btn danger" type="button" data-hapus="${p.id}">Hapus</button>
  </div>
</div>`;

function gambar() {
  const kata = state.q.trim().toLowerCase();
  const hasil = urut(db.produk.filter((p) => `${p.nama} ${kat(p)} ${p.rak}`.toLowerCase().includes(kata)));
  isi("hasil", `${hasil.length} dari ${db.produk.length} barang`);
  isi("list", hasil.length ? hasil.map(baris).join("") : `<p class="kosong">Barang tidak ditemukan. Ubah kata kunci atau tambah barang baru.</p>`);
}

/* buka form: tanpa argumen = tambah, dengan produk = ubah */
function bukaForm(p = {}) {
  state.edit = p.id || 0;
  isi("formJudul", state.edit ? `Ubah Barang · PRD-${String(p.id).padStart(3, "0")}` : "Tambah Barang");
  el("nama").value = p.nama || "";
  el("harga").value = p.harga || "";
  el("stok").value = p.stok ?? 0;
  el("ikon").value = p.ikon || "📦";
  el("deskripsi").value = p.deskripsi || "";
  el("kategori").innerHTML = db.kategori.map((k) => `<option value="${k.id}"${k.id === p.kategori ? " selected" : ""}>${k.nama}</option>`).join("");
  el("rak").innerHTML = semuaRak().map((r) => `<option${r === p.rak ? " selected" : ""}>${r}</option>`).join("");
  el("form").hidden = false;
  el("form").scrollIntoView();
  el("nama").focus();
}

/* simpan: ubah baris yang sedang diedit, atau tambah baris baru di akhir */
el("simpan").onclick = () => {
  const nama = el("nama").value.trim();
  if (!nama) return el("nama").focus();
  const data = {
    nama,
    kategori: el("kategori").value,
    harga: +el("harga").value || 0,
    stok: +el("stok").value || 0,
    rak: el("rak").value,
    ikon: el("ikon").value.trim() || "📦",
    deskripsi: el("deskripsi").value.trim()
  };
  if (state.edit) Object.assign(produkById(state.edit), data);
  else db.produk.push({ id: Math.max(0, ...db.produk.map((p) => p.id)) + 1, ...data });
  tulis("produk", db.produk); /* DB: POST / PUT /api/produk */
  el("form").hidden = true;
  gambar();
};

el("batal").onclick = () => (el("form").hidden = true);
el("tambah").onclick = () => bukaForm();

el("list").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.ubah) return bukaForm(produkById(+b.dataset.ubah));

  const p = produkById(+b.dataset.hapus);
  if (!confirm(`Hapus "${p.nama}" dari daftar barang?`)) return;
  db.produk.splice(db.produk.indexOf(p), 1);
  tulis("produk", db.produk); /* DB: DELETE /api/produk/<id> */
  gambar();
});

el("q").oninput = (e) => { state.q = e.target.value; gambar(); };

gambar();

/* ?id=3 -> langsung buka form ubah (tautan "stok menipis" di beranda staff) */
const awal = +new URLSearchParams(location.search).get("id");
if (produkById(awal).id) bukaForm(produkById(awal));
