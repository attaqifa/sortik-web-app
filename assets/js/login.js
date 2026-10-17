/* Masuk & daftar — sementara tanpa backend, peran menentukan halaman tujuan. */

const TUJUAN = { pembeli: "../user/index.html", staff: "../staff/index.html", admin: "../admin/index.html" };

document.querySelector("form").onsubmit = (e) => {
  e.preventDefault();
  location.href = TUJUAN[e.target.elements.role.value] || TUJUAN.pembeli;
};
