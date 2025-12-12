function buildThumbnail(url) {
  if (!url) {
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

function normalizeText(str) {
  return (str || "").toString().toLowerCase().trim();
}

function getThumb(item) {
  return item.thumbnail_path
    ? getImageUrl(item.thumbnail_path)
    : item.thumbnail_url || "";
}

function renderFeatured(featuredContainer, item) {
  if (!item) {
    featuredContainer.innerHTML =
      '<div class="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Tidak ada hasil.</div>';
    return;
  }

  featuredContainer.innerHTML = "";
  const wrapper = document.createElement("a");
  wrapper.href = `berita-detail.html?id=${item.id}`;
  wrapper.className = "block w-full h-full relative group";

  const imageWrapper = document.createElement("div");
  imageWrapper.className = "w-full h-full min-h-[220px] md:min-h-[260px]";
  imageWrapper.appendChild(buildThumbnail(getThumb(item)));

  const overlay = document.createElement("div");
  overlay.className =
    "absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent";

  const content = document.createElement("div");
  content.className =
    "absolute inset-x-0 bottom-0 p-4 md:p-5 text-white space-y-1";

  const kategori = document.createElement("p");
  kategori.className =
    "text-[10px] md:text-[11px] font-medium text-slate-100/90";
  kategori.textContent = item.kategori || "Berita Sekolah";

  const title = document.createElement("h2");
  title.className =
    "text-sm md:text-base lg:text-lg font-semibold leading-snug group-hover:text-primary-100";
  title.textContent = item.judul;

  const meta = document.createElement("p");
  meta.className = "text-[10px] text-slate-100/80";
  meta.textContent = `${formatDateIndo(item.tanggal)} • ${
    item.views || 0
  }x dibaca`;

  content.append(kategori, title, meta);
  wrapper.append(imageWrapper, overlay, content);
  featuredContainer.appendChild(wrapper);
}

function renderTerbaru(listContainer, items) {
  listContainer.innerHTML = "";

  if (!items.length) {
    listContainer.innerHTML =
      '<p class="text-xs text-slate-500">Tidak ada berita yang cocok.</p>';
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "flex gap-3 border-b border-slate-200 pb-3 last:border-b-0";

    const thumbBox = document.createElement("a");
    thumbBox.href = `berita-detail.html?id=${item.id}`;
    thumbBox.className =
      "w-32 h-20 md:w-40 md:h-24 rounded-md overflow-hidden flex-shrink-0 bg-slate-200";
    thumbBox.appendChild(buildThumbnail(getThumb(item)));

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
    desc.className = "text-[11px] text-slate-700 line-clamp-2";
    desc.textContent = item.ringkasan || "";

    const meta = document.createElement("p");
    meta.className = "text-[10px] text-slate-500";
    meta.textContent = `${item.kategori || "Umum"} • ${
      item.views || 0
    }x dibaca`;

    body.append(tanggal, titleLink, desc, meta);
    row.append(thumbBox, body);
    listContainer.appendChild(row);
  });
}

function renderPopuler(popularContainer, items) {
  popularContainer.innerHTML = "";

  if (!items.length) {
    popularContainer.innerHTML =
      '<p class="text-[11px] text-slate-500">Tidak ada data populer.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("a");
    card.href = `berita-detail.html?id=${item.id}`;
    card.className =
      "block rounded-lg overflow-hidden border border-slate-200 bg-white hover:border-primary-200 hover:shadow-soft transition";

    const imgBox = document.createElement("div");
    imgBox.className = "w-full h-32 md:h-36 bg-slate-200 overflow-hidden";
    imgBox.appendChild(buildThumbnail(getThumb(item)));

    const body = document.createElement("div");
    body.className = "px-3 py-2 space-y-1";

    const title = document.createElement("p");
    title.className =
      "text-[11px] md:text-xs font-semibold text-slate-900 line-clamp-2";
    title.textContent = item.judul;

    const meta = document.createElement("p");
    meta.className = "text-[10px] text-slate-500";
    meta.textContent = `${formatDateIndo(item.tanggal)} • ${
      item.views || 0
    }x dibaca`;

    body.append(title, meta);
    card.append(imgBox, body);
    popularContainer.appendChild(card);
  });
}

async function renderBeritaPage() {
  const featuredContainer = document.getElementById("berita-featured");
  const listContainer = document.getElementById("berita-list-container");
  const popularContainer = document.getElementById("berita-populer-sidebar");

  const searchInput = document.getElementById("berita-search");
  const searchClear = document.getElementById("berita-search-clear");
  const searchMeta = document.getElementById("berita-search-meta");

  if (!featuredContainer || !listContainer || !popularContainer) return;

  featuredContainer.innerHTML =
    '<div class="absolute inset-0 flex items-center justify-center text-xs text-slate-600">Memuat berita...</div>';
  listContainer.innerHTML =
    '<p class="text-xs text-slate-500">Memuat daftar berita...</p>';
  popularContainer.innerHTML =
    '<p class="text-[11px] text-slate-500">Memuat data...</p>';

  const { list } = await fetchBeritaList(50);
  const all = list || [];

  const apply = () => {
    const q = normalizeText(searchInput ? searchInput.value : "");

    if (searchClear) searchClear.classList.toggle("hidden", !q);

    // filter global
    const filtered = !q
      ? all
      : all.filter((item) => {
          const hay = [item.judul, item.ringkasan, item.kategori]
            .map(normalizeText)
            .join(" ");
          return hay.includes(q);
        });

    // meta info
    if (searchMeta) {
      searchMeta.textContent = q
        ? `Menampilkan ${filtered.length} hasil dari ${all.length} berita.`
        : "";
    }

    // featured = item pertama dari hasil filter (urutnya sudah terbaru karena API order tanggal desc)
    const [featured, ...others] = filtered;

    renderFeatured(featuredContainer, featured);

    // terbaru = sisanya (atau kamu bisa limit, misal 10)
    renderTerbaru(listContainer, others);

    // populer = dari hasil filter, urut views desc, tanggal desc, ambil 4
    const populer = [...filtered]
      .sort(
        (a, b) =>
          (b.views || 0) - (a.views || 0) ||
          new Date(b.tanggal) - new Date(a.tanggal)
      )
      .slice(0, 4);

    renderPopuler(popularContainer, populer);
  };

  // initial render
  apply();

  // bind search
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.addEventListener("input", apply);
    searchInput.dataset.bound = "1";
  }

  if (searchClear && searchInput && !searchClear.dataset.bound) {
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
      if (searchMeta) searchMeta.textContent = "";
      searchClear.classList.add("hidden");
      apply();
    });
    searchClear.dataset.bound = "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("berita");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderBeritaPage();
});
