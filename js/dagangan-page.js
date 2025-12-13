// js/dagangan-page.js

function rupiah(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeContactLink(kontakRaw) {
  const k = (kontakRaw || "").trim();
  if (!k) return "#";
  if (/^https?:\/\//i.test(k)) return k;
  if (k.startsWith("@")) return `https://instagram.com/${k.slice(1)}`;

  const digits = k.replace(/\D/g, "");
  if (digits.length >= 9) {
    let wa = digits;
    if (wa.startsWith("0")) wa = "62" + wa.slice(1);
    return `https://wa.me/${wa}`;
  }
  return "#";
}

function badge(text) {
  const t = escapeHtml(text || "");
  return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100">${t}</span>`;
}

function renderCard(p) {
  const harga = p.harga
    ? `<div class="text-sm font-extrabold text-primary-700">${escapeHtml(
        rupiah(p.harga)
      )}</div>`
    : "";

  const foto = p.foto_url
    ? `
      <div class="relative h-56 overflow-hidden">
        <img src="${escapeHtml(p.foto_url)}" alt="${escapeHtml(p.nama_produk)}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div class="absolute inset-0 card-overlay"></div>
        <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-lg font-extrabold text-white truncate">${escapeHtml(
              p.nama_produk
            )}</h3>
            <p class="text-[13px] text-white/90 truncate">${escapeHtml(
              p.deskripsi
            )}</p>
          </div>
          <div class="shrink-0 text-right">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-accent-600 text-dark-900">
              ${p.harga ? escapeHtml(rupiah(p.harga)) : "Harga fleksibel"}
            </span>
          </div>
        </div>
      </div>
    `
    : `
      <div class="relative h-56 bg-slate-100 border-b border-slate-100 flex items-center justify-center">
        <div class="text-slate-500 text-sm font-semibold">Tanpa foto</div>
      </div>
      <div class="p-5 pb-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-lg font-extrabold text-dark-900 truncate">${escapeHtml(
              p.nama_produk
            )}</h3>
            <p class="mt-1 text-sm text-slate-600 line-clamp-2">${escapeHtml(
              p.deskripsi
            )}</p>
          </div>
          <div class="shrink-0 text-right">${harga}</div>
        </div>
      </div>
    `;

  const infoPOText =
    p.tipe === "preorder" && p.deadline_po
      ? `Deadline PO: <span class="font-extrabold text-dark-900">${escapeHtml(
          p.deadline_po
        )}</span>`
      : "";

  // spacer supaya tombol sejajar
  const poSpacer = `<div class="text-xs text-slate-600 min-h-[20px]">${infoPOText}</div>`;

  return `
    <div class="group bg-white rounded-3xl shadow-soft border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      ${foto}

      <div class="p-5 flex-1 flex flex-col gap-3">
        ${
          p.foto_url
            ? `
          <div class="hidden">
            <!-- sudah tampil di overlay foto -->
          </div>
        `
            : ``
        }

        <div class="flex flex-wrap gap-2">
          ${badge(p.tipe)}
          ${badge(p.kategori)}
        </div>

        <div class="text-sm text-dark-800">
          <span class="font-extrabold">Penjual:</span>
          <span class="font-bold text-dark-900">${escapeHtml(
            p.nama_penjual
          )}</span>
          <span class="text-slate-400">·</span>
          <span class="font-bold text-dark-900">${escapeHtml(
            p.kelas_penjual
          )}</span>
        </div>

        ${poSpacer}

        <div class="mt-auto pt-2">
          <a href="${makeContactLink(p.kontak)}" target="_blank" rel="noopener"
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-lg hover:bg-primary-700 active:scale-[0.98] transition">
            Hubungi Penjual
          </a>
        </div>
      </div>
    </div>
  `;
}

async function loadDagangan() {
  const listEl = document.getElementById("daganganList");
  const emptyEl = document.getElementById("daganganEmpty");
  const loadingEl = document.getElementById("daganganLoading");

  const tipe = document.getElementById("filterTipe").value;
  const kategori = document.getElementById("filterKategori").value;
  const search = document.getElementById("searchInput").value;

  loadingEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");
  listEl.innerHTML = "";

  try {
    const posts = await DaganganAPI.fetchApproved({ search, tipe, kategori });

    loadingEl.classList.add("hidden");
    if (!posts.length) {
      emptyEl.classList.remove("hidden");
      return;
    }

    listEl.innerHTML = posts.map(renderCard).join("");
  } catch (err) {
    console.error(err);
    loadingEl.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    emptyEl.innerHTML = `
      <div class="rounded-3xl bg-red-50 border border-red-200 p-5 text-red-700 shadow-soft">
        Gagal memuat dagangan. Cek konfigurasi Supabase atau koneksi.
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("filterTipe")
    ?.addEventListener("change", loadDagangan);
  document
    .getElementById("filterKategori")
    ?.addEventListener("change", loadDagangan);
  document.getElementById("searchInput")?.addEventListener("input", () => {
    clearTimeout(window.__daganganSearchT);
    window.__daganganSearchT = setTimeout(loadDagangan, 250);
  });

  loadDagangan();
});
