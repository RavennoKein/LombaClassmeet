/* =========================================================
   SUPER STRONG FRONTEND FILTER (CDN: he + leo-profanity)
   ========================================================= */

const INDO_EXTRA_BANNED = [
  "bodoh",
  "goblok",
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
  "kurangajar",
  "bacot",
  "kontol",
  "memek",
  "ngentot",
  "jancuk",
  "asu",
  "tai",
];

// init leo-profanity dictionary (sekali)
let _leoReady = false;
async function initLeoProfanityOnce() {
  if (_leoReady || typeof LeoProfanity === "undefined") return;

  try {
    const res = await fetch(
      "https://unpkg.com/leo-profanity@1.8.0/dictionary/default.json",
      { cache: "force-cache" }
    );
    const words = await res.json();

    LeoProfanity.clearList();
    LeoProfanity.add(words);
    LeoProfanity.add(INDO_EXTRA_BANNED);

    _leoReady = true;
  } catch (e) {
    console.warn("leo-profanity init failed, fallback to regex only", e);
  }
}

function normalizeForFilterStrong(input) {
  let s = (input || "").toString();

  // decode HTML entities: "b&#97;ngsat" -> "bangsat"
  try {
    if (window.he && typeof he.decode === "function") s = he.decode(s);
  } catch (_) {}

  // buang zero-width / directional marks
  s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "");

  // NFKC
  try {
    s = s.normalize("NFKC");
  } catch (_) {}
  s = s.toLowerCase();

  // buang diakritik
  try {
    s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  } catch (_) {}

  // leetspeak & simbol umum
  const leetMap = {
    4: "a",
    "@": "a",
    1: "i",
    "!": "i",
    "|": "i",
    "¡": "i",
    0: "o",
    3: "e",
    "€": "e",
    5: "s",
    $: "s",
    7: "t",
    "+": "t",
  };

  // ✅ FIX: hapus spasi di regex char class
  s = s.replace(/[4@1!\|03€5\$7\+¡]/g, (ch) => leetMap[ch] || ch);

  // homoglyph Cyrillic
  const cyrMap = {
    а: "a",
    е: "e",
    о: "o",
    р: "p",
    с: "c",
    х: "x",
    у: "y",
    і: "i",
    ј: "j",
    ӏ: "l",
    ь: "b",
    Ь: "b",
  };
  s = s.replace(/[аерсхуіјӏьЬ]/g, (ch) => cyrMap[ch] || ch);

  const raw = s;
  const compact = s.replace(/[^a-z0-9]+/g, "");
  const collapsed = compact.replace(/([a-z])\1{2,}/g, "$1$1");

  return { raw, compact, collapsed };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSeparatedStretchyPattern(word) {
  const sep = "[^a-z0-9]{0,2}";
  return word
    .split("")
    .map((ch) => `${escapeRegex(ch)}+`)
    .join(sep);
}

const FORUM_BANNED_BASE2 = [...new Set([...INDO_EXTRA_BANNED])];

const FORUM_BANNED_REGEX_RAW2 = (() => {
  const parts = FORUM_BANNED_BASE2.map(buildSeparatedStretchyPattern);
  const rawPattern = `(?:^|[^a-z0-9])(?:${parts.join("|")})(?:$|[^a-z0-9])`;
  return new RegExp(rawPattern, "i");
})();

const FORUM_BANNED_REGEX_COMPACT2 = (() => {
  const parts = FORUM_BANNED_BASE2.map((w) =>
    w
      .split("")
      .map((ch) => `${escapeRegex(ch)}+`)
      .join("")
  );
  return new RegExp(parts.join("|"), "i");
})();

async function forumContainsBannedWordStrong(text) {
  await initLeoProfanityOnce();

  const { raw, compact, collapsed } = normalizeForFilterStrong(text);

  if (FORUM_BANNED_REGEX_RAW2.test(` ${raw} `)) return true;
  if (FORUM_BANNED_REGEX_COMPACT2.test(compact)) return true;
  if (FORUM_BANNED_REGEX_COMPACT2.test(collapsed)) return true;

  if (_leoReady) {
    try {
      if (LeoProfanity.check(raw)) return true;
      if (LeoProfanity.check(compact)) return true;
      if (LeoProfanity.check(collapsed)) return true;
    } catch (_) {
      // kalau library berubah / gagal, tetap aman karena regex sudah jalan
    }
  }

  return false;
}

/* =========================================================
   D. Anti-spam ringan (client-side)
   ========================================================= */

const FORUM_MIN_LEN = 3;
const FORUM_MAX_LEN = 220;
const FORUM_COOLDOWN_MS = 15_000;
const FORUM_DUP_WINDOW_MS = 60_000;
const LS_LAST_POST_AT = "forum_last_post_at";
const LS_LAST_POST_HASH = "forum_last_post_hash";
const LS_LAST_POST_HASH_AT = "forum_last_post_hash_at";

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function canPostNow(normalizedCompact) {
  const now = Date.now();

  const lastAt = Number(localStorage.getItem(LS_LAST_POST_AT) || 0);
  if (now - lastAt < FORUM_COOLDOWN_MS)
    return { ok: false, reason: "cooldown" };

  const lastHash = localStorage.getItem(LS_LAST_POST_HASH) || "";
  const lastHashAt = Number(localStorage.getItem(LS_LAST_POST_HASH_AT) || 0);

  const h = simpleHash(normalizedCompact);
  if (h === lastHash && now - lastHashAt < FORUM_DUP_WINDOW_MS) {
    return { ok: false, reason: "duplicate" };
  }

  return { ok: true, hash: h };
}

function markPosted(hash) {
  const now = Date.now();
  localStorage.setItem(LS_LAST_POST_AT, String(now));
  localStorage.setItem(LS_LAST_POST_HASH, hash);
  localStorage.setItem(LS_LAST_POST_HASH_AT, String(now));
}

/* =========================================================
   E. Supabase CRUD + Render
   ========================================================= */

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
    teks.className =
      "text-slate-800 text-[11px] whitespace-pre-wrap break-words";
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
    const teks = (input.value || "").trim();
    if (!teks) return;

    if (teks.length < FORUM_MIN_LEN) {
      warning.textContent = "Teks terlalu pendek.";
      warning.classList.remove("hidden");
      return;
    }
    if (teks.length > FORUM_MAX_LEN) {
      warning.textContent = `Maksimal ${FORUM_MAX_LEN} karakter.`;
      warning.classList.remove("hidden");
      return;
    }

    if (await forumContainsBannedWordStrong(teks)) {
      warning.textContent =
        "Teks mengandung kata yang tidak pantas. Mohon gunakan bahasa yang lebih sopan.";
      warning.classList.remove("hidden");
      return;
    }

    // ✅ FIX: pakai normalisasi strong yang sama
    const { compact } = normalizeForFilterStrong(teks);
    const check = canPostNow(compact);
    if (!check.ok) {
      warning.textContent =
        check.reason === "cooldown"
          ? "Tunggu sebentar sebelum mengirim lagi."
          : "Pesan yang sama baru saja dikirim. Coba ubah isinya.";
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

    markPosted(check.hash);
    input.value = "";
    await renderForumWidget();
  });

  input.addEventListener("input", () => {
    warning.classList.add("hidden");
  });
}

// pastikan ini dipanggil setelah layout widget ter-render
// initForumWidget();
