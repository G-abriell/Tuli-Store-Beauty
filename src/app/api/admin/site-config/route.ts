import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_SITE_CONFIG } from "@/lib/demo-data";
import { jsonResponse } from "@/lib/json";
import { siteConfigSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ config: DEFAULT_SITE_CONFIG, demo: true });

  const { data, error } = await supabase
    .from("site_config")
    .select("banners")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    console.error("Failed to load admin site config", error);
    return jsonResponse({ error: "Não foi possível carregar banners" }, { status: 500 });
  }

  return jsonResponse({ config: data?.banners ? { banners: data.banners } : DEFAULT_SITE_CONFIG });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const parsed = siteConfigSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse({ error: "Configuração inválida" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const { data, error } = await supabase
    .from("site_config")
    .upsert({ id: "default", banners: parsed.data.banners }, { onConflict: "id" })
    .select("banners")
    .single();

  if (error || !data) {
    console.error("Failed to save site config", error);
    return jsonResponse({ error: "Não foi possível salvar banners" }, { status: 500 });
  }

  return jsonResponse({ config: { banners: data.banners } });
}
