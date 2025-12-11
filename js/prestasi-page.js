
async function renderPrestasiPage() {
  const listContainer = document.getElementById("prestasi-list-container");
  const totalEl = document.getElementById("prestasi-total");
  if (!listContainer || !totalEl) return;

  listContainer.innerHTML =
    '<p class="col-span-2 text-xs text-slate-500">Memuat prestasi...</p>';

  const { list, count } = await fetchPrestasiList(50);

  totalEl.textContent = count;

  if (!list.length) {
    listContainer.innerHTML =
      '<p class="col-span-2 text-xs text-slate-500">Belum ada data prestasi.</p>';
    return;
  }

  listContainer.innerHTML = "";
  list.forEach((item) => {
    const card = document.createElement("article");
    card.className =
      "bg-white rounded-xl border border-slate-200 p-4 flex gap-3 items-start";

    const avatar = document.createElement("div");
    avatar.className =
      "w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 flex-shrink-0";
    const initials =
      (item.nama_siswa || "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase() || "?";
    avatar.textContent = initials;

    const body = document.createElement("div");
    body.className = "space-y-1";

    const name = document.createElement("p");
    name.className = "font-semibold text-slate-900 text-xs md:text-sm";
    name.textContent = item.nama_siswa;

    const meta1 = document.createElement("p");
    meta1.className = "text-[11px] text-slate-500";
    meta1.textContent = `${item.kelas || "-"} • ${item.tingkat || "-"}`;

    const meta2 = document.createElement("p");
    meta2.className = "text-[11px] text-slate-700";
    meta2.textContent = `${item.lomba} – ${item.juara || "-"}`;

    const date = document.createElement("p");
    date.className = "text-[10px] text-slate-500";
    date.textContent = formatDateIndo(item.tanggal);

    body.append(name, meta1, meta2, date);
    card.append(avatar, body);
    listContainer.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("prestasi");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderPrestasiPage();
});
