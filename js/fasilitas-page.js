// js/fasilitas-page.js
// Halaman fasilitas hanya memakai konten statis, tapi tetap menggunakan
// navbar aktif, footer, tombol forum, dan tombol chatbot.

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("fasilitas");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
});
