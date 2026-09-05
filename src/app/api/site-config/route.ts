import { DEFAULT_SITE_CONFIG } from "@/lib/demo-data";
import { jsonResponse } from "@/lib/json";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ config: DEFAULT_SITE_CONFIG, demo: true });

  const { data, error } = await supabase
    .from("site_config")
    .select("banners")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.error("Failed to load site config", error);
    return jsonResponse({ config: DEFAULT_SITE_CONFIG });
  }

  return jsonResponse({ config: data?.banners ? { banners: data.banners } : DEFAULT_SITE_CONFIG });
}
