// js/prestasi-page.js
// Logika halaman daftar prestasi + search

function normalizeText(str) {
  return (str || "").toString().toLowerCase().trim();
}

let allPrestasiData = [];
let currentStats = null;

function renderPrestasiList(listContainer, items) {
  listContainer.innerHTML = "";

  if (!items.length) {
    listContainer.innerHTML =
      '<p class="col-span-2 text-xs text-slate-500">Tidak ada prestasi yang cocok.</p>';
    return;
  }

  // Hitung statistik dari data yang ditampilkan
  const stats = calculatePrestasiStats(items);
  updatePrestasiStats(stats);

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className =
      "bg-white rounded-3xl overflow-hidden shadow-soft border border-slate-100 hover:shadow-xl transition-all duration-300 flex items-start p-6";

    // kiri: foto jika ada, fallback ke avatar inisial
    let mediaWrapper;

    if (item.foto_path) {
      const imgUrl = getImageUrl(item.foto_path);
      mediaWrapper = document.createElement("div");
      mediaWrapper.className =
        "w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0 mr-2";

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
    body.className = "flex-1 space-y-1";

    const title = document.createElement("h3");
    title.className = "text-xl font-extrabold text-slate-800 leading-snug";
    title.textContent = item.lomba;

    const name = document.createElement("p");
    name.className = "text-sm font-bold text-primary-700 mt-0.5";
    name.textContent = `${item.nama_siswa || 'Siswa/Tim'}`;

    const juaraInfo = document.createElement("p");
    let juaraColorClass = "";
    let juaraText = (item.juara || "").toLowerCase();

    const isJuara1 = /^juara\s*1\b|^1(?!\d)\b|^pertama\b|^emas\b|^i\b/i.test(juaraText);
    const isJuara2 = /^juara\s*2\b|^2(?!\d)\b|^kedua\b|^perak\b|^ii\b/i.test(juaraText);
    const isJuara3 = /^juara\s*3\b|^3(?!\d)\b|^ketiga\b|^perunggu\b|^iii\b/i.test(juaraText);
    const isHarapan1 = /^harapan\s*1\b|^1(?!\d).*harapan/i.test(juaraText);
    const isFavorit1 = /^favorit\s*1\b|^1(?!\d).*favorit/i.test(juaraText);
    const isKhusus1 = /^khusus\s*1\b|^1(?!\d).*khusus/i.test(juaraText);
    const isJuara11Plus = /juara\s*1[1-9]|juara\s*[4-9]|juara\s*[1-9][0-9]/i.test(juaraText);

    if (isJuara1 && !isHarapan1 && !isFavorit1 && !isKhusus1 && !isJuara11Plus) {
      juaraColorClass = "text-[#7c5900] font-semibold";
    } else if (isJuara2 && !isJuara11Plus) {
      juaraColorClass = "text-[#4a4a4a] font-semibold";
    } else if (isJuara3 && !isJuara11Plus) {
      juaraColorClass = "text-[#5a2d0c] font-semibold";
    } else {
      juaraColorClass = "text-[#0b2e66] font-semibold";
    }

    juaraInfo.className = `text-xs ${juaraColorClass} mt-0.5 flex items-center gap-1`;
    juaraInfo.innerHTML = `${item.juara || "Penghargaan"}`;

    const description = document.createElement("p");
    description.className = "text-sm text-slate-600 mt-2";
    description.textContent = item.deskripsi || "Pencapaian luar biasa di tingkat " + (item.tingkat || "internasional");

    const dateDiv = document.createElement("div");
    dateDiv.className = "text-xs text-slate-500 pt-2";
    dateDiv.textContent = formatDateIndo(item.tanggal);

    const chips = document.createElement("div");
    chips.className = "flex flex-wrap gap-2 pt-3 text-xs";

    const chipsData = [
      {
        label: item.tingkat || "Internasional",
        bg: "bg-primary-50",
        text: "text-primary-700"
      },
      {
        label: item.tahun || new Date().getFullYear(),
        bg: "bg-emerald-50",
        text: "text-emerald-700"
      },
      {
        label: item.kelas || "Umum",
        bg: "bg-slate-100",
        text: "text-slate-700"
      }
    ];

    chipsData.forEach(chip => {
      const chipSpan = document.createElement("span");
      chipSpan.className = `px-3 py-1 rounded-full ${chip.bg} ${chip.text} font-semibold`;
      chipSpan.textContent = chip.label;
      chips.appendChild(chipSpan);
    });

    body.append(title, name, juaraInfo, description, dateDiv, chips);
    card.append(mediaWrapper, body);
    listContainer.appendChild(card);
  });
}

async function renderPrestasiPage() {
  const listContainer = document.getElementById("prestasi-list-container");
  const totalEl = document.getElementById("prestasi-total");
  const tahunIniEl = document.getElementById("prestasi-tahun-ini");

  const searchInput = document.getElementById("prestasi-search");
  const searchClear = document.getElementById("prestasi-search-clear");
  const searchMeta = document.getElementById("prestasi-search-meta");

  if (!listContainer || !totalEl || !tahunIniEl) return;

  listContainer.innerHTML =
    '<p class="col-span-2 text-xs text-slate-500">Memuat prestasi...</p>';

  const { list, count } = await fetchPrestasiList(50);
  allPrestasiData = list || [];
  const total = count ?? allPrestasiData.length;

  // Update total prestasi
  totalEl.textContent = total;

  // Hitung statistik awal
  const initialStats = calculatePrestasiStats(allPrestasiData);
  tahunIniEl.textContent = initialStats.prestasiTahunIni;
  updatePrestasiStats(initialStats);
  currentStats = initialStats;

  if (!allPrestasiData.length) {
    listContainer.innerHTML =
      '<p class="col-span-2 text-xs text-slate-500">Belum ada data prestasi.</p>';
    return;
  }

  // Fungsi untuk apply filter dan render
  const applyFilter = () => {
    const q = normalizeText(searchInput ? searchInput.value : "");

    if (searchClear) searchClear.classList.toggle("hidden", !q);

    const filtered = !q
      ? allPrestasiData
      : allPrestasiData.filter((item) => {
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

    // Update total display
    totalEl.textContent = filtered.length;

    if (searchMeta) {
      searchMeta.textContent = q
        ? `Menampilkan ${filtered.length} hasil dari ${total} prestasi.`
        : "";
    }

    // Render daftar prestasi
    renderPrestasiList(listContainer, filtered);

    // Update statistik berdasarkan data yang difilter
    const filteredStats = calculatePrestasiStats(filtered);
    tahunIniEl.textContent = filteredStats.prestasiTahunIni;
    updatePrestasiStats(filteredStats);
    currentStats = filteredStats;
  };

  // Render awal
  applyFilter();

  // Bind search events
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.addEventListener("input", applyFilter);
    searchInput.dataset.bound = "1";
  }

  if (searchClear && searchInput && !searchClear.dataset.bound) {
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
      if (searchMeta) searchMeta.textContent = "";
      searchClear.classList.add("hidden");
      applyFilter();
    });
    searchClear.dataset.bound = "1";
  }
}

// Fungsi untuk menghitung statistik prestasi
function calculatePrestasiStats(prestasiList) {
  const currentYear = new Date().getFullYear();

  // Inisialisasi statistik
  const stats = {
    prestasiNasional: 0,
    prestasiRegional: 0,
    prestasiKota: 0,
    prestasiTahunIni: 0,
    tahunBerprestasi: 0,
    juaraEmas: 0,
    juaraPerak: 0,
    juaraPerunggu: 0,
    penghargaanLain: 0,
    tahunUnik: new Set()
  };

  prestasiList.forEach(item => {
    const tahun = item.tahun || new Date(item.tanggal).getFullYear();
    const tingkat = (item.tingkat || "").toLowerCase();
    const juara = (item.juara || "").toLowerCase();

    // Hitung prestasi berdasarkan tingkat
    if (tingkat.includes("nasional") || tingkat.includes("national")) {
      stats.prestasiNasional++;
    } else if (tingkat.includes("regional") || tingkat.includes("provinsi") || tingkat.includes("provincial")) {
      stats.prestasiRegional++;
    } else if (tingkat.includes("kota") || tingkat.includes("kabupaten") || tingkat.includes("local")) {
      stats.prestasiKota++;
    } else {
      // Default ke regional jika tidak jelas
      stats.prestasiRegional++;
    }

    // Hitung prestasi tahun ini
    if (tahun === currentYear) {
      stats.prestasiTahunIni++;
    }

    // Kumpulkan tahun unik
    stats.tahunUnik.add(tahun);

    // Hitung jenis juara
    const isJuara1 = /^juara\s*1\b|^1(?!\d)\b|^pertama\b|^emas\b|^i\b/i.test(juara);
    const isJuara2 = /^juara\s*2\b|^2(?!\d)\b|^kedua\b|^perak\b|^ii\b/i.test(juara);
    const isJuara3 = /^juara\s*3\b|^3(?!\d)\b|^ketiga\b|^perunggu\b|^iii\b/i.test(juara);
    const isHarapan1 = /^harapan\s*1\b|^1(?!\d).*harapan/i.test(juara);
    const isFavorit1 = /^favorit\s*1\b|^1(?!\d).*favorit/i.test(juara);
    const isKhusus1 = /^khusus\s*1\b|^1(?!\d).*khusus/i.test(juara);
    const isJuara11Plus = /juara\s*1[1-9]|juara\s*[4-9]|juara\s*[1-9][0-9]/i.test(juara);

    if (isJuara1 && !isHarapan1 && !isFavorit1 && !isKhusus1 && !isJuara11Plus) {
      stats.juaraEmas++;
    } else if (isJuara2 && !isJuara11Plus) {
      stats.juaraPerak++;
    } else if (isJuara3 && !isJuara11Plus) {
      stats.juaraPerunggu++;
    } else {
      stats.penghargaanLain++;
    }
  });

  // Hitung tahun berprestasi
  stats.tahunBerprestasi = stats.tahunUnik.size;

  return stats;
}

// Fungsi untuk memperbarui statistik di halaman
function updatePrestasiStats(stats) {
  // Update statistik box
  const statNasional = document.getElementById('stat-nasional');
  const statRegional = document.getElementById('stat-regional');
  const statKota = document.getElementById('stat-kota');
  const statTahunBerprestasi = document.getElementById('stat-tahun-berprestasi');

  if (statNasional) statNasional.textContent = stats.prestasiNasional;
  if (statRegional) statRegional.textContent = stats.prestasiRegional;
  if (statKota) statKota.textContent = stats.prestasiKota;
  if (statTahunBerprestasi) statTahunBerprestasi.textContent = stats.tahunBerprestasi;

  // Update grafik
  updatePrestasiChart(stats);
}

// Fungsi untuk membuat chart sederhana
function updatePrestasiChart(stats) {
  const chartContainer = document.querySelector('.rounded-3xl.bg-white.border.border-slate-200.p-6.shadow-soft .h-64');

  if (!chartContainer) return;

  // Hapus placeholder
  chartContainer.innerHTML = '';

  // Hitung total untuk normalisasi grafik
  const totalSemua = stats.juaraEmas + stats.juaraPerak + stats.juaraPerunggu + stats.penghargaanLain;

  // Buat chart dengan 4 kolom
  const chartHTML = `
    <div class="h-full flex flex-col justify-center">
      <div class="flex items-end justify-center gap-4 h-48">
        <!-- Emas -->
        <div class="flex flex-col items-center">
          <div class="w-10 bg-[#FFD700] rounded-t-lg" style="height: ${(stats.juaraEmas / Math.max(totalSemua, 1)) * 180}px"></div>
          <p class="text-xs mt-2">Emas</p>
          <p class="text-sm font-bold">${stats.juaraEmas}</p>
        </div>
        
        <!-- Perak -->
        <div class="flex flex-col items-center">
          <div class="w-10 bg-[#C0C0C0] rounded-t-lg" style="height: ${(stats.juaraPerak / Math.max(totalSemua, 1)) * 180}px"></div>
          <p class="text-xs mt-2">Perak</p>
          <p class="text-sm font-bold">${stats.juaraPerak}</p>
        </div>
        
        <!-- Perunggu -->
        <div class="flex flex-col items-center">
          <div class="w-10 bg-[#CD7F32] rounded-t-lg" style="height: ${(stats.juaraPerunggu / Math.max(totalSemua, 1)) * 180}px"></div>
          <p class="text-xs mt-2">Perunggu</p>
          <p class="text-sm font-bold">${stats.juaraPerunggu}</p>
        </div>
        
        <!-- Penghargaan Lain -->
        <div class="flex flex-col items-center">
          <div class="w-10 bg-[#8ca6bd] rounded-t-lg" style="height: ${(stats.penghargaanLain / Math.max(totalSemua, 1)) * 180}px"></div>
          <p class="text-xs mt-2">Lainnya</p>
          <p class="text-sm font-bold">${stats.penghargaanLain}</p>
        </div>
      </div>
      <p class="text-center text-sm text-slate-500 mt-4">Distribusi Prestasi</p>
      <div class="flex flex-wrap justify-center gap-4 mt-4 text-xs text-slate-600">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-[#FFD700] rounded"></div>
          <span>Juara 1 (${stats.juaraEmas})</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-[#C0C0C0] rounded"></div>
          <span>Juara 2 (${stats.juaraPerak})</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-[#CD7F32] rounded"></div>
          <span>Juara 3 (${stats.juaraPerunggu})</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-[#8ca6bd] rounded"></div>
          <span>Lainnya (${stats.penghargaanLain})</span>
        </div>
      </div>
    </div>
  `;

  chartContainer.innerHTML = chartHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar("prestasi");
  initFooterYear();
  initFloatingButtons();
  initForumWidget();
  renderPrestasiPage();
});