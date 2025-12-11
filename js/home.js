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
      "bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col gap-1";

    const tanggal = document.createElement("p");
    tanggal.className = "text-[11px] text-slate-500";
    tanggal.textContent = formatDateIndo(item.tanggal);

    const title = document.createElement("a");
    title.href = `berita-detail.html?id=${item.id}`;
    title.className =
      "font-semibold text-slate-900 text-xs md:text-sm hover:text-primary-700";
    title.textContent = item.judul;

    const desc = document.createElement("p");
    desc.className = "text-[11px] text-slate-700 line-clamp-3";
    desc.textContent = item.ringkasan || "";

    card.append(tanggal, title, desc);
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
      "bg-white rounded-xl border border-slate-200 p-3 flex gap-3 items-start";

    const avatar = document.createElement("div");
    avatar.className =
      "w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-700 flex-shrink-0";
    const initials =
      (item.nama_siswa || "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "?";
    avatar.textContent = initials;

    const body = document.createElement("div");
    body.className = "space-y-0.5";

    const name = document.createElement("p");
    name.className = "font-semibold text-slate-900 text-xs md:text-sm";
    name.textContent = item.nama_siswa;

    const meta = document.createElement("p");
    meta.className = "text-[11px] text-slate-500";
    meta.textContent = `${item.kelas || "-"} • ${item.tingkat || "-"}`;

    const detail = document.createElement("p");
    detail.className = "text-[11px] text-slate-700";
    detail.textContent = `${item.lomba} – ${item.juara || "-"}`;

    body.append(name, meta, detail);
    card.append(avatar, body);
    container.appendChild(card);
  });
}

async function renderHomeStatsTambahan() {
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
