const SUPABASE_URL = "https://jtmgruxjzfibmbwewzcz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0bWdydXhqemZpYm1id2V3emN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDE5MTEsImV4cCI6MjA4MTAxNzkxMX0.-kV_HtncRQd4eafMeQ6HGN-8oVc3zcYxpP_2ajCQGZc";

const SUPABASE_BUCKET = "website-sekolah";

const DAGANGAN_BUCKET = "dagangan";

const DIFY_CHATBOT_URL = "https://udify.app/chatbot/vZOqc4H987xMYq3o";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getImageUrl(path) {
  if (!path) return "";
  const { data } = supabaseClient.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(path);
  return data?.publicUrl || "";
}

function formatDateIndo(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
