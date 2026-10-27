/* Pesan Grup — admin & staff berkomunikasi dalam satu grup "Grup Toko".
   Berkas ini dipakai bersama halaman staff/pesan.html dan admin/pesan.html.
   Data tersimpan di db.pesan (localStorage); admin bisa menghapus pesan,
   dan tab lain ikut memperbarui otomatis lewat event "storage". */

/* stempel waktu terakhir dibaca per peran → badge di sidebar */
const tandaiBaca = () => { try { localStorage.setItem(VERSI + "pesanBaca-" + peran, Date.now()); } catch {} };
tandaiBaca();
gambarSidebar(); /* segarkan badge — pesan yang baru dibuka dianggap sudah dibaca */

const jamObrolan = (d) => String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0");
const hariObrolan = (d) => `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;

/* bubble obrolan; diakhiri penanda pembaca */
function gambar() {
  const anggota = db.pengguna.filter((u) => ["staff", "admin"].includes(u.role) && u.status === "aktif");
  isi("anggota", `${anggota.length} anggota aktif`);

  let hari = "";
  const html = db.pesan.map((m) => {
    const d = new Date(m.waktu);
    const pemisah = hariObrolan(d) !== hari ? (hari = hariObrolan(d), `<div class="hari">${hari}</div>`) : "";
    const bot = m.peran === "bot";
    const aku = !bot && m.dari === db.akun.nama;
    return `${pemisah}<div class="bubble${aku ? " aku" : ""}${bot ? " bot" : ""}" data-id="${m.id}">
      ${aku || bot ? "" : `<div class="siapa">${esc(m.dari)}<i>${esc(labelPeran(m.peran))}</i></div>`}
      ${bot ? `<div class="siapa"><span class="ikon" data-lucide="bot"></span>${esc(m.dari)}</div>` : ""}
      <p>${esc(m.teks)}</p>
      <time>${jamObrolan(d)}</time>
      ${db.akun.role === "admin" ? `<button type="button" class="hapus" title="Hapus pesan ini">✕</button>` : ""}
    </div>`;
  }).join("");

  isi("dinding", html || pesanKosong("message-square", "Belum ada pesan. Sapa timnya dulu!"));
  const d = el("dinding");
  d.scrollTop = d.scrollHeight; /* selalu tampil pesan terbaru */
}

/* kirim pesan */
el("formKirim").addEventListener("submit", (e) => {
  e.preventDefault();
  const teks = el("teksPesan").value.trim();
  if (!teks) return;
  const id = db.pesan.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  db.pesan.push({ id, dari: db.akun.nama, peran: db.akun.role, teks, waktu: new Date().toISOString() });
  el("teksPesan").value = "";
  tandaiBaca();
  simpan("pesan");
  gambar();
});

/* hapus pesan (khusus admin — moderasi grup) */
el("dinding").addEventListener("click", async (e) => {
  const b = e.target.closest(".hapus");
  if (!b) return;
  const kotak = b.closest(".bubble");
  if (!(await konfirmasi("Hapus pesan ini?", "Pesan hilang untuk semua anggota grup."))) return;
  db.pesan = db.pesan.filter((m) => m.id !== +kotak.dataset.id);
  simpan("pesan");
  gambar();
  notif("Pesan dihapus.");
});

/* tab staff/admin lain mengirim pesan → ikut memperbarui tanpa muat ulang */
window.addEventListener("storage", (e) => {
  if (e.key === VERSI + "pesan") { tandaiBaca(); gambar(); }
});

el("teksPesan").focus();
gambar();
