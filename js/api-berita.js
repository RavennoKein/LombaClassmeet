// js/api-berita.js
// Berita: list, populer, detail, dan increment views

async function fetchBeritaList(limit = 50) {
  const { data, error, count } = await supabaseClient
    .from("berita")
    .select("*", { count: "exact" })
    .order("tanggal", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Berita error:", error);
    return { list: [], count: 0 };
  }
  return { list: data || [], count: count ?? (data?.length || 0) };
}

async function fetchBeritaById(id) {
  const { data, error } = await supabaseClient
    .from("berita")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Berita detail error:", error);
    return null;
  }
  return data || null;
}

async function fetchBeritaPopuler(limit = 5) {
  const { data, error } = await supabaseClient
    .from("berita")
    .select("*")
    .order("views", { ascending: false })
    .order("tanggal", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Berita populer error:", error);
    return [];
  }
  return data || [];
}

async function incrementBeritaViews(id) {
  try {
    await supabaseClient.rpc("increment_berita_views", { p_id: id });
  } catch (err) {
    console.error("Gagal increment views:", err);
  }
}
