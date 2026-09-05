import { requireAdmin } from "@/lib/admin-auth";
import { jsonResponse } from "@/lib/json";
import { PUBLIC_PRODUCT_SELECT, toProduct } from "@/lib/products";
import { productAdminSchema } from "@/lib/schemas";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const { data, error } = await supabase
    .from("produtos")
    .select(PUBLIC_PRODUCT_SELECT)
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Failed to list admin products", error);
    return jsonResponse({ error: "Não foi possível listar produtos" }, { status: 500 });
  }

  return jsonResponse({ products: (data ?? []).map((row) => toProduct(row)) });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const parsed = productAdminSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => {
      const path = i.path.length ? i.path.join(".") : "formulario";
      return `${path}: ${i.message}`;
    });
    const message = issues.length ? `Dados inválidos — ${issues.join("; ")}` : "Dados inválidos do produto";
    return jsonResponse({ error: message }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const { id, ...payload } = parsed.data;
  const query = id
    ? supabase.from("produtos").update(payload).eq("id", id)
    : supabase.from("produtos").insert(payload);

  const { data, error } = await query.select(PUBLIC_PRODUCT_SELECT).single();

  if (error || !data) {
    console.error("Failed to upsert product", error);
    const detail = error?.message ? (error.code ? `${error.message} [${error.code}]` : error.message) : "erro desconhecido";
    return jsonResponse({ error: `Não foi possível salvar o produto: ${detail}` }, { status: 500 });
  }

  return jsonResponse({ product: toProduct(data) });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonResponse({ error: "Supabase não configurado" }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonResponse({ error: "Produto inválido" }, { status: 400 });

  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete product", error);
    const detail = error.message ? (error.code ? `${error.message} [${error.code}]` : error.message) : "erro desconhecido";
    return jsonResponse({ error: `Não foi possível remover o produto: ${detail}` }, { status: 500 });
  }

  return jsonResponse({ ok: true });
}
