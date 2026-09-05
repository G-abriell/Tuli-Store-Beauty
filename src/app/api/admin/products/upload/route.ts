import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { uploadPhotoSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const parsed = uploadPhotoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonResponse({ error: "Arquivo inválido" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const cleanBase64 = parsed.data.base64.includes(",") ? parsed.data.base64.split(",").pop() ?? "" : parsed.data.base64;
  const bytes = Buffer.from(cleanBase64, "base64");
  if (bytes.byteLength <= 0 || bytes.byteLength > 2_500_000) {
    return jsonResponse({ error: "Arquivo inválido" }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_PRODUCT_BUCKET || "produtos";
  const extension = EXTENSIONS[parsed.data.contentType];
  const path = `${parsed.data.folder}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: parsed.data.contentType,
    upsert: false
  });

  if (error) {
    console.error("Failed to upload product photo", error);
    return jsonResponse({ error: "Não foi possível enviar a foto" }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return jsonResponse({ url: data.publicUrl });
}
