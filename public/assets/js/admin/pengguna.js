/* Kelola pengguna — form di sini, logika di mesin kelola. */

kelola({
  wadah: "kelola",
  kunci: "pengguna",
  dasar: "/pengguna",
  nama: "Pengguna",
  kode: "USR-",
  petunjuk: "Cari nama, email, atau peran...",

  kolom: [
    ["nama", "Nama lengkap", "text"],
    ["email", "Email", "email"],
    ["sandi", "Kata sandi", "sandi"],
    /* staff lebih dulu — akun baru buatan admin default-nya staff */
    ["role", "Peran", "pilih", () => [["staff", "Staff Toko"], ["admin", "Admin Toko"], ["pembeli", "Pembeli"]]],
    ["status", "Status akun", "pilih", () => [["aktif", "Aktif"], ["nonaktif", "Nonaktif"]]]
  ],

  /* sandi diisi = pasang sandi baru (di-hash server, minimal 8 karakter), kosong = tetap */

  cari: (u) => `${u.nama} ${u.email} ${PERAN[u.role] || u.role}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),

  baris: (u) => `<div class="thumb">${esc(u.nama.charAt(0))}</div>
  <div><b>${esc(u.nama)}</b><span>${esc(u.email)} · ${esc(PERAN[u.role] || u.role)}</span>
  <em class="${u.status === "aktif" ? "ok" : "done"}">${u.status === "aktif" ? "Aktif" : "Nonaktif"}</em></div>`
});
