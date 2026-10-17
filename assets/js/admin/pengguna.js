/* SORTIK — admin: kelola pengguna (tambah, ubah, hapus)
   Memakai mesin `kelola` (app.js); kolom = kolom tabel pengguna, peran memakai
   kode yang sama dengan login (pembeli | staff | admin).
   DB: GET /api/pengguna, POST /api/pengguna, PUT/DELETE /api/pengguna/<id> */

kelola({
  wadah: "kelola",          /* tempat kartu dirender (admin/pengguna.html) */
  kunci: "pengguna",
  nama: "Pengguna",
  kode: "USR-",
  petunjuk: "Cari nama, email, atau peran...",

  kolom: [
    ["nama", "Nama lengkap", "text"],
    ["email", "Email", "text"],
    ["role", "Peran", "pilih", () => Object.entries(PERAN)],
    ["status", "Status akun", "pilih", () => [["aktif", "Aktif"], ["nonaktif", "Nonaktif"]]]
  ],

  cari: (u) => `${u.nama} ${u.email} ${PERAN[u.role] || u.role}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),
  baris: (u) => `<div class="thumb">${u.nama.charAt(0)}</div>
  <div><b>${u.nama}</b><span>${u.email} · ${PERAN[u.role] || u.role}</span>
  <em class="${u.status === "aktif" ? "ok" : "done"}">${u.status === "aktif" ? "Aktif" : "Nonaktif"}</em></div>`
});
