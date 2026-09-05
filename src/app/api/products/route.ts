import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { jsonResponse } from "@/lib/json";
import { PUBLIC_PRODUCT_SELECT, publicProduct, toProduct } from "@/lib/products";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return jsonResponse({ products: DEMO_PRODUCTS.map(publicProduct), demo: true });
  }

  const { data, error } = await supabase
    .from("produtos")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("ativo", true)
    .order("categoria", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Failed to list products", error);
    return jsonResponse({ error: "Não foi possível carregar os produtos" }, { status: 500 });
  }

  return jsonResponse({ products: (data ?? []).map((row) => publicProduct(toProduct(row))) });
}
