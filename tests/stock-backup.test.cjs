const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const koneksi = fs.readFileSync("assets/js/core/koneksi.js", "utf8");
const seed = vm.runInNewContext(koneksi + "\nDATA_AWAL()", {});
const settings = fs.readFileSync("assets/js/admin/pengaturan.js", "utf8");
const validation = settings.slice(settings.indexOf("  const unik ="), settings.indexOf("  if (!valid)"));
const validasi = new Function("data", validation + "\nreturn valid;");
assert.equal(validasi(seed), true, "cadangan bawaan harus dapat dipulihkan");
for (const rusak of [
  (d) => { d.toko[0].produk[0].stok = -1; },
  (d) => { d.toko[0].pesanan[0].jumlah = 0; },
  (d) => { d.toko[0].rak.lantai[0].daftar = null; },
  (d) => { d.toko[0].rekening[0] = null; },
  (d) => { d.pengguna.push(d.pengguna[0]); }
]) {
  const data = structuredClone(seed);
  rusak(data);
  assert.equal(validasi(data), false, "cadangan rusak harus ditolak");
}

const ui = fs.readFileSync("assets/js/core/ui.js", "utf8");
const helpers = ui.slice(ui.indexOf('const BATAL ='), ui.indexOf('/* ikon Lucide per status'));
const context = vm.createContext({ db: { pesanan: [
  { produk: 1, jumlah: 2, lunas: false, status: "Menunggu" },
  { produk: 1, jumlah: 3, lunas: false, status: "Siap" },
  { produk: 1, jumlah: 4, lunas: true, status: "Diproses" },
  { produk: 1, jumlah: 6, lunas: false, status: "Dibatalkan" }
] } });
vm.runInContext(helpers, context);
assert.equal(vm.runInContext("stokTersedia({ id: 1, stok: 8 })", context), 3);
context.db.pesanan[0].status = "Dibatalkan";
assert.equal(vm.runInContext("stokTersedia({ id: 1, stok: 8 })", context), 5);
context.db.pesanan[1].lunas = true;
assert.equal(vm.runInContext("stokTersedia({ id: 1, stok: 5 })", context), 5);
console.log("Pemeriksaan stok dan cadangan berhasil.");
