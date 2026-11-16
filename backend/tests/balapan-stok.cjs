/* Uji balapan stok: N pembeli checkout serentak untuk produk berstok kecil.
   Jalankan:  node backend/tests/balapan-stok.cjs http://127.0.0.1:8081
   Akun uji (@sortik.test) dibersihkan lewat skrip bersih-uji. */
const B = process.argv[2] || "http://127.0.0.1:8081";
const H = { "Content-Type": "application/json", Origin: B };
const PRODUK = 9, N = 8;
async function req(m, u, b, c) {
  const r = await fetch(B + "/api" + u, { method: m, headers: { ...H, ...(c ? { Cookie: c } : {}) }, body: b ? JSON.stringify(b) : undefined });
  const ck = (r.headers.getSetCookie?.() || []).map((x) => x.split(";")[0]).join("; ");
  return { s: r.status, d: await r.json().catch(() => null), ck };
}
(async () => {
  const stok0 = (await req("GET", "/produk")).d.find((p) => p.id === PRODUK).stok;
  const sesi = [];
  for (let i = 0; i < N; i++) {
    const e = `balap${Date.now()}${i}@sortik.test`;
    const r = await req("POST", "/daftar", { nama: "Uji " + i, email: e, sandi: "Sortik#2026" });
    const c = r.ck || (await req("POST", "/masuk", { email: e, sandi: "Sortik#2026" })).ck;
    await req("PUT", "/keranjang/" + PRODUK, { jumlah: 1 }, c);
    sesi.push(c);
  }
  const hasil = await Promise.all(sesi.map((c) => req("POST", "/pesanan", { cara: "ambil", bayar: "Bayar di kasir" }, c)));
  const ok = hasil.filter((h) => h.s === 201), gagal = hasil.filter((h) => h.s === 409);
  const stok1 = (await req("GET", "/produk")).d.find((p) => p.id === PRODUK).stok;
  console.log({ stok0, berhasil: ok.length, ditolak409: gagal.length, lain: hasil.length - ok.length - gagal.length, stok1 });
  let lulus = ok.length === Math.min(stok0, N) && stok1 === stok0 - ok.length && gagal.length === N - ok.length;
  for (let i = 0; i < N; i++) if (hasil[i].s === 201) await req("POST", `/pesanan/${hasil[i].d.id}/batal`, {}, sesi[i]);
  const stok2 = (await req("GET", "/produk")).d.find((p) => p.id === PRODUK).stok;
  console.log({ stokSetelahBatal: stok2 });
  lulus = lulus && stok2 === stok0;
  console.log(lulus ? "LULUS" : "GAGAL"); process.exit(lulus ? 0 : 1);
})();
