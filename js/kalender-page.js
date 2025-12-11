// js/kalender-page.js
// Logika halaman kalender akademik interaktif (grid bulanan + daftar acara)

let KALENDER_DATA_CACHE = {
  tahun: null,
  events: [],
  currentMonth: null,
  currentYear: null,
};

const NAMA_BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function getMonthStart(year, month) {
  // month: 0-11
  return new Date(year, month, 1);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function filterEventsForMonth(events, year, month) {
  const startMonth = new Date(year, month, 1);
  const endMonth = new Date(year, month + 1, 0);
  return events.filter((ev) => {
    const start = new Date(ev.tanggal_mulai);
    const end = ev.tanggal_selesai ? new Date(ev.tanggal_selesai) : start;
    return end >= startMonth && start <= endMonth;
  });
}

function buildEventMap(events) {
  const map = {};
  events.forEach((ev) => {
    const start = new Date(ev.tanggal_mulai);
    const end = ev.tanggal_selesai ? new Date(ev.tanggal_selesai) : start;
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
}

function renderKalenderGrid() {
  const grid = document.getElementById("kalender-grid");
  const labelBulan = document.getElementById("kalender-label-bulan");
  if (!grid || !labelBulan) return;

  const year = KALENDER_DATA_CACHE.currentYear;
  const month = KALENDER_DATA_CACHE.currentMonth;
  if (year == null || month == null) return;

  labelBulan.textContent = `${NAMA_BULAN_ID[month]} ${year}`;

  const eventsThisMonth = filterEventsForMonth(
    KALENDER_DATA_CACHE.events,
    year,
    month
  );
  const eventMap = buildEventMap(eventsThisMonth);

  const firstDay = getMonthStart(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const startWeekday = (firstDay.getDay() + 7) % 7;

  grid.innerHTML = "";

  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    const cell = document.createElement("div");
    cell.className =
      "min-h-[70px] md:min-h-[80px] border border-slate-100 bg-white flex flex-col";

    const dayNumber = cellIndex - startWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cell.classList.add("bg-slate-50");
      grid.appendChild(cell);
      continue;
    }

    const dateObj = new Date(year, month, dayNumber);
    const key = dateObj.toISOString().slice(0, 10);
    const dayHeader = document.createElement("div");
    dayHeader.className =
      "px-1.5 pt-1.5 pb-0.5 flex items-center justify-between text-[10px] md:text-[11px]";
    const spanNum = document.createElement("span");
    spanNum.className = "font-semibold text-slate-700";
    spanNum.textContent = dayNumber;
    dayHeader.appendChild(spanNum);
    cell.appendChild(dayHeader);

    const body = document.createElement("div");
    body.className = "flex-1 px-1.5 pb-1.5 flex flex-col gap-[2px]";
    cell.appendChild(body);

    const eventsForDay = eventMap[key] || [];
    eventsForDay.slice(0, 3).forEach((ev) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className =
        "w-full text-left rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-[2px] text-[9px] md:text-[10px] truncate shadow-sm";
      pill.textContent = ev.nama || "Kegiatan";

      // tooltip  pakai title
      const start = formatDateIndo(ev.tanggal_mulai);
      const end = ev.tanggal_selesai ? formatDateIndo(ev.tanggal_selesai) : null;
      const range = end ? `${start} – ${end}` : start;
      pill.title = `${ev.nama}\n${range}\n${ev.kategori || ""}`.trim();

      pill.dataset.eventId = ev.id;
      pill.addEventListener("click", () => {
        scrollToEventInList(ev.id);
      });

      body.appendChild(pill);
    });

    if (eventsForDay.length > 3) {
      const more = document.createElement("span");
      more.className = "text-[9px] text-slate-500";
      more.textContent = `+${eventsForDay.length - 3} kegiatan`;
      body.appendChild(more);
    }

    grid.appendChild(cell);
  }
}

function renderEventList() {
  const list = document.getElementById("kalender-event-list");
  const countEl = document.getElementById("kalender-count");
  if (!list || !countEl) return;

  const events = KALENDER_DATA_CACHE.events;
  if (!events.length) {
    countEl.textContent = "0 kegiatan tercatat.";
    list.innerHTML =
      '<p class="text-xs text-slate-500">Belum ada data kalender untuk tahun pelajaran ini.</p>';
    return;
  }

  countEl.textContent = `${events.length} kegiatan tercatat.`;

  // urutkan berdasarkan tanggal mulai
  const sorted = [...events].sort((a, b) => {
    return new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai);
  });

  list.innerHTML = "";
  sorted.forEach((ev) => {
    const card = document.createElement("article");
    card.className =
      "border border-slate-200 rounded-xl bg-slate-50 px-3 py-2 flex gap-3 items-start hover:border-primary-500 transition";
    card.id = `event-${ev.id}`;

    const badge = document.createElement("div");
    badge.className =
      "mt-0.5 w-1 rounded-full bg-emerald-500 flex-shrink-0";
    card.appendChild(badge);

    const body = document.createElement("div");
    body.className = "space-y-1 flex-1";

    const title = document.createElement("p");
    title.className = "font-semibold text-xs md:text-sm text-slate-900";
    title.textContent = ev.nama || "Kegiatan";

    const start = formatDateIndo(ev.tanggal_mulai);
    const end = ev.tanggal_selesai ? formatDateIndo(ev.tanggal_selesai) : null;
    const range = end ? `${start} – ${end}` : start;

    const meta = document.createElement("p");
    meta.className = "text-[10px] md:text-[11px] text-slate-500";
    meta.textContent = `${range} • ${ev.kategori || "Kegiatan Akademik"}`;

    const ket = document.createElement("p");
    ket.className = "text-[11px] text-slate-700";
    ket.textContent = ev.keterangan || "";

    body.append(title, meta, ket);
    card.appendChild(body);

    list.appendChild(card);
  });
}

function scrollToEventInList(eventId) {
  const el = document.getElementById(`event-${eventId}`);
  if (!el) return;
  el.classList.add("ring-2", "ring-primary-500");
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    el.classList.remove("ring-2", "ring-primary-500");
  }, 1500);
}

async function initKalenderDataForYear(tahun) {
  const events = await fetchKalenderByTahun(tahun);
  KALENDER_DATA_CACHE.tahun = tahun;
  KALENDER_DATA_CACHE.events = events || [];

  // tentukan bulan & tahun aktif:
  if (events.length) {
    const first = new Date(events[0].tanggal_mulai);
    KALENDER_DATA_CACHE.currentMonth = first.getMonth();
    KALENDER_DATA_CACHE.currentYear = first.getFullYear();
  } else {
    const now = new Date();
    KALENDER_DATA_CACHE.currentMonth = now.getMonth();
    KALENDER_DATA_CACHE.currentYear = now.getFullYear();
  }

  renderKalenderGrid();
  renderEventList();
}

async function renderKalenderPage() {
  const selectEl = document.getElementById("kalender-tahun");
  const prevBtn = document.getElementById("kalender-prev-bulan");
  const nextBtn = document.getElementById("kalender-next-bulan");

  if (!selectEl || !prevBtn || !nextBtn) return;

  // ambil daftar tahun unik
  const tahunList = await fetchKalenderTahunList();
  selectEl.innerHTML = "";

  if (!tahunList.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Belum ada data tahun ajaran";
    selectEl.appendChild(opt);
    // kosongkan grid & list
    const grid = document.getElementById("kalender-grid");
    const list = document.getElementById("kalender-event-list");
    const countEl = document.getElementById("kalender-count");
    if (grid) grid.innerHTML = "";
    if (list) list.innerHTML =
      '<p class="text-xs text-slate-500">Belum ada data kalender.</p>';
    if (countEl) countEl.textContent = "";
    return;
  }

  tahunList.forEach((tahun, idx) => {
    const opt = document.createElement("option");
    opt.value = tahun;
    opt.textContent = tahun;
    if (idx === 0) opt.selected = true;
    selectEl.appendChild(opt);
  });

  selectEl.addEventListener("change", () => {
    const tahun = selectEl.value;
    if (tahun) {
      initKalenderDataForYear(tahun);
    }
  });

  prevBtn.addEventListener("click", () => {
    if (KALENDER_DATA_CACHE.currentMonth == null) return;
    let m = KALENDER_DATA_CACHE.currentMonth - 1;
    let y = KALENDER_DATA_CACHE.currentYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    KALENDER_DATA_CACHE.currentMonth = m;
    KALENDER_DATA_CACHE.currentYear = y;
    renderKalenderGrid();
  });

  nextBtn.addEventListener("click", () => {
    if (KALENDER_DATA_CACHE.currentMonth == null) return;
    let m = KALENDER_DATA_CACHE.currentMonth + 1;
    let y = KALENDER_DATA_CACHE.currentYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    KALENDER_DATA_CACHE.currentMonth = m;
    KALENDER_DATA_CACHE.currentYear = y;
    renderKalenderGrid();
  });

  // init pertama kali pakai tahun pertama
  if (tahunList[0]) {
    await initKalenderDataForYear(tahunList[0]);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("kalender");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderKalenderPage();
});
