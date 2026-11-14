/* SORTIK — pemuat halaman. Menggantikan skrip inline agar CSP bisa melarang
   skrip inline. Atribut data-halaman berisi skrip khusus halaman. */
(() => {
  const halaman = document.currentScript.dataset.halaman;
  mulaiAplikasi(() => {
    const s = document.createElement("script");
    s.src = halaman;
    document.body.append(s);
  });
})();
