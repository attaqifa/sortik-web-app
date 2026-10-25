/* Kelola pengguna — form di sini, logika di mesin kelola. */

kelola({
  wadah: "kelola",
  kunci: "pengguna",
  nama: "Pengguna",
  kode: "USR-",
  petunjuk: "Cari nama, email, atau peran...",

  kolom: [
    ["nama", "Nama lengkap", "text"],
    ["email", "Email", "email"],
    ["role", "Peran", "pilih", () => Object.entries(PERAN)],
    ["status", "Status akun", "pilih", () => [["aktif", "Aktif"], ["nonaktif", "Nonaktif"]]]
  ],

  cari: (u) => `${u.nama} ${u.email} ${PERAN[u.role] || u.role}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),

  baru: (d) => {
    if (db.pengguna.some((u) => u.email.toLowerCase() === d.email.toLowerCase())) {
      alert(`Email "${d.email}" sudah dipakai pengguna lain.`);
      return null;
    }
    return { id: Math.max(0, ...db.pengguna.map((u) => u.id)) + 1, ...d };
  },
  baris: (u) => `<div class="thumb">${u.nama.charAt(0)}</div>
  <div><b>${u.nama}</b><span>${u.email} · ${PERAN[u.role] || u.role}</span>
  <em class="${u.status === "aktif" ? "ok" : "done"}">${u.status === "aktif" ? "Aktif" : "Nonaktif"}</em></div>`,

  cek: (u) => (u.nama === db.akun.nama ? "Akun yang sedang dipakai tidak bisa dihapus." : "")
});
