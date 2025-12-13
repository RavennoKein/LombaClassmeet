// js/api-dagangan.js

const DaganganAPI = {
  async fetchApproved({ search = "", tipe = "all", kategori = "all" } = {}) {
    let q = supabaseClient
      .from("dagangan_posts")
      .select(
        "id, created_at, nama_penjual, kelas_penjual, nama_produk, deskripsi, kategori, tipe, kontak, harga, foto_url, deadline_po, status"
      )
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (tipe !== "all") q = q.eq("tipe", tipe);
    if (kategori !== "all") q = q.eq("kategori", kategori);

    const { data, error } = await q;
    if (error) throw error;

    const s = (search || "").trim().toLowerCase();
    if (!s) return data || [];

    return (data || []).filter((p) => {
      const hay = [
        p.nama_produk,
        p.deskripsi,
        p.nama_penjual,
        p.kelas_penjual,
        p.kategori,
        p.tipe,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  },

  async uploadFoto(file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    const path = `uploads/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    const { error: uploadError } = await supabaseClient.storage
      .from(DAGANGAN_BUCKET)
      .upload(path, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw uploadError;

    const { data } = supabaseClient.storage
      .from(DAGANGAN_BUCKET)
      .getPublicUrl(path);
    return data?.publicUrl || "";
  },

  async createPost(payload) {
    // jangan return row, biar aman dari policy SELECT
    const { error } = await supabaseClient
      .from("dagangan_posts")
      .insert(payload, { returning: "minimal" });

    if (error) throw error;
    return true;
  },
};
