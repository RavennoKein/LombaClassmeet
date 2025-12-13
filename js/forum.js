// js/forum.js
// Forum anonim global sebagai widget mengambang di semua halaman

/**
 * 1) Normalisasi teks untuk deteksi kata kasar:
 *    - lower-case
 *    - ubah leetspeak umum (4->a, 1->i, 0->o, 3->e, 5->s, 7->t, @->a, $->s)
 *    - hapus diakritik (kalau ada)
 *    - simpan versi "compact" tanpa spasi/simbol untuk mendeteksi "b a n g s a t"
 */
function normalizeForFilter(input) {
  let s = (input || "").toString().toLowerCase();

  // leetspeak & simbol umum
  const map = {
    4: "a",
    "@": "a",
    1: "i",
    "!": "i",
    "|": "i",
    0: "o",
    3: "e",
    5: "s",
    $: "s",
    7: "t",
  };

  s = s.replace(/[4@1!\|03\$57]/g, (ch) => map[ch] || ch);

  // hilangkan diakritik (aman untuk id-ID)
  try {
    s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  } catch (_) {}

  // versi asli (spasi tetap) + compact (hapus non-huruf/angka)
  const compact = s.replace(/[^a-z0-9]+/g, "");
  return { raw: s, compact };
}

/**
 * 2) Buat regex yang tahan "huruf dipanjangin":
 *    contoh: goblok -> goooobloook
 */
function stretchy(word) {
  // goblok -> g+o+b+l+o+k+
  return word
    .split("")
    .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "+")
    .join("");
}

/**
 * 3) Daftar kata/akar kata kasar & tidak pantas (Indonesia).
 *    Ini sengaja pakai "akar" agar lebih tahan variasi, tapi tetap hati-hati.
 *
 *    Kamu boleh tambah lagi sesuai kebutuhan sekolah.
 */
const FORUM_BANNED_BASE = [
  // hinaan umum
  "bodoh",
  "bdh",
  "Bdh",
  "BDh",
  "bDH",
  "bdH",
  "bodoh",
  "goblok",
  "goooblk",
  "goblooook",
  "g0bl0k",
  "tolol",
  "idiot",
  "dongo",
  "bego",
  "bangsat",
  "anjing",
  "bajingan",
  "sialan",
  "brengsek",
  "kampret",
  "keparat",
  "sialan",
  "kurangajar",
  "kurangajar", // (double aman)
  "bacot",
  "bawelbanget", // opsional

  // kata umpatan yang sering muncul
  "kontol",
  "memek",
  "ngentot",
  "anjrit",
  "jancuk",
  "asu",
  "tai",
  "tolol",
  "gila", // catatan: bisa false positive, kalau keberatan hapus
];

/**
 * 4) Kompilasi regex:
 *    - deteksi di raw (pakai boundary sederhana)
 *    - deteksi di compact (untuk yang diselingi spasi/titik/simbol)
 *
 *    NB: kita tidak pakai word boundary ketat karena bahasa Indo sering gabung kata,
 *    tapi tetap kasih pembatas "non-letter" di raw agar lebih aman.
 */
const FORUM_BANNED_REGEX = (() => {
  const parts = FORUM_BANNED_BASE.map((w) => stretchy(w));
  // raw: cari pola dengan pembatas non-huruf di kiri/kanan (atau awal/akhir)
  const rawPattern = `(?:^|[^a-z0-9])(?:${parts.join("|")})(?:$|[^a-z0-9])`;
  return new RegExp(rawPattern, "i");
})();

const FORUM_BANNED_COMPACT_REGEX = (() => {
  const parts = FORUM_BANNED_BASE.map((w) => stretchy(w));
  // compact: karena sudah hanya [a-z0-9], cukup cari substring
  const compactPattern = `(?:${parts.join("|")})`;
  return new RegExp(compactPattern, "i");
})();

/**
 * 5) Fungsi utama deteksi kata kasar
 */
function forumContainsBannedWord(text) {
  const { raw, compact } = normalizeForFilter(text);

  // cek raw (lebih aman untuk boundary)
  if (FORUM_BANNED_REGEX.test(` ${raw} `)) return true;

  // cek compact (untuk "b a n g s a t" / "b@ngs@t" / dll)
  if (FORUM_BANNED_COMPACT_REGEX.test(compact)) return true;

  return false;
}

async function fetchForumPosts(limit = 20) {
  const { data, error } = await supabaseClient
    .from("forum_posts")
    .select("*")
    .eq("is_flagged", false)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Forum error:", error);
    return [];
  }
  return data || [];
}

async function renderForumWidget() {
  const list = document.getElementById("forum-list");
  if (!list) return;

  list.innerHTML = '<p class="text-[11px] text-slate-500">Memuat forum...</p>';

  const posts = await fetchForumPosts();

  const statForumEl = document.getElementById("stat-forum-count");
  if (statForumEl) statForumEl.textContent = posts.length;

  if (!posts.length) {
    list.innerHTML =
      '<p class="text-[11px] text-slate-500">Belum ada kiriman. Jadilah yang pertama menyampaikan saran.</p>';
    return;
  }

  list.innerHTML = "";
  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className =
      "border border-slate-200 rounded-lg bg-slate-50 px-2 py-1.5";

    const teks = document.createElement("p");
    teks.className = "text-slate-800 text-[11px]";
    teks.textContent = post.content;

    const meta = document.createElement("p");
    meta.className = "mt-1 text-[10px] text-slate-500";
    const waktu = new Date(post.created_at).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });
    meta.textContent = `Anonim • ${waktu}`;

    card.append(teks, meta);
    list.appendChild(card);
  });
}

function toggleForumPanel(forceOpen) {
  const panel = document.getElementById("forum-panel");
  if (!panel) return;
  const isHidden = panel.classList.contains("hidden");
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : isHidden;

  if (shouldOpen) {
    panel.classList.remove("hidden");
    renderForumWidget();
  } else {
    panel.classList.add("hidden");
  }
}

function initForumWidget() {
  const form = document.getElementById("forum-form");
  const input = document.getElementById("forum-input");
  const warning = document.getElementById("forum-warning");
  const closeBtn = document.getElementById("forum-panel-close");

  if (closeBtn)
    closeBtn.addEventListener("click", () => toggleForumPanel(false));
  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const teks = input.value.trim();
    if (!teks) return;

    if (forumContainsBannedWord(teks)) {
      warning.textContent =
        "Teks mengandung kata yang tidak pantas. Mohon gunakan bahasa yang lebih sopan.";
      warning.classList.remove("hidden");
      return;
    }
    warning.classList.add("hidden");

    const { error } = await supabaseClient
      .from("forum_posts")
      .insert({ content: teks });

    if (error) {
      console.error("Insert forum error:", error);
      warning.textContent = "Gagal mengirim, coba lagi nanti.";
      warning.classList.remove("hidden");
      return;
    }

    input.value = "";
    await renderForumWidget();
  });

  input.addEventListener("input", () => {
    warning.classList.add("hidden");
  });
}
