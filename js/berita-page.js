function buildThumbnail(url) {
  if (!url) {
    // fallback: blok abu-abu
    const div = document.createElement("div");
    div.className = "bg-slate-200 w-full h-full";
    return div;
  }
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Gambar berita";
  img.className = "w-full h-full object-cover";
  return img;
}

async function renderBeritaPage() {
  const featuredContainer = document.getElementById("berita-featured");
  const listContainer = document.getElementById("berita-list-container");
  const popularContainer = document.getElementById("berita-populer-sidebar");
  if (!featuredContainer || !listContainer || !popularContainer) return;

  featuredContainer.innerHTML =
    '<div class="absolute inset-0 flex items-center justify-center text-xs text-slate-600">Memuat berita...</div>';
  listContainer.innerHTML =
    '<p class="text-xs text-slate-500">Memuat daftar berita...</p>';

  const { list } = await fetchBeritaList(50);

  if (!list.length) {
    featuredContainer.innerHTML =
      '<div class="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Belum ada berita.</div>';
    listContainer.innerHTML =
      '<p class="text-xs text-slate-500">Belum ada berita terbaru.</p>';
  } else {
    const [featured, ...others] = list;

    // ----- Berita utama -----
    featuredContainer.innerHTML = "";
    const wrapper = document.createElement("a");
    wrapper.href = `berita-detail.html?id=${featured.id}`;
    wrapper.className =
      "block w-full h-full relative group";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "w-full h-full min-h-[220px] md:min-h-[260px]";

    const thumbUrl = featured.thumbnail_path
      ? getImageUrl(featured.thumbnail_path)
      : (featured.thumbnail_url || "");
    imageWrapper.appendChild(buildThumbnail(thumbUrl));

    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent";

    const content = document.createElement("div");
    content.className =
      "absolute inset-x-0 bottom-0 p-4 md:p-5 text-white space-y-1";

    const kategori = document.createElement("p");
    kategori.className = "text-[10px] md:text-[11px] font-medium text-slate-100/90";
    kategori.textContent = featured.kategori || "Berita Sekolah";

    const title = document.createElement("h2");
    title.className =
      "text-sm md:text-base lg:text-lg font-semibold leading-snug group-hover:text-primary-100";
    title.textContent = featured.judul;

    const meta = document.createElement("p");
    meta.className = "text-[10px] text-slate-100/80";
    meta.textContent = `${formatDateIndo(featured.tanggal)} • ${featured.views || 0}x dibaca`;

    content.append(kategori, title, meta);
    wrapper.append(imageWrapper, overlay, content);
    featuredContainer.appendChild(wrapper);

    // ----- Daftar berita terbaru (lainnya) -----
    listContainer.innerHTML = "";
    if (!others.length) {
      listContainer.innerHTML =
        '<p class="text-xs text-slate-500">Belum ada berita lain.</p>';
    } else {
      others.forEach((item) => {
        const row = document.createElement("article");
        row.className =
          "flex gap-3 border-b border-slate-200 pb-3 last:border-b-0";

        const thumbBox = document.createElement("a");
        thumbBox.href = `berita-detail.html?id=${item.id}`;
        thumbBox.className =
          "w-32 h-20 md:w-40 md:h-24 rounded-md overflow-hidden flex-shrink-0 bg-slate-200";
        const tUrl = item.thumbnail_path
          ? getImageUrl(item.thumbnail_path)
          : (item.thumbnail_url || "");
        thumbBox.appendChild(buildThumbnail(tUrl));

        const body = document.createElement("div");
        body.className = "flex-1 space-y-1";

        const tanggal = document.createElement("p");
        tanggal.className = "text-[10px] text-slate-500";
        tanggal.textContent = formatDateIndo(item.tanggal);

        const titleLink = document.createElement("a");
        titleLink.href = `berita-detail.html?id=${item.id}`;
        titleLink.className =
          "block text-xs md:text-sm font-semibold text-slate-900 hover:text-primary-700";
        titleLink.textContent = item.judul;

        const desc = document.createElement("p");
        desc.className =
          "text-[11px] text-slate-700 line-clamp-2";
        desc.textContent = item.ringkasan || "";

        const meta = document.createElement("p");
        meta.className = "text-[10px] text-slate-500";
        meta.textContent = `${item.kategori || "Umum"} • ${item.views || 0}x dibaca`;

        body.append(tanggal, titleLink, desc, meta);
        row.append(thumbBox, body);
        listContainer.appendChild(row);
      });
    }
  }

  // ----- Berita Terpopuler di sidebar -----
  popularContainer.innerHTML =
    '<p class="text-[11px] text-slate-500">Memuat data...</p>';

  const popular = await fetchBeritaPopuler(4);

  if (!popular.length) {
    popularContainer.innerHTML =
      '<p class="text-[11px] text-slate-500">Belum ada data populer.</p>';
  } else {
    popularContainer.innerHTML = "";
    popular.forEach((item) => {
      const card = document.createElement("a");
      card.href = `berita-detail.html?id=${item.id}`;
      card.className =
        "block rounded-lg overflow-hidden border border-slate-200 bg-white hover:border-primary-200 hover:shadow-soft transition";

      const imgBox = document.createElement("div");
      imgBox.className = "w-full h-32 md:h-36 bg-slate-200 overflow-hidden";
      const tUrl = item.thumbnail_path
        ? getImageUrl(item.thumbnail_path)
        : (item.thumbnail_url || "");
      imgBox.appendChild(buildThumbnail(tUrl));

      const body = document.createElement("div");
      body.className = "px-3 py-2 space-y-1";

      const title = document.createElement("p");
      title.className =
        "text-[11px] md:text-xs font-semibold text-slate-900 line-clamp-2";
      title.textContent = item.judul;

      const meta = document.createElement("p");
      meta.className = "text-[10px] text-slate-500";
      meta.textContent = `${formatDateIndo(item.tanggal)} • ${item.views || 0}x dibaca`;

      body.append(title, meta);
      card.append(imgBox, body);
      popularContainer.appendChild(card);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("berita");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderBeritaPage();
});
