/* Kelola Toko: daftar toko admin dan tambah toko. */

const milikSaya = () => semuaToko.filter((t) => t.pemilik === db.akun.id);
const jumlahStaff = (id) => db.pengguna.filter((u) => u.role === "staff" && u.toko === id).length;

const kartuToko = (t) => {
  const aktif = t.id === db.aktifToko;
  const sampul = t.foto || t.logo;
  const logo = t.logo
    ? `<img src="${esc(t.logo)}" alt="">`
    : esc((t.nama || "T").charAt(0));
  return `<article class="stoko${aktif ? " on" : ""}">
    ${sampul ? `<div class="ssampul"><img src="${esc(sampul)}" alt="Foto ${esc(t.nama)}" loading="lazy" onerror="this.parentElement.remove()"></div>` : ""}
    <div class="stoko-top">
      <div class="slogo">${logo}</div>
      <div><h2>${esc(t.nama)}</h2><span>${esc(t.alamat || "Alamat belum diisi")}</span></div>
    </div>
    <div class="smeta">
      <span>${(t.produk || []).length} produk</span>
      <span>${jumlahStaff(t.id)} staff</span>
      <span>${(t.pesanan || []).length} pesanan</span>
    </div>
    <button class="pilih" type="button" data-aktifkan="${esc(t.id)}"${aktif ? " disabled" : ""}>${aktif ? "Sedang aktif" : "Pindah ke toko ini"}</button>
  </article>`;
};

function gambarToko() {
  const punya = milikSaya();
  /* tautan profil toko aktif tidak ada gunanya sebelum ada toko */
  el("linkPengaturan").hidden = !db.aktifToko;
  /* satu akun admin hanya mengelola satu toko, form buka toko disembunyikan */
  el("kartuBukaToko").hidden = punya.length > 0;
  isi("daftarToko", punya.length ? punya.map(kartuToko).join("")
    : pesanKosong("store", "Anda belum punya toko. Isi form Buka toko baru di bawah untuk toko pertama Anda.", ["#formToko", "Isi form buka toko"]));
}

/* pindah toko aktif: simpan pilihan lalu muat ulang seluruh isi halaman */
el("daftarToko").addEventListener("click", (e) => {
  const pindah = e.target.closest("[data-aktifkan]");
  if (pindah && !pindah.disabled) {
    simpanToko(pindah.dataset.aktifkan);
    location.reload();
    return;
  }
});

/* form buka toko: logo, foto, dan rekening sebelum disimpan */
let logoBaru = "";
let fotoBaru = "";

function pratinjauBaru() {
  isi("n-logoPratinjau", logoBaru ? `<img src="${logoBaru}" alt="Pratinjau logo">` : `<span class="ikon" data-lucide="image"></span>Belum ada logo`);
  isi("n-fotoPratinjau", fotoBaru ? `<img src="${fotoBaru}" alt="Pratinjau foto toko">` : `<span class="ikon" data-lucide="image"></span>Belum ada foto`);
  el("n-logoHapus").hidden = !logoBaru;
  el("n-fotoHapus").hidden = !fotoBaru;
}

el("n-logo").onchange = async () => {
  const berkas = el("n-logo").files[0];
  if (!berkas) return;
  try {
    logoBaru = await bacaGambar(berkas, 180);
    pratinjauBaru();
  } catch {
    isi("t-info", "Gagal membaca logo. Coba berkas JPG atau PNG.");
  }
};

el("n-logoHapus").onclick = () => { logoBaru = ""; el("n-logo").value = ""; pratinjauBaru(); };

el("n-foto").onchange = async () => {
  const berkas = el("n-foto").files[0];
  if (!berkas) return;
  try {
    fotoBaru = await bacaGambar(berkas, 1200);
    el("n-fotoUrl").value = "";
    pratinjauBaru();
  } catch {
    isi("t-info", "Gagal membaca foto. Coba berkas JPG atau PNG.");
  }
};

el("n-fotoUrl").onchange = () => {
  fotoBaru = el("n-fotoUrl").value.trim();
  el("n-foto").value = "";
  pratinjauBaru();
};

el("n-fotoHapus").onclick = () => {
  fotoBaru = "";
  el("n-foto").value = "";
  el("n-fotoUrl").value = "";
  pratinjauBaru();
};

/* satu rekening per baris: Bank | Nomor | Atas Nama */
const rekeningDari = (teks) => teks.split("\n")
  .map((b) => b.split("|").map((x) => x.trim()))
  .filter(([bank]) => bank)
  .map(([bank, nomor = "", atasNama = ""]) => ({ bank, nomor, atasNama }));

pratinjauBaru();

el("formToko").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { error } = await tambahToko({
    nama: el("n-nama").value.trim(),
    alamat: el("n-alamat").value.trim(),
    jam: el("n-jam").value.trim(),
    wa: el("n-wa").value.trim(),
    ongkir: el("n-ongkir").value,
    logo: logoBaru,
    foto: fotoBaru,
    rekening: rekeningDari(el("n-rek").value)
  });
  if (error) { isi("t-info", error); return; }
  location.reload();
});

gambarToko();
