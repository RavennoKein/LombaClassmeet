function getBeritaIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? parseInt(id, 10) : null;
}

async function renderBeritaDetailPage() {
  const id = getBeritaIdFromUrl();
  const titleEl = document.getElementById("detail-judul");
  const metaEl = document.getElementById("detail-meta");
  const contentEl = document.getElementById("detail-konten");
  const othersContainer = document.getElementById("detail-berita-lainnya");

  if (!id || !titleEl || !metaEl || !contentEl || !othersContainer) return;

  contentEl.textContent = "Memuat detail berita...";

  const item = await fetchBeritaById(id);
  if (!item) {
    titleEl.textContent = "Berita tidak ditemukan";
    metaEl.textContent = "";
    contentEl.textContent = "Berita yang Anda cari tidak tersedia.";
    return;
  }

  titleEl.textContent = item.judul;
  metaEl.textContent = `${formatDateIndo(item.tanggal)} • ${item.kategori || "Umum"} • ${item.views || 0}x dilihat`;

  contentEl.innerHTML = "";
  const paras = (item.isi || item.ringkasan || "")
    .split(/\n\n+/)
    .filter(Boolean);
  if (!paras.length) {
    contentEl.textContent = "Belum ada konten berita terperinci.";
  } else {
    paras.forEach((p) => {
      const el = document.createElement("p");
      el.className = "mb-2";
      el.textContent = p.trim();
      contentEl.appendChild(el);
    });
  }

  await incrementBeritaViews(id);

  othersContainer.innerHTML =
    '<p class="text-[11px] text-slate-500">Memuat berita lain...</p>';
  const { list } = await fetchBeritaList(5);
  const lainnya = list.filter((b) => b.id !== id);
  if (!lainnya.length) {
    othersContainer.innerHTML =
      '<p class="text-[11px] text-slate-500">Belum ada berita lain.</p>';
  } else {
    othersContainer.innerHTML = "";
    lainnya.forEach((item) => {
      const row = document.createElement("a");
      row.href = `berita-detail.html?id=${item.id}`;
      row.className =
        "block px-2 py-1.5 rounded-lg hover:bg-slate-100 transition";

      const title = document.createElement("p");
      title.className = "text-[11px] font-medium text-slate-900 line-clamp-2";
      title.textContent = item.judul;

      const meta = document.createElement("p");
      meta.className = "text-[10px] text-slate-500";
      meta.textContent = formatDateIndo(item.tanggal);

      row.append(title, meta);
      othersContainer.appendChild(row);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("berita");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderBeritaDetailPage();
});
