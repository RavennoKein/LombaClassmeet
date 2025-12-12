// js/prestasi-page.js
// Logika halaman daftar prestasi + search

function normalizeText(str) {
  return (str || "").toString().toLowerCase().trim();
}

function renderPrestasiList(listContainer, items) {
  listContainer.innerHTML = "";

  if (!items.length) {
    listContainer.innerHTML =
      '<p class="col-span-2 text-xs text-slate-500">Tidak ada prestasi yang cocok.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className =
      "bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-start";

    // kiri: foto jika ada, fallback ke avatar inisial
    let mediaWrapper;

    if (item.foto_path) {
      const imgUrl = getImageUrl(item.foto_path);
      mediaWrapper = document.createElement("div");
      mediaWrapper.className =
        "w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0";

      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = item.nama_siswa || "Foto prestasi";
      img.loading = "lazy";
      img.className = "w-full h-full object-cover";

      mediaWrapper.appendChild(img);
    } else {
      mediaWrapper = document.createElement("div");
      mediaWrapper.className =
        "w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 flex-shrink-0";

      const initials =
        (item.nama_siswa || "")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .substring(0, 2)
          .toUpperCase() || "?";

      mediaWrapper.textContent = initials;
    }

    const body = document.createElement("div");
    body.className = "space-y-1";

    const name = document.createElement("p");
    name.className = "font-semibold text-slate-900 text-xs md:text-sm";
    name.textContent = item.nama_siswa || "-";

    const meta1 = document.createElement("p");
    meta1.className = "text-[11px] text-slate-500";
    meta1.textContent = `${item.kelas || "-"} • ${item.tingkat || "-"}`;

    const meta2 = document.createElement("p");
    meta2.className = "text-[11px] text-slate-700";
    meta2.textContent = `${item.lomba || "-"} – ${item.juara || "-"}`;

    const date = document.createElement("p");
    date.className = "text-[10px] text-slate-500";
    date.textContent = formatDateIndo(item.tanggal);

    if (item.deskripsi) {
      const desc = document.createElement("p");
      desc.className = "text-[11px] text-slate-700";
      desc.textContent = item.deskripsi;
      body.append(name, meta1, meta2, date, desc);
    } else {
      body.append(name, meta1, meta2, date);
    }

    card.append(mediaWrapper, body);
    listContainer.appendChild(card);
  });
}

async function renderPrestasiPage() {
  const listContainer = document.getElementById("prestasi-list-container");
  const totalEl = document.getElementById("prestasi-total");
  const totalInfoEl = document.getElementById("prestasi-total-info");

  const searchInput = document.getElementById("prestasi-search");
  const searchClear = document.getElementById("prestasi-search-clear");
  const searchMeta = document.getElementById("prestasi-search-meta");

  if (!listContainer || !totalEl) return;

  listContainer.innerHTML =
    '<p class="col-span-2 text-xs text-slate-500">Memuat prestasi...</p>';

  const { list, count } = await fetchPrestasiList(50);
  const all = list || [];
  const total = count ?? all.length;

  // helper apply filter + render
  const apply = () => {
    const q = normalizeText(searchInput ? searchInput.value : "");

    if (searchClear) searchClear.classList.toggle("hidden", !q);

    const filtered = !q
      ? all
      : all.filter((item) => {
          const hay = [
            item.nama_siswa,
            item.kelas,
            item.tingkat,
            item.lomba,
            item.juara,
            item.deskripsi,
          ]
            .map(normalizeText)
            .join(" ");
          return hay.includes(q);
        });

    // total display: hasil / total
    totalEl.textContent = filtered.length;

    if (totalInfoEl) {
      totalInfoEl.textContent = q ? ` / ${total}` : "";
    }

    if (searchMeta) {
      searchMeta.textContent = q
        ? `Menampilkan ${filtered.length} hasil dari ${total} prestasi.`
        : "";
    }

    renderPrestasiList(listContainer, filtered);
  };

  // initial
  if (!all.length) {
    totalEl.textContent = 0;
    if (totalInfoEl) totalInfoEl.textContent = "";
    listContainer.innerHTML =
      '<p class="col-span-2 text-xs text-slate-500">Belum ada data prestasi.</p>';
    return;
  }

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
      if (totalInfoEl) totalInfoEl.textContent = "";
      searchClear.classList.add("hidden");
      apply();
    });
    searchClear.dataset.bound = "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("prestasi");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderPrestasiPage();
});
