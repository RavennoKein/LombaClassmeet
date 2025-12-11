async function fetchPrestasiList(limit = 50) {
  const { data, error, count } = await supabaseClient
    .from("prestasi")
    .select("*", { count: "exact" })
    .order("tanggal", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Prestasi error:", error);
    return { list: [], count: 0 };
  }
  return { list: data || [], count: count ?? (data?.length || 0) };
}
