/* SORTIK — masuk & daftar (dipakai login.html dan daftar.html)
   Sementara tanpa backend */

document.querySelector("form").onsubmit = (e) => {
  e.preventDefault();
  const role = document.querySelector('input[name="role"]:checked')?.value || "pembeli";
  location.href = role === "pembeli" ? "../user/index.html" : "../staff/index.html";
};
