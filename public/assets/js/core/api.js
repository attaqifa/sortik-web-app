/* Klien API tipis: semua panggilan ke /api (satu alamat dengan halaman, cookie sesi ikut otomatis).
   Selalu mengembalikan { data, error } — error berisi pesan yang siap ditampilkan. */
const api = (() => {
  async function panggil(metode, jalur, badan) {
    try {
      const r = await fetch("/api" + jalur, {
        method: metode,
        credentials: "same-origin",
        headers: badan === undefined ? {} : { "Content-Type": "application/json" },
        body: badan === undefined ? undefined : JSON.stringify(badan),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return { data: null, error: j.error || "Terjadi kesalahan.", status: r.status };
      return { data: j, error: null, status: r.status };
    } catch {
      return { data: null, error: "Server tidak terjangkau. Jalankan server PHP lalu muat ulang.", status: 0 };
    }
  }
  /* unggah berkas (multipart): tanpa Content-Type buatan sendiri agar browser mengisi batas bagian */
  async function unggah(jalur, form) {
    try {
      const r = await fetch("/api" + jalur, { method: "POST", credentials: "same-origin", body: form });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return { data: null, error: j.error || "Terjadi kesalahan.", status: r.status };
      return { data: j, error: null, status: r.status };
    } catch {
      return { data: null, error: "Server tidak terjangkau. Jalankan server PHP lalu muat ulang.", status: 0 };
    }
  }
  return {
    unggah,
    get: (jalur) => panggil("GET", jalur),
    post: (jalur, badan = {}) => panggil("POST", jalur, badan),
    patch: (jalur, badan = {}) => panggil("PATCH", jalur, badan),
    put: (jalur, badan = {}) => panggil("PUT", jalur, badan),
    hapus: (jalur) => panggil("DELETE", jalur),
  };
})();
