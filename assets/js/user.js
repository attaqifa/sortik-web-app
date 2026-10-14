/* SORTIK — beranda pembeli
   `db` di bawah masih data mock. Untuk menyambung ke database cukup ambil data
   dari API lalu panggil render(data) dengan shape yang sama, mis. di dalam async function:
     render(await (await fetch("/api/beranda/pembeli")).json());
   Field di bawah sengaja mengikuti kolom tabel yang dibutuhkan. */

const db = {
  user: { nama: "Rina Kartika", role: "Pembeli", inisial: "RK" },
  statistik: [
    { label: "Booking Aktif", nilai: 2 },
    { label: "Pesanan Diproses", nilai: 1 },
    { label: "Siap Diambil", nilai: 1 }
  ],
  pesanan: [
    { ikon: "📱", nama: "Samsung Galaxy A26 5G 8GB/256GB", jumlah: 1, harga: 4999000, status: "Menunggu" },
    { ikon: "🎧", nama: "JBL Live Free 2 TWS", jumlah: 1, harga: 1649500, status: "Diproses" },
    { ikon: "🔊", nama: "KJB PASSIVE SPEAKER 081-PA", jumlah: 1, harga: 1429000, status: "Siap" }
  ],
  kategori: [
    { ikon: "📱", nama: "Smartphone" },
    { ikon: "💻", nama: "Laptop" },
    { ikon: "🫧", nama: "Washer" },
    { ikon: "⌚", nama: "Wearable Tech" },
    { ikon: "🎧", nama: "Audio" }
  ]
};

/* status -> warna badge */
const warna = { Menunggu: "wait", Diproses: "proc", Siap: "ok" };
const rp = (n) => "Rp " + n.toLocaleString("id-ID");
const isi = (id, html) => (document.getElementById(id).innerHTML = html);

/* gambar seluruh halaman dari satu objek data */
function render(d) {
  /* info user pojok kiri bawah */
  isi("me", `<div class="avatar">${d.user.inisial}</div>
    <div><b>${d.user.nama}</b><span>${d.user.role}</span></div>`);

  document.getElementById("nama").textContent = d.user.nama;

  isi("stats", d.statistik.map((s) => `<div><b>${s.nilai}</b><span>${s.label}</span></div>`).join(""));

  isi("pesanan", d.pesanan.map((p) => `<div class="row">
      <div class="thumb">${p.ikon}</div>
      <div><b>${p.nama}</b><span>${p.jumlah} item · ${rp(p.harga)}</span></div>
      <em class="${warna[p.status] || ""}">${p.status}</em>
    </div>`).join(""));

  isi("kategori", d.kategori.map((k) => `<div>${k.ikon}<span>${k.nama}</span></div>`).join(""));
}

render(db);
