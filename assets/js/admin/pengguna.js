/* Tim Staff, admin mengelola staff toko yang sedang aktif.
   Hanya akun berperan staff milik toko ini yang tampil. */

kelola({
  wadah: "kelola",
  kunci: "pengguna",
  nama: "Staff",
  kode: "USR-",
  petunjuk: "Cari nama atau email staff...",
  hanya: (u) => u.role === "staff" && u.toko === db.aktifToko,

  kolom: [
    ["nama", "Nama lengkap", "text"],
    ["email", "Email", "email"],
    ["sandi", "Kata sandi", "sandi"],
    ["status", "Status akun", "pilih", () => [["aktif", "Aktif"], ["nonaktif", "Nonaktif"]]]
  ],

  /* sandi diisi = pasang sandi baru (disimpan sebagai hash), kosong = tetap */
  siapkan: async (d) => {
    if (!d.sandi) { delete d.sandi; return d; }
    if (d.sandi.length < 8) { notif("Kata sandi minimal 8 karakter."); return null; }
    return { ...d, sandi: await hashSandi(d.sandi) };
  },

  /* staff baru selalu milik toko aktif; wajib sandi & email unik */
  baru: (d) => {
    if (!d.sandi) {
      notif("Isi kata sandi (minimal 8 karakter) untuk akun baru.");
      return null;
    }
    const email = String(d.email || "").toLowerCase();
    if (db.pengguna.some((u) => String(u.email || "").toLowerCase() === email)) {
      notif("Email sudah dipakai akun lain.");
      return null;
    }
    return {
      ...d, id: "u" + Date.now().toString(36), role: "staff",
      toko: db.aktifToko, avatar: "", telepon: "", alamat: ""
    };
  },

  /* jangan menghapus akun yang masih dipakai sebagai nama staff di pesanan */
  cek: (u) => (db.pesanan.some((o) => o.staff === u.nama)
    ? `"${u.nama}" masih tercatat di riwayat pesanan. Nonaktifkan akunnya saja.`
    : ""),

  cari: (u) => `${u.nama} ${u.email}`,
  urut: (a, b) => a.nama.localeCompare(b.nama),

  baris: (u) => `<div class="thumb">${esc(u.nama.charAt(0))}</div>
  <div><b>${esc(u.nama)}</b><span>${esc(u.email)} · Staff Toko</span>
  <em class="${u.status === "aktif" ? "ok" : "done"}">${u.status === "aktif" ? "Aktif" : "Nonaktif"}</em></div>`
});
