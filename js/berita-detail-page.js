// js/berita-detail-page.js
// Logika halaman detail berita (menggunakan query param ?id=)

function getBeritaIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? parseInt(id, 10) : null;
}

function buildSmallThumb(url) {
  const wrapper = document.createElement("div");
  wrapper.className =
    "w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0";
  if (!url) {
    return wrapper;
  }
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Gambar berita";
  img.loading = "lazy";
  img.className = "w-full h-full object-cover";
  wrapper.appendChild(img);
  return wrapper;
}

async function renderBeritaDetailPage() {
  const id = getBeritaIdFromUrl();
  const titleEl = document.getElementById("detail-judul");
  const metaEl = document.getElementById("detail-meta");
  const contentEl = document.getElementById("detail-konten");
  const othersContainer = document.getElementById("detail-berita-lainnya");
  const imgWrapper = document.getElementById("detail-image-wrapper");
  const imgEl = document.getElementById("detail-image");

  if (!titleEl || !metaEl || !contentEl || !othersContainer) return;

  if (!id) {
    titleEl.textContent = "Berita tidak ditemukan";
    metaEl.textContent = "";
    contentEl.innerHTML =
      '<p class="text-xs text-slate-500">Parameter id berita tidak valid.</p>';
    return;
  }

  // ambil detail berita
  const berita = await fetchBeritaById(id);
  if (!berita) {
    titleEl.textContent = "Berita tidak ditemukan";
    metaEl.textContent = "";
    contentEl.innerHTML =
      '<p class="text-xs text-slate-500">Data berita tidak tersedia.</p>';
    return;
  }

  // isi judul & meta
  titleEl.textContent = berita.judul || "Berita Sekolah";
  const viewsDisplay = (berita.views || 0) + 1; // asumsi akan bertambah 1
  const kategori = berita.kategori || "Berita Sekolah";
  metaEl.textContent = `${formatDateIndo(berita.tanggal)} • ${kategori} • ${viewsDisplay}x dibaca`;

  // gambar utama
  if (berita.thumbnail_path && imgWrapper && imgEl) {
    const url = getImageUrl(berita.thumbnail_path);
    if (url) {
      imgEl.src = url;
      imgWrapper.classList.remove("hidden");
    }
  }

  // isi konten sederhana per paragraf
  contentEl.innerHTML = "";
  if (berita.isi) {
    const parts = berita.isi.split(/\n\n+/);
    parts.forEach((p) => {
      const para = document.createElement("p");
      para.textContent = p.trim();
      contentEl.appendChild(para);
    });
  } else if (berita.ringkasan) {
    const para = document.createElement("p");
    para.textContent = berita.ringkasan;
    contentEl.appendChild(para);
  } else {
    const para = document.createElement("p");
    para.className = "text-xs text-slate-500";
    para.textContent = "Belum ada isi berita.";
    contentEl.appendChild(para);
  }

  // berita lainnya (pakai berita terbaru, exclude id ini)
  othersContainer.innerHTML =
    '<p class="text-[11px] text-slate-500">Memuat berita lainnya...</p>';

  const { list } = await fetchBeritaList(6);
  const others = (list || []).filter((item) => item.id !== id);

  if (!others.length) {
    othersContainer.innerHTML =
      '<p class="text-[11px] text-slate-500">Belum ada berita lain.</p>';
  } else {
    othersContainer.innerHTML = "";
    others.forEach((item) => {
      const link = document.createElement("a");
      link.href = `berita-detail.html?id=${item.id}`;
      link.className =
        "flex gap-2 items-start hover:bg-slate-100 rounded-lg p-1.5";

      const tUrl = item.thumbnail_path
        ? getImageUrl(item.thumbnail_path)
        : (item.thumbnail_url || "");
      const thumbBox = buildSmallThumb(tUrl);

      const body = document.createElement("div");
      body.className = "flex-1 space-y-0.5";

      const title = document.createElement("p");
      title.className =
        "text-[11px] md:text-xs font-semibold text-slate-900 line-clamp-2";
      title.textContent = item.judul;

      const meta = document.createElement("p");
      meta.className = "text-[10px] text-slate-500";
      meta.textContent = `${formatDateIndo(item.tanggal)} • ${item.views || 0}x dibaca`;

      body.append(title, meta);
      link.append(thumbBox, body);
      othersContainer.appendChild(link);
    });
  }

  // increment views di backend (asinkron, tidak perlu ditunggu)
  incrementBeritaViews(id);
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("berita");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderBeritaDetailPage();
});
