// js/dagangan-form.js

function normalizeTipe(tipe) {
  if (tipe === "preorder") return "preorder";
  if (tipe === "etalase") return "etalase";
  return "hari_ini";
}

async function handleSubmitDagangan(e) {
  e.preventDefault();

  const form = e.target;
  const btn = document.getElementById("btnSubmitDagangan");
  const msg = document.getElementById("formMessage");

  msg.className = "hidden";
  btn.disabled = true;
  btn.classList.add("opacity-70", "cursor-not-allowed");

  try {
    const fd = new FormData(form);
    const tipe = normalizeTipe(fd.get("tipe"));
    const file = document.getElementById("foto")?.files?.[0] ?? null;

    let fotoUrl = null;
    if (file) fotoUrl = await DaganganAPI.uploadFoto(file);

    const payload = {
      nama_penjual: (fd.get("nama_penjual") || "").trim(),
      kelas_penjual: (fd.get("kelas_penjual") || "").trim(),
      nama_produk: (fd.get("nama_produk") || "").trim(),
      deskripsi: (fd.get("deskripsi") || "").trim(),
      kategori: (fd.get("kategori") || "").trim(),
      tipe,
      kontak: (fd.get("kontak") || "").trim(),
      harga: fd.get("harga") ? parseInt(fd.get("harga"), 10) : null,
      foto_url: fotoUrl || null,
      deadline_po: tipe === "preorder" ? fd.get("deadline_po") || null : null,
      status: "pending",
    };

    // validasi ringan
    const required = [
      "nama_penjual",
      "kelas_penjual",
      "nama_produk",
      "deskripsi",
      "kategori",
      "tipe",
      "kontak",
    ];
    for (const k of required)
      if (!payload[k])
        throw new Error("Lengkapi semua field yang wajib diisi.");
    if (tipe === "preorder" && !payload.deadline_po)
      throw new Error("Deadline PO wajib diisi untuk tipe Pre-Order.");

    await DaganganAPI.createPost(payload);

    msg.className =
      "block rounded-3xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-800 shadow-soft";
    msg.innerHTML = `
      <p class="font-extrabold">Berhasil dikirim!</p>
      <p class="mt-1 text-sm">Silakan <span class="font-bold">hubungi admin</span> untuk verifikasi (ACC) agar dagangan tampil.</p>
    `;
    form.reset();
  } catch (err) {
    console.error(err);
    msg.className =
      "block rounded-3xl bg-red-50 border border-red-200 p-5 text-red-800 shadow-soft";
    msg.textContent = err?.message || "Gagal mengirim dagangan. Coba lagi.";
  } finally {
    btn.disabled = false;
    btn.classList.remove("opacity-70", "cursor-not-allowed");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("formDagangan")
    ?.addEventListener("submit", handleSubmitDagangan);

  const tipeEl = document.getElementById("tipe");
  const poWrap = document.getElementById("wrapDeadlinePO");
  if (tipeEl && poWrap) {
    const sync = () =>
      poWrap.classList.toggle("hidden", tipeEl.value !== "preorder");
    tipeEl.addEventListener("change", sync);
    sync();
  }
});
