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

  /* email tidak bisa diubah dari sini — harus selaras dengan akun Auth */
  siapkan: (d, lama) => ({ ...d, email: (lama && lama.email) || d.email }),

  baru: (d) => {
    notif("Akun baru dibuat lewat Supabase Dashboard → Authentication → Users.");
    return null;
  },
  baris: (u) => `<div class="thumb">${u.nama.charAt(0)}</div>
  <div><b>${u.nama}</b><span>${u.email} · ${PERAN[u.role] || u.role}</span>
  <em class="${u.status === "aktif" ? "ok" : "done"}">${u.status === "aktif" ? "Aktif" : "Nonaktif"}</em></div>`,

  cek: () => "Penghapusan akun dilakukan lewat Supabase Dashboard → Authentication → Users — agar akun masuknya ikut terhapus, bukan hanya baris profilnya."
});
