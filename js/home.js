async function renderHomeBerita() {
  const container = document.getElementById("home-berita-container");
  const statBeritaEl = document.getElementById("stat-berita-count");
  if (!container) return;

  container.innerHTML =
    '<p class="col-span-3 text-xs text-slate-500">Memuat berita...</p>';

  const { list, count } = await fetchBeritaList(3);

  if (statBeritaEl) {
    statBeritaEl.textContent = count;
  }

  if (!list.length) {
    container.innerHTML =
      '<p class="col-span-3 text-xs text-slate-500">Belum ada berita.</p>';
    return;
  }

  container.innerHTML = "";
  list.forEach((item) => {
    const card = document.createElement("article");
    card.className =
      "bg-white rounded-3xl overflow-hidden shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-300";

    const imageLink = document.createElement("a");
    imageLink.href = `berita-detail.html?id=${item.id}`;
    imageLink.className = "block";

    const imageDiv = document.createElement("div");
    imageDiv.className = "w-full h-40 bg-slate-200 overflow-hidden";
    const imgSrc = getImageUrl(item.thumbnail_path) || "";
    imageDiv.innerHTML = `
      <img
        src="${imgSrc}"
        alt="${(item.judul || "Gambar").replace(/"/g, "&quot;")}"
        class="w-full h-full object-cover"
        loading="lazy"
        onerror="this.onerror=null;this.src='https://via.placeholder.com/800x450?text=No+Image';"
      />
    `;
    imageLink.appendChild(imageDiv);

    const contentDiv = document.createElement("div");
    contentDiv.className = "p-6 space-y-3";

    // Tag/Kategori (Contoh statis, bisa disesuaikan jika data Supabase ada)
    const tag = document.createElement("span");
    tag.className =
      "text-xs font-bold text-primary-600 tracking-wider uppercase";
    tag.textContent = item.kategori || "#Umum";

    const title = document.createElement("h3");
    title.className = "text-lg font-extrabold text-slate-800 leading-snug";

    const titleLink = document.createElement("a");
    titleLink.href = `berita-detail.html?id=${item.id}`;
    titleLink.className = "hover:text-primary-600 transition";
    titleLink.textContent = item.judul;

    title.appendChild(titleLink);

    const ringkasan = document.createElement("p");
    ringkasan.className = "text-sm text-slate-600 line-clamp-2";
    ringkasan.textContent =
      item.ringkasan || "Klik untuk membaca selengkapnya...";

    const metaDiv = document.createElement("div");
    metaDiv.className =
      "text-xs text-slate-500 border-t border-slate-100 pt-3 flex items-center justify-between";
    metaDiv.innerHTML = `
        <p><span class="font-semibold">Dipublikasi:</span> ${formatDateIndo(
          item.tanggal
        )}</p>
        <p>Oleh <span class="font-semibold">${
          item.penulis || "Admin"
        }</span></p>
    `;

    contentDiv.append(tag, title, ringkasan, metaDiv);
    card.append(imageLink, contentDiv);

    container.appendChild(card);
  });
}

async function renderHomePrestasi() {
  const container = document.getElementById("home-prestasi-container");
  const statPrestasiEl = document.getElementById("stat-prestasi-count");
  if (!container) return;

  container.innerHTML =
    '<p class="col-span-2 text-xs text-slate-500">Memuat prestasi...</p>';

  const { list, count } = await fetchPrestasiList(4);

  if (statPrestasiEl) {
    statPrestasiEl.textContent = count;
  }

  if (!list.length) {
    container.innerHTML =
      '<p class="col-span-2 text-xs text-slate-500">Belum ada data prestasi.</p>';
    return;
  }

  container.innerHTML = "";
  list.forEach((item) => {
    const card = document.createElement("article");
    card.className =
      "flex items-start bg-white rounded-3xl p-6 shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-300";

    const iconDiv = document.createElement("div");
    iconDiv.className =
      "flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mr-4 mt-1";
    iconDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.27a11.95 11.95 0 010 17.942C12.445 20.985 10 17.548 10 17.548V14.5a3 3 0 00-3-3H6.5c-1.104 0-2 .896-2 2v3.048c0 3.864 2.445 7.301 6.382 7.732a11.95 11.95 0 010-17.942z" />
        </svg>
    `;

    const body = document.createElement("div");
    body.className = "flex-1 space-y-1";

    const title = document.createElement("h3");
    title.className = "text-xl font-extrabold text-slate-800 leading-snug";
    title.textContent = item.lomba;

    const name = document.createElement("p");
    name.className = "text-sm font-bold text-primary-700 mt-0.5";
    name.textContent = `${item.nama_siswa || "Siswa/Tim"}`;

    const description = document.createElement("p");
    description.className = "text-sm text-slate-600 mt-1";
    description.textContent =
      item.juara ||
      item.deskripsi_singkat ||
      "Pencapaian luar biasa di tingkat " + item.tingkat;

    const chips = document.createElement("div");
    chips.className = "flex flex-wrap gap-2 pt-3 text-xs";
    chips.innerHTML = `
        <span class="px-3 py-1 rounded-full bg-primary-50 text-primary-700 font-semibold">
            ${item.tingkat || "Internasional"}
        </span>
        <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
            ${item.tahun || new Date().getFullYear()}
        </span>
        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            ${item.kelas || "Umum"}
        </span>
    `;

    body.append(title, name, description, chips);
    card.append(iconDiv, body);
    container.appendChild(card);
  });
}

async function renderHomeStatsTambahan() {
  // Pengumuman & kalender bisa dihitung dari tabel
  const statPengEl = document.getElementById("stat-pengumuman-count");
  const statKalenderEl = document.getElementById("stat-kalender-tahun");

  // Pengumuman aktif
  if (statPengEl) {
    const { count, error } = await supabaseClient
      .from("pengumuman")
      .select("*", { count: "exact", head: true })
      .eq("aktif", true);
    if (!error) {
      statPengEl.textContent = count ?? "-";
    }
  }

  // Tahun ajaran (ambil distinct tahun terbaru dari kalender_akademik)
  if (statKalenderEl) {
    const { data, error } = await supabaseClient
      .from("kalender_akademik")
      .select("tahun")
      .order("tahun", { ascending: false })
      .limit(1);
    if (!error && data && data.length) {
      statKalenderEl.textContent = data[0].tahun;
    } else {
      statKalenderEl.textContent = "-";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("home");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();

  renderHomeBerita();
  renderHomePrestasi();
  renderHomeStatsTambahan();
});
