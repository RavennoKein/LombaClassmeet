const FORUM_BANNED_WORDS = [
  "bodoh",
  "goblok",
  "anjing",
  "bangsat"
];

function forumContainsBannedWord(text) {
  const lower = text.toLowerCase();
  return FORUM_BANNED_WORDS.some((w) => lower.includes(w));
}

async function fetchForumPosts(limit = 20) {
  const { data, error } = await supabaseClient
    .from("forum_posts")
    .select("*")
    .eq("is_flagged", false)
    .order("created_at", { ascending: false })
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

  list.innerHTML =
    '<p class="text-[11px] text-slate-500">Memuat forum...</p>';

  const posts = await fetchForumPosts();

  const statForumEl = document.getElementById("stat-forum-count");
  if (statForumEl) {
    statForumEl.textContent = posts.length;
  }

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
      timeStyle: "short"
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

  if (closeBtn) {
    closeBtn.addEventListener("click", () => toggleForumPanel(false));
  }

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
