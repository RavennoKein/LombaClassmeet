// js/kalender-page.js
// Tanpa select tahun + render setelah data siap
// TODAY aktif di CELL (soft). Klik tanggal -> scroll ke event list yang sesuai (tanpa style active solid).

let KALENDER_DATA_CACHE = {
  events: [],
  currentMonth: null,
  currentYear: null,
};

const NAMA_BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// -------------------------
// Utils tanggal (anti geser)
// -------------------------
function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m - 1, d); // LOCAL
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthStart(year, month) {
  const date = new Date(year, month, 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Filter event yang intersect dengan bulan tertentu
 */
function filterEventsForMonth(events, year, month) {
  const startMonth = getMonthStart(year, month);
  const endMonth = new Date(year, month + 1, 0);
  endMonth.setHours(0, 0, 0, 0);

  return events.filter((ev) => {
    const start = parseDateOnly(ev.tanggal_mulai);
    if (!start) return false;
    const end = ev.tanggal_selesai ? parseDateOnly(ev.tanggal_selesai) : start;

    // handle data aneh kalau end < start
    const from = end < start ? end : start;
    const to = end < start ? start : end;

    return to >= startMonth && from <= endMonth;
  });
}

/**
 * Build map: key tanggal (YYYY-MM-DD) -> array events
 */
function buildEventMap(events) {
  const map = {};
  events.forEach((ev) => {
    const start = parseDateOnly(ev.tanggal_mulai);
    if (!start) return;

    const end = ev.tanggal_selesai ? parseDateOnly(ev.tanggal_selesai) : start;

    const from = end < start ? end : start;
    const to = end < start ? start : end;

    const cur = new Date(from);
    cur.setHours(0, 0, 0, 0);

    while (cur <= to) {
      const key = dateKey(cur);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  });
  return map;
}

function formatDateIndo(
  dateString,
  options = { day: "numeric", month: "long", year: "numeric" }
) {
  const date = parseDateOnly(dateString);
  if (!date) return "Tanggal tidak valid";
  return date.toLocaleDateString("id-ID", options);
}

function getFirstEventForDate(eventsForDay) {
  if (!eventsForDay || !eventsForDay.length) return null;
  const sorted = [...eventsForDay].sort((a, b) => {
    return parseDateOnly(a.tanggal_mulai) - parseDateOnly(b.tanggal_mulai);
  });
  return sorted[0] || null;
}

// -------------------------
// Loading / Render gate
// -------------------------
function setLoading(isLoading) {
  const grid = document.getElementById("kalender-grid");
  const list = document.getElementById("kalender-event-list");
  const countEl = document.getElementById("kalender-count");
  const noEventEl = document.getElementById("kalender-no-event");
  const prevBtn = document.getElementById("kalender-prev-bulan");
  const nextBtn = document.getElementById("kalender-next-bulan");
  const labelBulan = document.getElementById("kalender-label-bulan");

  if (prevBtn) prevBtn.disabled = isLoading;
  if (nextBtn) nextBtn.disabled = isLoading;

  if (isLoading) {
    if (labelBulan) labelBulan.textContent = "";
    if (grid) grid.innerHTML = "";
    if (list) list.innerHTML = "";
    if (countEl) countEl.textContent = "";
    if (noEventEl) noEventEl.classList.add("hidden");

    if (grid) {
      grid.innerHTML = `
        <div class="col-span-7 p-10 text-center text-slate-500 italic bg-white rounded-3xl border border-dashed border-slate-300">
          Memuat data kalender...
        </div>
      `;
    }
  }
}

// -------------------------
// Render kalender grid
// -------------------------
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
  const startWeekday = (firstDay.getDay() + 7) % 7; // 0=Sunday

  grid.innerHTML = "";

  const numWeeks = Math.ceil((startWeekday + daysInMonth) / 7);
  const totalCells = numWeeks * 7;
  grid.style.gridTemplateRows = `repeat(${numWeeks}, minmax(90px, 1fr))`;
  grid.style.gap = "8px";

  if (KALENDER_DATA_CACHE.events.length === 0) {
    grid.innerHTML = `
      <div class="col-span-7 p-8 text-center text-slate-500 italic bg-white rounded-3xl border border-dashed border-slate-300">
        Data Kalender Akademik belum tersedia.
      </div>
    `;
    return;
  }

  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    const cell = document.createElement("div");
    cell.className =
      "min-h-[90px] md:min-h-[110px] border border-slate-200 bg-white flex flex-col rounded-xl shadow-sm overflow-hidden transition hover:shadow-md";

    const dayNumber = cellIndex - startWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cell.classList.add("bg-slate-100", "border-slate-100", "shadow-none");
      grid.appendChild(cell);
      continue;
    }

    const dateObj = new Date(year, month, dayNumber);
    dateObj.setHours(0, 0, 0, 0);

    const key = dateKey(dateObj);
    const eventsForDay = eventMap[key] || [];
    const isToday = dateObj.getTime() === TODAY.getTime();

    // TODAY: aktif di CELL (soft)
    if (isToday) {
      cell.classList.remove("bg-white", "border-slate-200");
      cell.classList.add(
        "bg-sky-100",
        "border-primary-300",
        "ring-2",
        "text-primary-700",
        "ring-primary-300",
        "ring-offset-2"
      );
    }

    // Header tanggal (klik -> scroll)
    const dayHeader = document.createElement("button");
    dayHeader.type = "button";
    dayHeader.className =
      "mx-2 mt-2 mb-1 px-2 py-1.5 rounded-lg flex items-center justify-center " +
      "text-sm md:text-base font-extrabold transition select-none ";
    dayHeader.setAttribute("aria-label", `Tanggal ${dayNumber}`);

    // kalau tanggal punya event, kasih hint interaktif kecil
    if (eventsForDay.length) {
      dayHeader.classList.add("cursor-pointer");
      dayHeader.title = "Klik untuk lompat ke detail kegiatan";
    }

    const spanNum = document.createElement("span");
    spanNum.textContent = dayNumber;

    // Minggu merah tetap
    if (dateObj.getDay() === 0) spanNum.classList.add("text-red-600");

    // hari ini: angka agak ditegaskan
    if (isToday && dateObj.getDay() !== 0) {
      spanNum.classList.add("text-primary-700");
    }

    dayHeader.appendChild(spanNum);
    cell.appendChild(dayHeader);

    // Klik tanggal -> scroll ke event pertama di hari itu (tanpa ubah style)
    dayHeader.addEventListener("click", () => {
      const first = getFirstEventForDate(eventsForDay);
      if (first) scrollToEventInList(first.id);
    });

    const body = document.createElement("div");
    body.className = "flex-1 px-2 pb-2 flex flex-col gap-1 overflow-hidden";
    cell.appendChild(body);

    // pill event (tetap seperti sebelumnya)
    if (eventsForDay.length > 0) {
      eventsForDay.slice(0, 2).forEach((ev) => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className =
          "w-full text-left rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 " +
          "text-[10px] md:text-[11px] font-medium truncate shadow-md shadow-emerald-600/20 " +
          "active:scale-[0.98] transition";
        pill.textContent = ev.nama || "Kegiatan";

        const start = formatDateIndo(ev.tanggal_mulai);
        const end = ev.tanggal_selesai
          ? formatDateIndo(ev.tanggal_selesai)
          : null;
        const range = end ? `${start} – ${end}` : start;
        pill.title = `${ev.nama}\nTanggal: ${range}\nKategori: ${
          ev.kategori || "Umum"
        }`;

        pill.dataset.eventId = ev.id;
        pill.addEventListener("click", () => {
          scrollToEventInList(ev.id);
        });

        body.appendChild(pill);
      });

      if (eventsForDay.length > 2) {
        const more = document.createElement("span");
        more.className =
          "text-[10px] font-semibold text-slate-500 pt-1 text-center";
        more.textContent = `+${eventsForDay.length - 2} lainnya`;
        body.appendChild(more);
      }
    }

    grid.appendChild(cell);
  }
}

// -------------------------
// Render list event
// -------------------------
function renderEventList() {
  const list = document.getElementById("kalender-event-list");
  const countEl = document.getElementById("kalender-count");
  const noEventEl = document.getElementById("kalender-no-event");
  if (!list || !countEl || !noEventEl) return;

  const events = KALENDER_DATA_CACHE.events;
  list.innerHTML = "";

  if (!events.length) {
    countEl.textContent = "0 kegiatan tercatat.";
    noEventEl.classList.remove("hidden");
    return;
  }

  countEl.textContent = `${events.length} kegiatan tercatat.`;
  noEventEl.classList.add("hidden");

  const sorted = [...events].sort((a, b) => {
    return parseDateOnly(b.tanggal_mulai) - parseDateOnly(a.tanggal_mulai);
  });

  sorted.forEach((ev) => {
    const card = document.createElement("article");
    card.className =
      "border border-slate-200 rounded-2xl bg-white p-4 flex gap-4 items-start shadow-sm " +
      "hover:shadow-md hover:border-primary-500 transition-all duration-300 h-full";
    card.id = `event-${ev.id}`;

    const dateContainer = document.createElement("div");
    dateContainer.className =
      "flex flex-col items-center justify-start flex-shrink-0 w-24 md:w-28 pt-1";

    const start = parseDateOnly(ev.tanggal_mulai);
    const end = ev.tanggal_selesai ? parseDateOnly(ev.tanggal_selesai) : start;

    const dateText = document.createElement("p");
    dateText.className =
      "text-sm font-semibold text-primary-600 leading-tight text-center";

    if (start && end && start.getTime() === end.getTime()) {
      dateText.textContent = formatDateIndo(ev.tanggal_mulai, {
        day: "numeric",
        month: "short",
      });
    } else if (start && end) {
      dateText.innerHTML = `${formatDateIndo(ev.tanggal_mulai, {
        day: "numeric",
        month: "short",
      })}
        <br class="hidden md:block"/> — <br class="hidden md:block"/>
        ${formatDateIndo(ev.tanggal_selesai, {
          day: "numeric",
          month: "short",
        })}`;
    } else {
      dateText.textContent = "Tgl. Invalid";
    }

    const yearText = document.createElement("p");
    yearText.className = "text-xs text-slate-500 mt-0.5";
    yearText.textContent = start ? start.getFullYear() : "";

    dateContainer.append(dateText, yearText);
    card.appendChild(dateContainer);

    const separator = document.createElement("div");
    separator.className =
      "w-[2px] h-16 rounded-full bg-slate-200 flex-shrink-0 mt-1";
    card.appendChild(separator);

    const body = document.createElement("div");
    body.className = "space-y-1 flex-1 min-w-0";

    const title = document.createElement("p");
    title.className =
      "font-bold text-base md:text-lg text-slate-900 leading-snug";
    title.textContent = ev.nama || "Kegiatan";

    const meta = document.createElement("p");
    meta.className =
      "text-xs md:text-sm text-slate-500 flex items-center gap-2";
    meta.innerHTML = `<span class="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium text-[11px]">${
      ev.kategori || "Akademik"
    }</span>`;

    const ket = document.createElement("p");
    ket.className = "text-sm text-slate-700 pt-1";
    ket.textContent = ev.keterangan || "— Keterangan belum tersedia —";

    body.append(title, meta, ket);
    card.appendChild(body);

    list.appendChild(card);
  });
}

function scrollToEventInList(eventId) {
  const el = document.getElementById(`event-${eventId}`);
  if (!el) return;

  el.classList.add("ring-4", "ring-primary-300", "scale-[1.01]", "z-10");
  el.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    el.classList.remove("ring-4", "ring-primary-300", "scale-[1.01]", "z-10");
  }, 2000);
}

async function initKalenderData() {
  const events = await fetchKalenderAll();
  KALENDER_DATA_CACHE.events = events || [];

  if (KALENDER_DATA_CACHE.events.length) {
    const first = parseDateOnly(KALENDER_DATA_CACHE.events[0].tanggal_mulai);
    if (first) {
      KALENDER_DATA_CACHE.currentMonth = first.getMonth();
      KALENDER_DATA_CACHE.currentYear = first.getFullYear();
    } else {
      KALENDER_DATA_CACHE.currentMonth = TODAY.getMonth();
      KALENDER_DATA_CACHE.currentYear = TODAY.getFullYear();
    }
  } else {
    KALENDER_DATA_CACHE.currentMonth = TODAY.getMonth();
    KALENDER_DATA_CACHE.currentYear = TODAY.getFullYear();
  }

  renderKalenderGrid();
  renderEventList();
}

async function renderKalenderPage() {
  const prevBtn = document.getElementById("kalender-prev-bulan");
  const nextBtn = document.getElementById("kalender-next-bulan");
  if (!prevBtn || !nextBtn) return;

  setLoading(true);
  try {
    await initKalenderData();
  } finally {
    setLoading(false);
  }

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
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof initNavbar === "function") initNavbar("kalender");
  if (typeof initFooterYear === "function") initFooterYear();
  if (typeof initFloatingButtons === "function") initFloatingButtons();
  if (typeof initForumWidget === "function") initForumWidget();

  renderKalenderPage();
});
