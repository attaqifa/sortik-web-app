/* SORTIK — masuk & daftar. Peran menentukan area yang dibuka; identitas, menu,
   dan seluruh data diisi app.js di halaman tujuannya.
   DB: POST /api/sesi { email, password } -> { nama, role }, lalu buka RUTE[role]
   (RUTE di bawah sama dengan RUTE di assets/js/app.js). */

const RUTE = { pembeli: "user", staff: "staff", admin: "admin" };

document.querySelector("form").onsubmit = (e) => {
  e.preventDefault();
  const role = document.querySelector('input[name="role"]:checked')?.value || "pembeli";
  location.href = `../${RUTE[role]}/index.html`;
};
