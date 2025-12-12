// js/api-kalender.js
// Mengambil data kalender akademik dari Supabase

async function fetchKalenderTahunList() {
  const { data, error } = await supabaseClient
    .from("kalender_akademik")
    .select("tahun")
    .order("tahun", { ascending: false });

  if (error) {
    console.error("Kalender tahun error:", error);
    return [];
  }
  // unikkan tahun
  const seen = new Set();
  const result = [];
  (data || []).forEach((row) => {
    if (row.tahun && !seen.has(row.tahun)) {
      seen.add(row.tahun);
      result.push(row.tahun);
    }
  });
  return result;
}

async function fetchKalenderByTahun(tahun) {
  const query = supabaseClient
    .from("kalender_akademik")
    .select("*")
    .order("tanggal_mulai", { ascending: true });

  const { data, error } = tahun
    ? await query.eq("tahun", tahun)
    : await query;

  if (error) {
    console.error("Kalender error:", error);
    return [];
  }
  return data || [];
}
