import { setAdminCookies } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { adminLoginSchema } from "@/lib/schemas";
import { getSupabaseAnonServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = adminLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse({ error: "Credenciais inválidas" }, { status: 400 });
  }

  const supabase = getSupabaseAnonServer();
  if (!supabase) {
    return jsonResponse({ error: "Supabase Auth não configurado" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  const allowedEmail = process.env.ADMIN_ALLOWED_EMAIL?.trim().toLowerCase();
  const signedEmail = data.user?.email?.toLowerCase();

  if (error || !data.session || (allowedEmail && signedEmail !== allowedEmail)) {
    return jsonResponse({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const response = jsonResponse({
    user: {
      id: data.user?.id,
      email: data.user?.email
    }
  });

  setAdminCookies(response, data.session.access_token, data.session.refresh_token, data.session.expires_in ?? 3600);
  return response;
}
